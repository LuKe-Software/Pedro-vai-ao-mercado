// Cena de história — fase 1: narrativa | fase 2: guia compacto de obstáculos.

import { ctx } from '../engine/canvas.js';
import { W, H } from '../engine/constants.js';
import { wasActionJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';

// ─── FASE 1: história ─────────────────────────────────────────────────────────
const STORY = [
  { t: 'Sao Paulo.',                       c: '#9AAABB', b: false },
  { t: 'Quinta-feira, final de tarde.',     c: '#9AAABB', b: false },
  { t: '',                                  c: '',        b: false },
  { t: 'MAE: "Pedro! Vai no mercado',       c: '#FFCC88', b: false },
  { t: 'buscar o bolo do aniversario',      c: '#FFCC88', b: false },
  { t: 'do seu pai!"',                      c: '#FFCC88', b: false },
  { t: '',                                  c: '',        b: false },
  { t: 'PEDRO (12 anos):',                  c: '#88CCFF', b: true  },
  { t: '"Agora, mae?! Ta longe!"',          c: '#88CCFF', b: false },
  { t: '',                                  c: '',        b: false },
  { t: 'MAE: "O mercado fecha as 18h!',     c: '#FFCC88', b: false },
  { t: 'Voce tem 60 SEGUNDOS!',             c: P.MARKET_RED, b: true },
  { t: 'Corra, meu filho!"',               c: '#FFCC88', b: false },
  { t: '',                                  c: '',        b: false },
  { t: 'Pedro pegou o dinheiro,',           c: P.WHITE,   b: false },
  { t: 'colocou o bone e saiu',             c: P.WHITE,   b: false },
  { t: 'disparado pela cidade.',            c: P.WHITE,   b: false },
];

const FLAT  = STORY.map(l => l.t).join('\n');
const TOTAL = FLAT.length;

// ─── FASE 2: guia de obstáculos (compacto) ────────────────────────────────────
// action: 'pule' = verde, 'agache' = vermelho (precisa de S/↓)
const GUIDE = [
  { name: 'BURACO',    action: 'pule',   color: '#555',        special: false },
  { name: 'IDOSO',     action: 'pule',   color: P.ELDER_GRAY,  special: false },
  { name: 'ARVORE',    action: 'pule',   color: P.TREE_GREEN,  special: false },
  { name: 'GATO',      action: 'pule',   color: P.CAT_ORANGE,  special: false },
  { name: 'CACHORRO',  action: 'pule',   color: P.DOG_BROWN,   special: false },
  { name: 'LADRAO',    action: 'pule!',  color: '#282828',     special: true  },
  { name: 'AVE',       action: 'agache', color: '#606060',     special: true  },
];

// ─── Estado ───────────────────────────────────────────────────────────────────
let phase = 'story';
let charCount = 0, charTimer = 0;
let done = false, holdTimer = 0;
let blinkTimer = 0, blinkOn = true;
const HOLD = 120;

export default {
  enter() {
    clearAll();
    phase = 'story';
    charCount = 0; charTimer = 0;
    done = false; holdTimer = 0;
    blinkTimer = 0; blinkOn = true;
  },

  update(dt) {
    blinkTimer++;
    if (blinkTimer >= 25) { blinkTimer = 0; blinkOn = !blinkOn; }

    if (phase === 'story') {
      if (!done) {
        charTimer++;
        if (charTimer >= 2) { charTimer = 0; charCount = Math.min(charCount + 1, TOTAL); if (charCount >= TOTAL) done = true; }
      } else {
        holdTimer++;
        if (holdTimer >= HOLD) { phase = 'guide'; return; }
      }
      if (wasActionJustPressed()) {
        if (!done) { charCount = TOTAL; done = true; }
        else        { phase = 'guide'; blinkTimer = 0; blinkOn = true; }
      }
    } else {
      if (wasActionJustPressed()) sceneManager.switch('game');
    }
  },

  render(alpha) {
    if (phase === 'story') renderStory();
    else                   renderGuide(blinkOn);
  },

  exit() {},
};

// ─── Fase 1 ───────────────────────────────────────────────────────────────────
function renderStory() {
  ctx.fillStyle = '#060412';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0A0820';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);

  ctx.fillStyle = 'rgba(16,8,40,0.88)';
  ctx.fillRect(4, 4, W - 8, H - 22);
  ctx.fillStyle = P.PEDRO_SHIRT;
  ctx.fillRect(4, 4, W - 8, 1);
  ctx.fillRect(4, H - 23, W - 8, 1);

  ctx.fillStyle = P.SUN_YELLOW;
  ctx.font = 'bold 6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PEDRO VAI AO MERCADO', W / 2, 14);
  ctx.fillStyle = '#2A2060';
  ctx.fillRect(10, 17, W - 20, 1);

  ctx.textAlign = 'left';
  let remaining = charCount;
  STORY.forEach((line, i) => {
    if (remaining < 0 || (!line.t && remaining <= i)) return;
    const chars = Math.min(remaining, line.t.length);
    remaining -= line.t.length + 1;
    if (!line.t || chars <= 0) return;
    ctx.fillStyle = line.c || P.WHITE;
    ctx.font = `${line.b ? 'bold ' : ''}5px monospace`;
    ctx.fillText(line.t.slice(0, chars), 10, 26 + i * 11);
  });

  if (!done && blinkOn) {
    ctx.fillStyle = P.WHITE;
    ctx.fillRect(10, 26 + STORY.length * 11 - 9, 3, 6);
  }
  if (done) {
    ctx.fillStyle = blinkOn ? P.SUN_YELLOW : '#555';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ ESPACO ] ver obstaculos', W / 2, H - 10);
  }
  ctx.textAlign = 'left';
}

// ─── Fase 2: guia compacto ────────────────────────────────────────────────────
function renderGuide(blinkOn) {
  ctx.fillStyle = '#060412';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0A0820';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);

  ctx.fillStyle = 'rgba(14,8,36,0.92)';
  ctx.fillRect(4, 4, W - 8, H - 22);
  ctx.fillStyle = P.MARKET_RED;
  ctx.fillRect(4, 4, W - 8, 1);
  ctx.fillRect(4, H - 23, W - 8, 1);

  // Título
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.fillText('OBSTACULOS DO CAMINHO', W / 2, 13);
  ctx.fillStyle = '#1E1040';
  ctx.fillRect(10, 16, W - 20, 1);

  // Lista compacta em 2 colunas
  const COL1_X = 8;
  const COL2_X = W / 2 + 2;
  const START_Y = 22;
  const ROW_H   = 18;
  const ICON_SZ = 8;  // ícone pequeno

  const col1 = GUIDE.filter((_, i) => i < 4);  // buraco, idoso, arvore, gato
  const col2 = GUIDE.filter((_, i) => i >= 4); // cachorro, ladrao, ave

  [col1, col2].forEach((col, colIdx) => {
    const ox = colIdx === 0 ? COL1_X : COL2_X;
    col.forEach((obs, i) => {
      const ry = START_Y + i * ROW_H;

      // Ícone pequeno (8×8)
      drawMiniIcon(ctx, ox, ry, obs.name, obs.color, ICON_SZ);

      // Nome do obstáculo
      ctx.fillStyle = P.WHITE;
      ctx.font = 'bold 4px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(obs.name, ox + ICON_SZ + 2, ry + 4);

      // Ação (verde = pule, vermelho = agache)
      ctx.fillStyle = obs.special ? '#FF6666' : '#66FF88';
      ctx.font = '4px monospace';
      ctx.fillText(obs.action.startsWith('pule') ? '↑ pule' : '↓ agache', ox + ICON_SZ + 2, ry + 11);

      // Estrela para os especiais (requerem agachar)
      if (obs.special) {
        // ★ indica obstáculo com efeito especial (LADRAO = perde R$50, AVE = agachar)
        ctx.fillStyle = P.SUN_YELLOW;
        ctx.fillText(obs.name === 'LADRAO' ? 'R$-50' : '★', ox + ICON_SZ + 44, ry + 4);
      }
    });
  });

  // Linha separadora
  ctx.fillStyle = '#1E1040';
  ctx.fillRect(8, START_Y + 4 * ROW_H, W - 16, 1);

  // ── CONTROLES ────────────────────────────────────────────────────────────
  const CY = START_Y + 4 * ROW_H + 6;

  ctx.fillStyle = P.ELDER_GRAY;
  ctx.font = 'bold 4px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CONTROLES', W / 2, CY + 4);

  ctx.fillStyle = '#66FF88';
  ctx.font = '4px monospace';
  ctx.fillText('ESPACO / ↑ = Pular', W / 2, CY + 12);
  ctx.fillStyle = '#FF6666';
  ctx.fillText('S / ↓ = Agachar', W / 2, CY + 20);

  ctx.fillStyle = '#555';
  ctx.fillText('★ = pode agachar OU pular', W / 2, CY + 29);

  // Press space
  ctx.fillStyle = blinkOn ? P.WHITE : '#444';
  ctx.font = 'bold 5px monospace';
  ctx.fillText('[ ESPACO ] JOGAR!', W / 2, H - 11);

  ctx.textAlign = 'left';
}

// ─── Ícones mini (8×8) ────────────────────────────────────────────────────────
function drawMiniIcon(ctx, x, y, name, color, sz) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, sz, sz);

  switch (name) {
    case 'BURACO':
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(x, y + 2, sz, sz - 2);
      ctx.fillStyle = '#060606';
      ctx.fillRect(x + 1, y + 3, sz - 2, sz - 3);
      ctx.fillStyle = '#5C3A10';
      ctx.fillRect(x + 1, y + 6, sz - 2, 2);
      break;
    case 'IDOSO':
      ctx.fillStyle = P.WHITE;
      ctx.fillRect(x + 4, y, 3, 3);
      ctx.fillStyle = P.ELDER_GRAY;
      ctx.fillRect(x + 3, y + 3, 4, 3);
      ctx.fillRect(x + 3, y + 6, 2, 2);
      ctx.fillRect(x + 5, y + 6, 2, 2);
      ctx.fillStyle = '#888';
      ctx.fillRect(x, y + 3, 3, 3);
      break;
    case 'ARVORE':
      ctx.fillStyle = P.TREE_GREEN;
      ctx.fillRect(x + 1, y, sz - 2, 4);
      ctx.fillRect(x, y + 3, sz, 3);
      ctx.fillStyle = '#6B3A1A';
      ctx.fillRect(x + 3, y + 6, 2, 2);
      break;
    case 'GATO':
      ctx.fillStyle = P.CAT_ORANGE;
      ctx.fillRect(x + 1, y + 2, 6, 5);
      ctx.fillRect(x + 2, y, 2, 3);
      ctx.fillRect(x + 5, y, 2, 3);
      ctx.fillStyle = '#FFEE00';
      ctx.fillRect(x + 2, y + 2, 1, 1);
      ctx.fillRect(x + 5, y + 2, 1, 1);
      break;
    case 'CACHORRO':
      ctx.fillStyle = P.DOG_BROWN;
      ctx.fillRect(x + 2, y + 2, 5, 5);
      ctx.fillRect(x, y + 1, 4, 5);
      ctx.fillStyle = '#C07030';
      ctx.fillRect(x - 1, y + 3, 3, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(x - 1, y + 3, 1, 1);
      break;
    case 'LADRAO':
      ctx.fillStyle = '#181818';
      ctx.fillRect(x + 2, y, 5, 4);
      ctx.fillStyle = '#DDD';
      ctx.fillRect(x + 2, y + 1, 5, 1);
      ctx.fillRect(x + 2, y + 4, 5, 4);
      ctx.fillStyle = P.SUN_YELLOW;
      ctx.fillRect(x, y + 4, 3, 4);
      break;
    case 'AVE':
      ctx.fillStyle = '#606060';
      ctx.fillRect(x + 2, y + 3, 5, 3);
      ctx.fillRect(x, y + 1, 8, 2);   // asas
      ctx.fillRect(x, y + 3, 2, 2);   // cabeça/bico
      ctx.fillStyle = '#CC0000';
      ctx.fillRect(x + 1, y + 2, 1, 1);  // olho vermelho
      break;
    default:
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
  }
}
