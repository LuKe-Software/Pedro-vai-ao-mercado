// Camadas de parallax: céu, sol, nuvens, prédios, chão.
// Coordenadas no espaço lógico 160×192.

import { W, H, GROUND_Y, RUN_SPEED } from '../engine/constants.js';
import { PALETTE as P } from '../assets/palette.js';

// ── Geração procedural de prédios (LCG) ──────────────────────────────────────
function buildingData(seed, count) {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
  return Array.from({ length: count }, (_, i) => {
    const w = Math.floor(rng() * 20 + 12);
    const h = Math.floor(rng() * 50 + 22);
    const style = Math.floor(rng() * 3);  // 0=moderno, 1=antigo, 2=arranha-céu
    const winCols = Math.floor(rng() * 3) + 1;
    const winRows = Math.floor(rng() * 2) + 1;
    return { w, h, style, winCols, winRows,
      color: [P.BUILDING_RED, P.BUILDING_BROWN, '#3A3A6A'][style],
      roofColor: ['#7A1A0A', '#3E1C02', '#22225A'][style],
    };
  });
}

const BUILDINGS = buildingData(37, 20);
const TOTAL_BW = BUILDINGS.reduce((s, b) => s + b.w + 3, 0);

// Nuvens (posição fixa no espaço do céu, scroll lento)
const CLOUDS = [
  { x: 20, y: 18, w: 28, h: 8 },
  { x: 80, y: 12, w: 22, h: 6 },
  { x: 130, y: 22, w: 18, h: 5 },
  { x: 55, y: 28, w: 14, h: 4 },
];

// Grupos de passarinhos — [x inicial, y, velocidade relativa]
const BIRD_GROUPS = [
  { birds: [{x:10,y:22},{x:18,y:20},{x:26,y:23}], spd: 0.7 },
  { birds: [{x:80,y:15},{x:90,y:13}],              spd: 0.85 },
  { birds: [{x:50,y:35}],                          spd: 0.6 },
  { birds: [{x:120,y:28},{x:130,y:26},{x:140,y:30},{x:150,y:27}], spd: 0.75 },
];

let buildingOffset = 0;
let cloudOffset = 0;
let birdOffsets = BIRD_GROUPS.map(() => 0);
let birdFlap = 0;
let birdFlapTimer = 0;

export function parallaxReset() {
  buildingOffset = 0;
  cloudOffset = 0;
  birdOffsets = BIRD_GROUPS.map(() => 0);
  birdFlap = 0;
  birdFlapTimer = 0;
}

export function parallaxUpdate() {
  buildingOffset = (buildingOffset + RUN_SPEED * 0.5) % TOTAL_BW;
  cloudOffset    = (cloudOffset    + RUN_SPEED * 0.1) % (W + 40);

  // Passarinhos: cada grupo tem velocidade própria, saem pela esquerda e reaparecem pela direita
  BIRD_GROUPS.forEach((g, i) => {
    birdOffsets[i] = (birdOffsets[i] + RUN_SPEED * g.spd) % (W + 60);
  });

  // Bater de asas: alterna a cada 12 frames
  birdFlapTimer++;
  if (birdFlapTimer >= 12) { birdFlap = 1 - birdFlap; birdFlapTimer = 0; }
}

export function parallaxRender(ctx) {
  // ── Céu ──────────────────────────────────────────────────────────────────
  // Gradiente simulado (dois tons de azul)
  ctx.fillStyle = '#4070E8';
  ctx.fillRect(0, 0, W, GROUND_Y / 2);
  ctx.fillStyle = P.SKY_BLUE;
  ctx.fillRect(0, GROUND_Y / 2, W, GROUND_Y / 2);

  // ── Sol ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.fillRect(126, 10, 14, 14);
  ctx.fillStyle = '#FCFC88';
  ctx.fillRect(128, 12, 10, 10);
  // Raios do sol
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.fillRect(124, 15, 2, 4);   // esq
  ctx.fillRect(140, 15, 2, 4);   // dir
  ctx.fillRect(130, 8, 4, 2);    // cima
  ctx.fillRect(130, 24, 4, 2);   // baixo
  ctx.fillRect(124, 10, 2, 2);   // diagonal
  ctx.fillRect(140, 10, 2, 2);

  // ── Nuvens ───────────────────────────────────────────────────────────────
  CLOUDS.forEach(c => {
    const cx = ((c.x - cloudOffset % (W + 40) + W + 40) % (W + 40)) - 20;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(cx, c.y, c.w, c.h);
    ctx.fillRect(cx + 3, c.y - 3, c.w - 8, c.h);  // topo arredondado
    ctx.fillRect(cx + 8, c.y - 5, c.w - 16, 5);    // pico
  });

  // ── Passarinhos ──────────────────────────────────────────────────────────
  BIRD_GROUPS.forEach((g, i) => {
    g.birds.forEach(b => {
      const bx = ((b.x - birdOffsets[i] + W + 60) % (W + 60)) - 10;
      drawBird(ctx, bx, b.y, birdFlap);
    });
  });

  // ── Prédios ───────────────────────────────────────────────────────────────
  let drawX = -buildingOffset;
  while (drawX < W + TOTAL_BW) {
    for (const b of BUILDINGS) {
      const bx = Math.round(drawX);
      const by = GROUND_Y - b.h;
      if (bx + b.w > 0 && bx < W) {
        drawBuilding(ctx, bx, by, b);
      }
      drawX += b.w + 3;
    }
  }

  // ── Chão / calçada ────────────────────────────────────────────────────────
  // Asfalto
  ctx.fillStyle = '#555';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Faixa de calçada
  ctx.fillStyle = P.SIDEWALK_TAN;
  ctx.fillRect(0, GROUND_Y + 5, W, 9);

  // Meio-fio
  ctx.fillStyle = P.WHITE;
  ctx.fillRect(0, GROUND_Y, W, 1);
  ctx.fillStyle = '#888';
  ctx.fillRect(0, GROUND_Y + 1, W, 2);

  // Faixa central do asfalto (linha pontilhada)
  ctx.fillStyle = '#777';
  ctx.fillRect(0, GROUND_Y + 16, W, 2);

  // Detalhes do asfalto
  ctx.fillStyle = '#444';
  for (let lx = (buildingOffset * 2) % 20; lx < W; lx += 20) {
    ctx.fillRect(lx, GROUND_Y + 20, 8, 1);
  }
}

// ── Passarinho individual ─────────────────────────────────────────────────────
function drawBird(ctx, x, y, flap) {
  ctx.fillStyle = '#223355';
  const ix = Math.round(x);
  const iy = Math.round(y);
  // Corpo central
  ctx.fillRect(ix + 2, iy, 2, 1);
  if (flap === 0) {
    // Asas para cima (V invertido)
    ctx.fillRect(ix,     iy - 1, 2, 1);  // asa esq
    ctx.fillRect(ix + 4, iy - 1, 2, 1);  // asa dir
  } else {
    // Asas para baixo (V)
    ctx.fillRect(ix,     iy + 1, 2, 1);
    ctx.fillRect(ix + 4, iy + 1, 2, 1);
  }
}

// ── Desenho de prédio individual ─────────────────────────────────────────────

function drawBuilding(ctx, bx, by, b) {
  // Sombra do prédio
  ctx.fillStyle = '#00000040';
  ctx.fillRect(bx + 2, by + 2, b.w, b.h);

  // Corpo principal
  ctx.fillStyle = b.color;
  ctx.fillRect(bx, by, b.w, b.h);

  // Face frontal (ligeiramente mais clara)
  ctx.fillStyle = lighten(b.color, 20);
  ctx.fillRect(bx + 1, by + 1, b.w - 2, b.h - 1);

  // Topo / telhado
  ctx.fillStyle = b.roofColor;
  ctx.fillRect(bx - 1, by - 2, b.w + 2, 3);
  ctx.fillStyle = lighten(b.roofColor, 15);
  ctx.fillRect(bx, by - 1, b.w, 1);

  // Janelas (grade)
  const winW = 3, winH = 3;
  const colGap = Math.floor((b.w - b.winCols * winW) / (b.winCols + 1));
  const rowGap = 4;

  for (let row = 0; row < b.winRows; row++) {
    for (let col = 0; col < b.winCols; col++) {
      const wx = bx + colGap * (col + 1) + winW * col;
      const wy = by + 4 + row * (winH + rowGap);
      if (wy + winH < GROUND_Y) {
        // Janela iluminada (50% das vezes)
        const lit = ((bx + col * 7 + row * 13) % 3) !== 0;
        ctx.fillStyle = lit ? '#FFE880' : '#223';
        ctx.fillRect(wx, wy, winW, winH);
        if (lit) {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(wx + 1, wy + 1, 1, 1);
        }
      }
    }
  }

  // Detalhe de borda lateral
  ctx.fillStyle = darken(b.color, 30);
  ctx.fillRect(bx, by, 1, b.h);
}

function lighten(hex, amt = 30) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 0xFF) + amt);
  const g = Math.min(255, ((n >>  8) & 0xFF) + amt);
  const b = Math.min(255,  (n & 0xFF)        + amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function darken(hex, amt = 30) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, ((n >> 16) & 0xFF) - amt);
  const g = Math.max(0, ((n >>  8) & 0xFF) - amt);
  const b = Math.max(0,  (n & 0xFF)        - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
