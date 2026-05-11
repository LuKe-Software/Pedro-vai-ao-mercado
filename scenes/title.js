// Tela inicial — título grande e centralizado no topo, cidade visível embaixo.

import { ctx } from '../engine/canvas.js';
import { W, H, GROUND_Y } from '../engine/constants.js';
import { wasActionJustPressed, wasJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';
import { audioInit, toggleMute, isMuted } from '../audio/synth.js';
import { musicStart, isMusicPlaying } from '../audio/music.js';
import { drawPedroSprite } from '../entities/pedro.js';
import { loadState } from '../storage.js';

const CITY = [
  { x:   0, h: 44, w: 20, win: 3 }, { x:  22, h: 56, w: 16, win: 4 },
  { x:  40, h: 34, w: 12, win: 2 }, { x:  54, h: 64, w: 18, win: 5 },
  { x:  74, h: 40, w: 14, win: 3 }, { x:  90, h: 52, w: 20, win: 4 },
  { x: 112, h: 30, w: 10, win: 2 }, { x: 124, h: 60, w: 22, win: 5 },
  { x: 148, h: 38, w: 14, win: 3 }, { x: 164, h: 50, w: 18, win: 4 },
];
const CITY_TOTAL = 184;
const STARS = Array.from({ length: 24 }, () => ({
  x: Math.random() * W, y: 1 + Math.random() * 28, r: Math.random(),
}));

let tick = 0;
let cityOffset = 0;
let pedroFrame = 0;
let pedroFrameTimer = 0;
let blinkTimer = 0;
let blinkOn = true;

export default {
  enter() {
    clearAll();
    tick = 0; cityOffset = 0;
    pedroFrame = 0; pedroFrameTimer = 0;
    blinkTimer = 0; blinkOn = true;
    // Inicializa o contexto de áudio (não toca ainda — espera interação)
    audioInit();
  },

  update(dt) {
    tick++;
    blinkTimer++;
    if (blinkTimer >= 28) { blinkTimer = 0; blinkOn = !blinkOn; }
    cityOffset = (cityOffset + 0.4) % CITY_TOTAL;
    pedroFrameTimer++;
    if (pedroFrameTimer >= 7) { pedroFrame = 1 - pedroFrame; pedroFrameTimer = 0; }
    if (wasJustPressed('KeyM')) toggleMute();
    if (wasJustPressed('KeyT')) { sceneManager.switch('scores', { newEntryRank: -1 }); return; }
    if (wasActionJustPressed()) {
      audioInit();
      if (!isMusicPlaying()) musicStart();
      sceneManager.switch('story');
    }
  },

  render(alpha) {
    // ── Fundo de céu noturno ───────────────────────────────────────────────
    ctx.fillStyle = '#0E0828';
    ctx.fillRect(0, 0, W, 60);
    ctx.fillStyle = '#1E1050';
    ctx.fillRect(0, 60, W, 24);
    ctx.fillStyle = '#5A2010';
    ctx.fillRect(0, 84, W, 16);
    ctx.fillStyle = '#AA4010';
    ctx.fillRect(0, 100, W, 14);

    // Estrelas
    STARS.forEach(s => {
      const v = Math.floor((0.5 + 0.5 * Math.sin(tick * 0.05 + s.r * 6.28)) * 190 + 65);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    });

    // Lua
    ctx.fillStyle = '#FFFCE0';
    ctx.fillRect(138, 4, 10, 10);
    ctx.fillStyle = '#FFEE88';
    ctx.fillRect(140, 6, 6, 6);
    ctx.fillStyle = '#F0D060';
    ctx.fillRect(144, 4, 2, 2);

    // ══════════════════════════════════════════════════════════════════════
    // TÍTULO GRANDE — centro-topo
    // ══════════════════════════════════════════════════════════════════════
    ctx.textAlign = 'center';

    // Sombra do título
    ctx.fillStyle = '#440000';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PEDRO', W / 2 + 1, 22 + 1);
    ctx.fillStyle = '#446600';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('VAI AO', W / 2 + 1, 32 + 1);
    ctx.fillStyle = '#004488';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('MERCADO', W / 2 + 1, 46 + 1);

    // Texto principal
    ctx.fillStyle = P.MARKET_RED;
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PEDRO', W / 2, 22);

    ctx.fillStyle = P.SUN_YELLOW;
    ctx.font = 'bold 7px monospace';
    ctx.fillText('VAI AO', W / 2, 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('MERCADO', W / 2, 46);

    // Linha decorativa abaixo do título
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(14, 50, W - 28, 1);
    ctx.fillStyle = '#334';
    ctx.fillRect(14, 51, W - 28, 1);

    // ── Cidade silhueta ────────────────────────────────────────────────────
    CITY.forEach(b => {
      for (let rep = 0; rep < 2; rep++) {
        const bx = Math.round((b.x - cityOffset + CITY_TOTAL * 2) % CITY_TOTAL + rep * CITY_TOTAL - CITY_TOTAL * 0.5);
        if (bx + b.w < 0 || bx > W) continue;
        ctx.fillStyle = '#0A0618';
        ctx.fillRect(bx, 114 - b.h, b.w, b.h);
        ctx.fillStyle = '#110820';
        ctx.fillRect(bx + 1, 116 - b.h, b.w - 2, b.h);
        ctx.fillStyle = '#FFEE44';
        for (let j = 0; j < b.win; j++) {
          const wx = bx + 2 + j * Math.floor((b.w - 2) / b.win);
          if (((bx + j * 7 + b.h) % 3) !== 0) ctx.fillRect(wx, 118 - b.h + j * 8, 2, 2);
        }
      }
    });

    // ── Chão / rua ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 114, W, H - 114);
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 114, W, 1);
    ctx.fillStyle = P.SIDEWALK_TAN;
    ctx.fillRect(0, 115, W, 6);
    ctx.fillStyle = '#444';
    for (let lx = (cityOffset * 2.5) % 24; lx < W; lx += 24) {
      ctx.fillRect(Math.round(lx), 126, 12, 1);
    }

    // ── Pedro correndo ─────────────────────────────────────────────────────
    drawPedroSprite(ctx, 26, 121, pedroFrame);

    // ── Rodapé ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(4,2,12,0.90)';
    ctx.fillRect(0, H - 22, W, 22);
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(0, H - 22, W, 1);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, H - 12, W, 1);

    const { highScore = 0 } = loadState();

    // Linha superior do rodapé
    ctx.font = '4px monospace';
    ctx.fillStyle = highScore > 0 ? '#AAA' : '#333';
    ctx.textAlign = 'left';
    ctx.fillText(highScore > 0 ? `REC: ${highScore} pts` : '', 3, H - 15);

    ctx.fillStyle = '#445566';
    ctx.textAlign = 'center';
    ctx.fillText('[T] TOP 10', W / 2, H - 15);

    ctx.fillStyle = '#444';
    ctx.textAlign = 'right';
    ctx.fillText(`[M] ${isMuted() ? 'OFF' : 'SOM'}`, W - 3, H - 15);

    // Linha inferior do rodapé
    if (blinkOn) {
      ctx.fillStyle = P.WHITE;
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ESPACO ] JOGAR', W / 2, H - 5);
    }

    ctx.textAlign = 'left';
  },

  exit() {},
};
