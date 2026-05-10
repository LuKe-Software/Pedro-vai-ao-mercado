// Cena principal de gameplay.
// Mecânicas: 3 vidas, R$200 (ladrão rouba R$50), intro com casinha.

import { ctx } from '../engine/canvas.js';
import { W, H, GROUND_Y, PEDRO_X, RUN_SPEED, TIMER_SECONDS, VICTORY_DISTANCE } from '../engine/constants.js';
import { wasActionJustPressed, wasJustPressed, isDown, clearAll } from '../engine/input.js';
import { aabb } from '../engine/collision.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';
import { toggleMute, isMuted } from '../audio/synth.js';
import { musicStop } from '../audio/music.js';
import { SFX } from '../audio/sfx.js';
import { Pedro } from '../entities/pedro.js';
import {
  spawnObstacle, updateObstacles, renderObstacles,
  getActiveObstacles, resetObstacles, OBS_TYPES, OBS
} from '../entities/obstacles.js';
import { parallaxReset, parallaxUpdate, parallaxRender } from '../entities/parallax.js';
import { saveState, loadState } from '../storage.js';

// ── RNG (LCG — Numerical Recipes) ────────────────────────────────────────────
let rngSeed = 12345;
function rng() { rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0; return rngSeed / 0xFFFFFFFF; }
function randInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

// ── Estado ────────────────────────────────────────────────────────────────────
let pedro = null;
let worldDistance = 0;
let timer = 0;
let lives = 3;
let money = 200;
let nextSpawnDist = 0;
let paused = false;
let deathReason = null;
let transitioning = false;
let transitionTimer = 0;
const TRANSITION_FRAMES = 55;

// ── Intro ─────────────────────────────────────────────────────────────────────
let introPhase = true;
let introPedroX = 24.0;        // Pedro começa na porta da casinha
const INTRO_TARGET_X = PEDRO_X; // vai até x=32
const INTRO_SPEED   = 0.22;     // px/frame
let introFrames = 0;

// A casa fica em coordenadas de mundo — scrollará para fora naturalmente
const HOUSE_WORLD_X = -6;

function marketScreenX() { return VICTORY_DISTANCE - worldDistance; }

export default {
  enter() {
    clearAll();
    rngSeed = 12345;
    worldDistance = 0;
    timer = TIMER_SECONDS * 60;
    lives = 3;
    money = 200;
    paused = false;
    deathReason = null;
    transitioning = false;
    transitionTimer = 0;
    nextSpawnDist = 160;
    pedro = new Pedro();
    pedro.x = 24;
    resetObstacles();
    parallaxReset();
    introPhase = true;
    introPedroX = 24.0;
    introFrames = 0;
  },

  update(dt) {
    // ── Transição de saída ───────────────────────────────────────────────────
    if (transitioning) {
      transitionTimer++;
      if (transitionTimer >= TRANSITION_FRAMES) {
        musicStop();
        const score = Math.floor(worldDistance / 10);
        if (deathReason === 'win') {
          const timeLeft = Math.ceil(timer / 60);
          const bonus = timeLeft * 10;
          const total = score + bonus;
          updateHighScore(total);
          sceneManager.switch('victory', { score, timeLeft, bonus, worldDistance });
        } else {
          sceneManager.switch('gameover', { reason: deathReason, score, lives, money });
        }
      }
      return;
    }

    // ── INTRO: Pedro saindo da casa ──────────────────────────────────────────
    if (introPhase) {
      introFrames++;
      introPedroX += INTRO_SPEED;
      pedro.x = Math.round(Math.min(introPedroX, INTRO_TARGET_X));
      // Animação de corrida durante o intro
      pedro.frameTimer++;
      if (pedro.frameTimer >= 7) { pedro.frame = 1 - pedro.frame; pedro.frameTimer = 0; }
      if (introPedroX >= INTRO_TARGET_X) {
        introPhase = false;
        pedro.x = PEDRO_X;
      }
      return;
    }

    // ── Pausa ────────────────────────────────────────────────────────────────
    if (wasJustPressed('KeyP') || wasJustPressed('Escape')) paused = !paused;
    if (wasJustPressed('KeyM')) toggleMute();
    if (paused) return;

    // ── Input ─────────────────────────────────────────────────────────────────
    if (wasActionJustPressed()) pedro.jump();
    if (isDown('ArrowDown') || isDown('KeyS')) pedro.duck();
    else pedro.standUp();

    pedro.update(dt);

    // ── Timer ─────────────────────────────────────────────────────────────────
    timer--;
    if (timer > 0 && timer <= 600 && timer % 60 === 0) SFX.tick();
    if (timer <= 0) { timer = 0; triggerDeath('timeout'); return; }

    // ── Scroll ───────────────────────────────────────────────────────────────
    worldDistance += RUN_SPEED;
    parallaxUpdate();

    // ── Vitória ───────────────────────────────────────────────────────────────
    if (worldDistance >= VICTORY_DISTANCE - PEDRO_X) { triggerDeath('win'); return; }

    // ── Spawn de obstáculos ───────────────────────────────────────────────────
    if (worldDistance >= nextSpawnDist && worldDistance < VICTORY_DISTANCE - 220) {
      const typeIdx = Math.floor(rng() * OBS_TYPES.length);
      spawnObstacle(OBS_TYPES[typeIdx], W + 20);
      const tr = 1 - (timer / (TIMER_SECONDS * 60));
      nextSpawnDist = worldDistance + randInt(Math.max(60, 115 - tr * 55), Math.max(90, 150 - tr * 60));
    }

    updateObstacles();

    // ── Colisão ───────────────────────────────────────────────────────────────
    // Pedro é invulnerável enquanto o flashTimer está ativo
    if (pedro.flashTimer <= 0 && !deathReason) {
      const pBox = pedro.hitbox;
      for (const obs of getActiveObstacles()) {
        if (!aabb(pBox, obs.hitbox)) continue;

        if (obs.type === OBS.THIEF) {
          // Ladrão rouba R$50 (não perde vida)
          SFX.hit();
          money = Math.max(0, money - 50);
          pedro.flashTimer = 90;   // invulnerabilidade visual
          if (money <= 0) { triggerDeath('nomoney'); return; }
        } else {
          // Demais obstáculos: perde uma vida
          SFX.hit();
          lives--;
          pedro.flashTimer = 90;
          if (lives <= 0) { triggerDeath('nolives'); return; }
        }
        break;  // só um hit por frame
      }
    }
  },

  render(alpha) {
    parallaxRender(ctx);

    // Casa: scrolls with world after intro ends
    const houseScreenX = HOUSE_WORLD_X - worldDistance;
    if (houseScreenX + 36 > -4) drawHouse(ctx, houseScreenX);

    // Placa do mercado
    const mx = Math.round(marketScreenX());
    if (mx < W + 50) drawMarket(ctx, mx);

    renderObstacles(ctx);
    pedro.render(ctx);
    drawHUD(ctx, worldDistance, timer, lives, money, paused, pedro.ducking, introPhase);

    // Texto de intro
    if (introPhase) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, 12);
      ctx.fillStyle = P.SUN_YELLOW;
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Vai buscar o bolo, Pedro!', W / 2, 8);
      ctx.textAlign = 'left';
    }

    // Fade de transição
    if (transitioning) {
      const a = Math.min(1, transitionTimer / TRANSITION_FRAMES);
      ctx.fillStyle = `rgba(0,0,0,${a.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }
  },

  exit() { resetObstacles(); },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerDeath(reason) {
  if (deathReason || transitioning) return;
  deathReason = reason;
  transitioning = true;
  transitionTimer = 0;
  if (reason === 'win') SFX.victory();
  else if (reason === 'nolives' || reason === 'nomoney') SFX.gameover();
}

function updateHighScore(score) {
  const state = loadState();
  if (score > (state.highScore || 0)) { state.highScore = score; saveState(state); }
}

// ── HUD ───────────────────────────────────────────────────────────────────────

function drawHUD(ctx, dist, timerFrames, lives, money, paused, ducking, intro) {
  if (intro) return;  // sem HUD durante o intro

  const secs  = Math.ceil(timerFrames / 60);
  const score = Math.floor(dist / 10);
  const isLow = secs <= 10;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, 12);

  // Timer
  ctx.fillStyle = isLow ? P.MARKET_RED : '#88FF88';
  ctx.font = `${isLow ? 'bold ' : ''}4px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`T:${String(secs).padStart(2, '0')}`, 2, 8);

  // Vidas (corações)
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 24 + i * 9, 2, i < lives);
  }

  // Dinheiro
  ctx.fillStyle = money <= 50 ? '#FF8844' : (money <= 100 ? '#FFCC44' : '#88FF44');
  ctx.font = '4px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`R$${money}`, W / 2, 8);

  // Score
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.textAlign = 'right';
  ctx.fillText(`${score}m`, W - 2, 8);

  if (isMuted()) {
    ctx.fillStyle = '#444';
    ctx.font = '3px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SOM OFF]', W / 2, 3);
  }

  if (ducking && !paused) {
    ctx.fillStyle = '#88AAFF';
    ctx.font = '3px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[AGACHADO]', W / 2, 3);
  }

  // Pausa
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 12, W, H - 12);
    ctx.fillStyle = P.WHITE;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', W / 2, H / 2 - 12);
    ctx.fillStyle = P.ELDER_GRAY;
    ctx.font = '4px monospace';
    ctx.fillText('ESPACO / ↑ = Pular', W / 2, H / 2 + 2);
    ctx.fillText('S / ↓ = Agachar', W / 2, H / 2 + 10);
    ctx.fillText('[P] continuar   [M] som', W / 2, H / 2 + 20);
  }

  ctx.textAlign = 'left';
}

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#FF3333' : '#442222';
  // Coração pixel-art (7×6)
  ctx.fillRect(x + 1, y,     2, 1);
  ctx.fillRect(x + 4, y,     2, 1);
  ctx.fillRect(x,     y + 1, 7, 2);
  ctx.fillRect(x + 1, y + 3, 5, 1);
  ctx.fillRect(x + 2, y + 4, 3, 1);
  ctx.fillRect(x + 3, y + 5, 1, 1);
}

// ── Casinha ───────────────────────────────────────────────────────────────────

function drawHouse(ctx, screenX) {
  const bx = Math.round(screenX);
  const by = GROUND_Y;

  // Chaminé
  ctx.fillStyle = '#7A3A10';
  ctx.fillRect(bx + 5, by - 30, 4, 8);
  ctx.fillStyle = '#5A2A08';
  ctx.fillRect(bx + 4, by - 32, 6, 3);
  // Fumaça
  ctx.fillStyle = '#888';
  ctx.fillRect(bx + 5, by - 35, 4, 3);
  ctx.fillStyle = '#AAA';
  ctx.fillRect(bx + 4, by - 38, 5, 3);

  // Telhado (triângulo aproximado com 5 camadas)
  ctx.fillStyle = '#CC3300';
  ctx.fillRect(bx + 10, by - 26, 14, 2);
  ctx.fillRect(bx + 8,  by - 24, 18, 2);
  ctx.fillRect(bx + 5,  by - 22, 24, 2);
  ctx.fillRect(bx + 3,  by - 20, 28, 2);
  ctx.fillRect(bx + 1,  by - 18, 32, 2);
  // Borda do telhado
  ctx.fillStyle = '#AA2200';
  ctx.fillRect(bx,      by - 16, 34, 2);

  // Paredes (cor creme)
  ctx.fillStyle = '#EDE0C0';
  ctx.fillRect(bx + 1, by - 14, 32, 14);
  // Tijolos (linhas sutis)
  ctx.fillStyle = '#DDD0A8';
  for (let wy = by - 14; wy < by; wy += 4) ctx.fillRect(bx + 1, wy, 32, 1);

  // Janela (esquerda)
  ctx.fillStyle = '#88AACC';
  ctx.fillRect(bx + 3, by - 12, 9, 7);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(bx + 7, by - 12, 1, 7);
  ctx.fillRect(bx + 3, by - 9,  9, 1);
  ctx.fillStyle = '#AACCEE';
  ctx.fillRect(bx + 3, by - 12, 4, 3);

  // Porta (DIREITA — Pedro sai por aqui)
  ctx.fillStyle = '#7A3A10';
  ctx.fillRect(bx + 22, by - 11, 1, 11);   // frame esq
  ctx.fillRect(bx + 32, by - 11, 1, 11);   // frame dir
  ctx.fillRect(bx + 22, by - 12, 11, 1);   // frame top
  ctx.fillStyle = '#5C2800';
  ctx.fillRect(bx + 23, by - 11, 9, 11);   // porta
  ctx.fillStyle = '#3A1800';
  ctx.fillRect(bx + 24, by - 10, 7, 9);    // interior
  // Maçaneta
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(bx + 24, by - 6, 2, 2);

  // Degrau
  ctx.fillStyle = '#BBB';
  ctx.fillRect(bx + 21, by, 12, 2);
}

// ── Mercado ───────────────────────────────────────────────────────────────────

function drawMarket(ctx, screenX) {
  const bx = Math.round(screenX);
  const by = GROUND_Y;
  ctx.fillStyle = '#8B1A0A';
  ctx.fillRect(bx, by - 56, 50, 56);
  ctx.fillStyle = P.MARKET_RED;
  ctx.fillRect(bx + 2, by - 54, 46, 54);
  ctx.fillStyle = '#AA2200';
  ctx.fillRect(bx - 3, by - 58, 56, 5);
  ctx.fillStyle = '#CC3300';
  ctx.fillRect(bx - 2, by - 57, 54, 3);
  [[4, 46], [16, 46], [28, 46], [38, 46], [4, 36], [16, 36], [28, 36], [38, 36]].forEach(([dx, dy]) => {
    ctx.fillStyle = '#FFEE88';
    ctx.fillRect(bx + dx, by - dy, 7, 7);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(bx + dx + 1, by - dy + 1, 5, 5);
    ctx.fillStyle = '#CC3300';
    ctx.fillRect(bx + dx + 3, by - dy, 1, 7);
    ctx.fillRect(bx + dx, by - dy + 3, 7, 1);
  });
  ctx.fillStyle = '#5C2800';
  ctx.fillRect(bx + 17, by - 22, 16, 22);
  ctx.fillStyle = '#4A2000';
  ctx.fillRect(bx + 18, by - 21, 14, 20);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(bx + 29, by - 12, 2, 2);
  ctx.fillStyle = P.WHITE;
  ctx.fillRect(bx + 4, by - 30, 42, 9);
  ctx.fillStyle = '#CC0000';
  ctx.fillRect(bx + 5, by - 29, 40, 7);
  ctx.fillStyle = P.WHITE;
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MERCADO', bx + 6, by - 23);
  ctx.fillStyle = P.SIDEWALK_TAN;
  ctx.fillRect(bx - 4, by, 58, 8);
}
