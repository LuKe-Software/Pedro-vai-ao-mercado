// Entidade Pedro — criança, estilo Pitfall!
// Boné vermelho, cabeça grande (proporção infantil), braços balançam opostos às pernas.

import { GRAVITY, JUMP_VELOCITY, GROUND_Y, PEDRO_X, PEDRO_WIDTH, PEDRO_HEIGHT } from '../engine/constants.js';
import { PALETTE as P } from '../assets/palette.js';
import { SFX } from '../audio/sfx.js';

const DUCK_HEIGHT = 10;

export class Pedro {
  constructor() {
    this.x = PEDRO_X;
    this.y = GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.frame = 0;
    this.frameTimer = 0;
    this.dead = false;
    this.flashTimer = 0;
    this.ducking = false;
  }

  reset() {
    this.y = GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.frame = 0;
    this.frameTimer = 0;
    this.dead = false;
    this.flashTimer = 0;
    this.ducking = false;
  }

  jump() {
    if (this.onGround && !this.dead && !this.ducking) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.frame = 2;
      SFX.jump();
    }
  }

  duck() {
    if (this.onGround && !this.dead) { this.ducking = true; this.frame = 3; }
  }

  standUp() { this.ducking = false; }

  update(dt) {
    if (this.dead) return;
    this.vy += GRAVITY;
    this.y  += this.vy;
    if (this.y >= GROUND_Y) {
      if (!this.onGround) SFX.land();
      this.y = GROUND_Y; this.vy = 0; this.onGround = true;
    }
    if (this.onGround && !this.ducking) {
      this.frameTimer++;
      if (this.frameTimer >= 6) { this.frame = 1 - this.frame; this.frameTimer = 0; }
    } else if (!this.onGround) {
      this.frame = 2;
    }
    if (this.flashTimer > 0) this.flashTimer--;
  }

  get hitbox() {
    if (this.ducking) return { x: this.x - 5, y: this.y - DUCK_HEIGHT, w: 10, h: 9 };
    return { x: this.x - 5, y: this.y - 16, w: 10, h: 15 };
  }

  render(ctx) {
    if (this.flashTimer > 0 && this.flashTimer % 4 < 2) {
      drawFlash(ctx, this.x, this.y, this.ducking); return;
    }
    if (this.ducking) drawPedroDuck(ctx, this.x, this.y);
    else              drawPedro(ctx, this.x, this.y, this.frame);
  }
}

export { drawPedro as drawPedroSprite };

// ─── Desenho principal — criança estilo Pitfall! ──────────────────────────────
// cx = centro horizontal, by = base (pés no chão). Sprite: 12 × 18 px lógicos.
function drawPedro(ctx, cx, by, frame) {
  const lx = Math.round(cx - PEDRO_WIDTH / 2);
  const ty = Math.round(by - PEDRO_HEIGHT);

  // ── Boné (baseball cap, visor aponta para a direita) ────────────────────
  ctx.fillStyle = '#CC2200';
  ctx.fillRect(lx + 2, ty,      7, 2);   // cúpula
  ctx.fillRect(lx + 1, ty + 1,  9, 2);   // aba do boné
  ctx.fillStyle = '#EE3322';
  ctx.fillRect(lx + 2, ty + 1,  5, 1);   // highlight
  ctx.fillStyle = '#AA1100';
  ctx.fillRect(lx + 9, ty + 3,  3, 1);   // viseira
  ctx.fillRect(lx + 9, ty + 4,  2, 1);   // borda inferior viseira
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(lx + 5, ty + 1,  2, 1);   // logo no boné

  // ── Cabelo (atrás do boné — esquerda) ────────────────────────────────────
  ctx.fillStyle = P.PEDRO_HAIR;
  ctx.fillRect(lx + 1, ty + 2,  2, 4);

  // ── Cabeça/rosto — proporção infantil (cabeça grande) ────────────────────
  ctx.fillStyle = P.PEDRO_SKIN;
  ctx.fillRect(lx + 2, ty + 3,  8, 5);   // rosto
  ctx.fillRect(lx + 1, ty + 4,  1, 3);   // bochecha/orelha esq

  // Olho (grande, expressivo)
  ctx.fillStyle = '#2A0800';
  ctx.fillRect(lx + 7, ty + 4,  3, 2);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(lx + 9, ty + 4,  1, 1);   // reflexo

  // Sorriso de criança
  ctx.fillStyle = '#C06040';
  ctx.fillRect(lx + 4, ty + 7,  3, 1);
  ctx.fillRect(lx + 7, ty + 6,  1, 1);   // canto
  ctx.fillRect(lx + 3, ty + 6,  1, 1);

  // Bochecha corada
  ctx.fillStyle = '#FFAAAA';
  ctx.fillRect(lx + 2, ty + 6,  2, 1);

  // ── Camisa ───────────────────────────────────────────────────────────────
  ctx.fillStyle = P.PEDRO_SHIRT;
  ctx.fillRect(lx + 1, ty + 8,  10, 4);
  ctx.fillStyle = '#D8E8FF';
  ctx.fillRect(lx + 4, ty + 8,  4,  1);  // gola
  ctx.fillStyle = '#0A68CC';
  ctx.fillRect(lx + 1, ty + 9,  1,  2);  // dobra da manga esq

  // ── Nota de dinheiro (mão direita de Pedro — vai buscar o bolo!) ─────────
  drawMoney(ctx, lx + 11, ty + 9);

  // ── Shorts (curto — ele é criança) ────────────────────────────────────────
  ctx.fillStyle = '#1A3060';
  ctx.fillRect(lx + 2, ty + 12, 8,  2);

  // ── Braços, pernas e tênis (animação Pitfall! — braço oposto à perna) ─────
  if (frame === 2) {
    // PULO — braços erguidos, pernas dobradas
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(lx - 1, ty + 8,  2, 3);   // braço esq (levantado)
    ctx.fillRect(lx + 11,ty + 8,  2, 3);   // braço dir (levantado)
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx - 1, ty + 11, 2, 1);   // mão esq
    ctx.fillRect(lx + 11,ty + 11, 2, 1);   // mão dir
    // Pernas dobradas para cima
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 2, ty + 14, 3, 1);
    ctx.fillRect(lx + 7, ty + 14, 3, 1);
    // Tênis
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(lx + 1, ty + 14, 4, 3);
    ctx.fillRect(lx + 7, ty + 14, 4, 3);
    ctx.fillStyle = '#555';
    ctx.fillRect(lx + 1, ty + 17, 4, 1);
    ctx.fillRect(lx + 7, ty + 17, 4, 1);

  } else if (frame === 0) {
    // CORRIDA A — perna dir. frente, braço ESQ. frente (Pitfall cross-pattern)
    // Braço esquerdo FRENTE (estendido para baixo-direita)
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(lx - 1, ty + 9,  3, 3);
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx - 1, ty + 12, 2, 1);   // mão esq (frente)
    // Braço direito ATRÁS
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(lx + 10,ty + 10, 2, 2);
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 10,ty + 12, 2, 1);   // mão dir (atrás)
    // Perna dir (frente — mais baixa)
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 7, ty + 14, 3, 2);
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(lx + 6, ty + 15, 5, 2);   // tênis dir
    ctx.fillStyle = '#555';
    ctx.fillRect(lx + 6, ty + 17, 5, 1);
    // Perna esq (atrás — mais alta)
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 2, ty + 14, 3, 1);
    ctx.fillStyle = '#DCDCDC';
    ctx.fillRect(lx + 1, ty + 14, 4, 2);   // tênis esq
    ctx.fillStyle = '#444';
    ctx.fillRect(lx + 1, ty + 15, 4, 1);

  } else {
    // CORRIDA B — perna esq. frente, braço DIR. frente (Pitfall cross-pattern)
    // Braço direito FRENTE
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(lx + 10,ty + 9,  3, 3);
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 11,ty + 12, 2, 1);
    // Braço esquerdo ATRÁS
    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(lx - 1, ty + 10, 2, 2);
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx - 1, ty + 12, 2, 1);
    // Perna esq (frente)
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 2, ty + 14, 3, 2);
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(lx + 1, ty + 15, 5, 2);   // tênis esq
    ctx.fillStyle = '#555';
    ctx.fillRect(lx + 1, ty + 17, 5, 1);
    // Perna dir (atrás)
    ctx.fillStyle = P.PEDRO_SKIN;
    ctx.fillRect(lx + 7, ty + 14, 3, 1);
    ctx.fillStyle = '#DCDCDC';
    ctx.fillRect(lx + 7, ty + 14, 5, 2);   // tênis dir
    ctx.fillStyle = '#444';
    ctx.fillRect(lx + 7, ty + 15, 5, 1);
  }
}

// ── Pedro agachado ────────────────────────────────────────────────────────────
function drawPedroDuck(ctx, cx, by) {
  const lx = Math.round(cx - PEDRO_WIDTH / 2);
  const ty = Math.round(by - 12);

  // Boné (agachado)
  ctx.fillStyle = '#CC2200';
  ctx.fillRect(lx + 3, ty,      6, 2);
  ctx.fillRect(lx + 2, ty + 1, 8, 2);
  ctx.fillStyle = '#AA1100';
  ctx.fillRect(lx + 9, ty + 2,  3, 1);

  ctx.fillStyle = P.PEDRO_HAIR;
  ctx.fillRect(lx + 1, ty + 1,  2, 3);

  // Rosto (comprimido — olhando para frente)
  ctx.fillStyle = P.PEDRO_SKIN;
  ctx.fillRect(lx + 2, ty + 2,  9, 4);
  ctx.fillStyle = '#2A0800';
  ctx.fillRect(lx + 8, ty + 3,  2, 1);   // olho

  // Corpo curvo (agachado)
  ctx.fillStyle = P.PEDRO_SHIRT;
  ctx.fillRect(lx + 2, ty + 6,  8, 2);
  ctx.fillStyle = '#D8E8FF';
  ctx.fillRect(lx + 4, ty + 6,  3, 1);

  drawMoney(ctx, lx + 10, ty + 6);

  // Shorts
  ctx.fillStyle = '#1A3060';
  ctx.fillRect(lx + 2, ty + 8,  8, 1);

  // Pernas dobradas (horizontais) + tênis
  ctx.fillStyle = P.PEDRO_SKIN;
  ctx.fillRect(lx,     ty + 9,  12, 1);
  ctx.fillStyle = '#F0F0F0';
  ctx.fillRect(lx - 1, ty + 9,  5, 3);   // tênis esq
  ctx.fillRect(lx + 8, ty + 9,  5, 3);   // tênis dir
  ctx.fillStyle = '#555';
  ctx.fillRect(lx - 1, ty + 11, 5, 1);
  ctx.fillRect(lx + 8, ty + 11, 5, 1);
}

// ── Nota de dinheiro ──────────────────────────────────────────────────────────
function drawMoney(ctx, x, y) {
  ctx.fillStyle = '#1A7A22';
  ctx.fillRect(x, y,     5, 3);
  ctx.fillStyle = '#2AAA30';
  ctx.fillRect(x + 1, y, 3, 1);
  ctx.fillStyle = '#C8A800';
  ctx.fillRect(x + 1, y + 1, 3, 1);
  ctx.fillStyle = '#0E5010';
  ctx.fillRect(x, y + 2,    5, 1);
}

function drawFlash(ctx, cx, by, ducking) {
  const lx = Math.round(cx - PEDRO_WIDTH / 2);
  const h  = ducking ? 12 : PEDRO_HEIGHT;
  ctx.fillStyle = '#FFF';
  ctx.fillRect(lx, Math.round(by - h), PEDRO_WIDTH, h);
}
