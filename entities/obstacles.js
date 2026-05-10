// Pool de obstáculos. Sprites redesenhados para melhor legibilidade em telas modernas.
// Coordenadas no espaço lógico 160×192. SCALE aplicado em main.js via ctx.scale.

import { GROUND_Y, RUN_SPEED, W, POOL_SIZE } from '../engine/constants.js';
import { PALETTE as P } from '../assets/palette.js';

export const OBS = {
  HOLE:  'hole',
  ELDER: 'elder',
  THIEF: 'thief',
  TREE:  'tree',
  CAT:   'cat',
  DOG:   'dog',
  BIRD:  'bird',  // ave que voa na altura da cabeça — agache para passar!
};

export const OBS_TYPES = [OBS.HOLE, OBS.ELDER, OBS.THIEF, OBS.TREE, OBS.CAT, OBS.DOG, OBS.BIRD];

class Obstacle {
  constructor() {
    this.active = false;
    this.type = OBS.HOLE;
    this.x = 0;
    this.y = GROUND_Y;
    this.w = 0;
    this.h = 0;
    this.vx = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.bounceY = 0;
    this.bounceDir = 1;
    this.flyHeight = 0;
    this.phase = 0;      // acumulador para ondas (ladrão pulando, ave oscilando)
    this.jumpY = 0;      // deslocamento vertical do ladrão
    this.swoopY = 0;     // oscilação visual da ave
  }

  activate(type, screenX) {
    this.active = true;
    this.type = type;
    this.x = screenX;
    this.y = GROUND_Y;
    this.animFrame = 0;
    this.animTimer = 0;
    this.bounceY = 0;
    this.bounceDir = 1;
    this.flyHeight = 0;
    this.phase = 0;
    this.jumpY = 0;
    this.swoopY = 0;

    switch (type) {
      case OBS.HOLE:  this.w = 18; this.h = 8;  this.vx = 0;    break;
      case OBS.ELDER: this.w = 16; this.h = 18; this.vx = -1;   break;
      case OBS.THIEF: this.w = 14; this.h = 18; this.vx = -1.5; break;
      case OBS.TREE:  this.w = 14; this.h = 26; this.vx = 0;    break;
      case OBS.CAT:   this.w = 12; this.h = 10; this.vx = -0.8; break;
      case OBS.DOG:   this.w = 16; this.h = 12; this.vx = -1.2; break;
      // AVE: voa a 15px do chão, batida de asas; agache para passar por baixo
      case OBS.BIRD:  this.w = 16; this.h = 6;  this.vx = -0.8; this.flyHeight = 22; break;
    }
  }

  deactivate() { this.active = false; }

  get hitbox() {
    const m = 2;  // margem
    switch (this.type) {
      case OBS.HOLE:
        return { x: this.x + m, y: this.y - 7, w: this.w - m * 2, h: 7 };
      case OBS.TREE:
        return { x: this.x + 5, y: this.y - 14, w: 4, h: 14 };
      case OBS.THIEF: {
        // Hitbox corpo inteiro (acompanha o salto) — Pedro deve PULAR para desviar.
        // Ducking NÃO evita o ladrão; só o pulo funciona.
        const ty = this.y + this.jumpY;
        const m = 2;
        return { x: this.x + m, y: ty - this.h + m, w: this.w - m * 2, h: this.h - m * 2 };
      }
      case OBS.BIRD: {
        // Hitbox estende do topo (y=10) até y=149 — coluna inteira da tela.
        // Pedro pulando (y_bottom mín ≈ 93) SEMPRE colide (93 > 10 ✓ e 93 < 149 ✓).
        // Pedro agachado (y_top = 150): 150 < 149 → FALSO → sem colisão ✓.
        // Única saída: agachar (S/↓).
        return { x: this.x + 2, y: 10, w: this.w - 4, h: 139 };
      }
      default:
        return { x: this.x + m, y: this.y - this.h + m, w: this.w - m * 2, h: this.h - m * 2 };
    }
  }

  update() {
    if (!this.active) return;
    this.x += -RUN_SPEED + this.vx;
    this.phase += 1;

    this.animTimer++;
    if (this.animTimer >= 8) { this.animFrame = 1 - this.animFrame; this.animTimer = 0; }

    // Ladrão pula enquanto corre (arco sinusoidal, permanece mais tempo no chão)
    if (this.type === OBS.THIEF) {
      this.jumpY = -Math.max(0, Math.sin(this.phase * 0.14) * 11);
    }

    // Ave oscila verticalmente (visual apenas — hitbox fixo no flyHeight base)
    if (this.type === OBS.BIRD) {
      this.swoopY = Math.sin(this.phase * 0.07) * 4;
    }

    // Gato: sem bounce vertical — apenas animação de patas
    // (bounceY removido; animFrame já alterna para as patas)

    if (this.x + this.w < -12) this.deactivate();
  }

  render(ctx) {
    if (!this.active) return;
    switch (this.type) {
      case OBS.HOLE:  drawHole(ctx, this);  break;
      case OBS.ELDER: drawElder(ctx, this); break;
      case OBS.THIEF: drawThief(ctx, this); break;
      case OBS.TREE:  drawTree(ctx, this);  break;
      case OBS.CAT:   drawCat(ctx, this);         break;
      case OBS.DOG:   drawDog(ctx, this);         break;
      case OBS.BIRD:  drawBirdObstacle(ctx, this); break;
    }
  }
}

// ─── Pool ────────────────────────────────────────────────────────────────────

const pool = Array.from({ length: POOL_SIZE }, () => new Obstacle());

export function spawnObstacle(type, screenX) {
  const obj = pool.find(o => !o.active);
  if (obj) obj.activate(type, screenX);
}
export function updateObstacles()          { pool.forEach(o => o.update()); }
export function renderObstacles(ctx)       { pool.forEach(o => o.render(ctx)); }
export function getActiveObstacles()       { return pool.filter(o => o.active); }
export function resetObstacles()           { pool.forEach(o => o.deactivate()); }

// ─── Sprites ─────────────────────────────────────────────────────────────────

function drawHole(ctx, o) {
  const rx = Math.round(o.x);
  const ry = Math.round(o.y);  // ry = GROUND_Y = superfície do asfalto

  // ── Asfalto quebrado nas bordas da abertura (nível da superfície) ────────
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(rx - 1, ry - 3, 3, 3);        // pedaço esq
  ctx.fillRect(rx + o.w - 2, ry - 3, 3, 3);  // pedaço dir

  // Rachadura/cratera: fragmentos levantados
  ctx.fillStyle = '#555';
  ctx.fillRect(rx, ry - 5, 4, 3);
  ctx.fillRect(rx + o.w - 4, ry - 5, 4, 3);
  ctx.fillRect(rx + 6, ry - 6, 6, 2);        // fragmento central levantado

  // ── Abertura do buraco (ao nível do chão) ────────────────────────────────
  ctx.fillStyle = '#0C0C0C';
  ctx.fillRect(rx + 1, ry - 3, o.w - 2, 3);  // boca do buraco

  // ── Profundidade: o buraco vai PARA BAIXO (no asfalto e embaixo) ─────────
  ctx.fillStyle = '#060606';
  ctx.fillRect(rx + 1, ry, o.w - 2, 10);     // poço profundo

  // Camadas de profundidade (mais escuro embaixo)
  ctx.fillStyle = '#050505';
  ctx.fillRect(rx + 2, ry + 4, o.w - 4, 6);
  ctx.fillStyle = '#020202';
  ctx.fillRect(rx + 3, ry + 7, o.w - 6, 3);

  // ── Terra e pedras visíveis no fundo ─────────────────────────────────────
  ctx.fillStyle = '#4A2A0A';      // terra escura
  ctx.fillRect(rx + 2, ry + 8, o.w - 4, 2);
  ctx.fillStyle = '#3A200A';
  ctx.fillRect(rx + 4, ry + 9, o.w - 8, 1);

  // Pedrinhas no fundo
  ctx.fillStyle = '#666';
  ctx.fillRect(rx + 3,  ry + 6, 2, 1);
  ctx.fillRect(rx + 10, ry + 5, 2, 1);
  ctx.fillRect(rx + 7,  ry + 8, 2, 1);

  // Raízes (linhas verticais no lado interno)
  ctx.fillStyle = '#2A1506';
  ctx.fillRect(rx + 2, ry + 3, 1, 5);
  ctx.fillRect(rx + o.w - 3, ry + 4, 1, 4);

  // ── Sombra projetada nas bordas internas (efeito de profundidade) ─────────
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(rx + 1, ry, 2, 10);            // sombra esq interna
  ctx.fillRect(rx + o.w - 3, ry, 2, 10);      // sombra dir interna
}

function drawElder(ctx, o) {
  const rx = Math.round(o.x);
  const ry = Math.round(o.y);

  // ── Carrinho de compras (à esquerda — idoso empurra em direção ao Pedro) ──
  // Estrutura do carrinho
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(rx, ry - 10, 7, 7);       // cesto
  ctx.fillStyle = '#888';
  ctx.fillRect(rx + 1, ry - 9, 5, 5);    // interior do cesto
  // Barra de empurrar
  ctx.fillStyle = '#999';
  ctx.fillRect(rx + 6, ry - 13, 2, 12);
  // Rodas
  ctx.fillStyle = '#333';
  ctx.fillRect(rx + 1, ry - 3, 2, 3);
  ctx.fillRect(rx + 4, ry - 3, 2, 3);
  ctx.fillStyle = '#555';
  ctx.fillRect(rx + 1, ry - 3, 2, 2);
  ctx.fillRect(rx + 4, ry - 3, 2, 2);
  // Compras dentro do carrinho
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.fillRect(rx + 1, ry - 9, 2, 3);
  ctx.fillStyle = P.MARKET_RED;
  ctx.fillRect(rx + 3, ry - 9, 2, 3);

  // ── Idoso (à direita do carrinho) ───────────────────────────────────────
  const bx = rx + 6;

  // Cabeça (cabelo branco)
  ctx.fillStyle = P.WHITE;
  ctx.fillRect(bx + 2, ry - 18, 6, 4);
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect(bx + 1, ry - 17, 2, 3);

  // Rosto
  ctx.fillStyle = '#D4A87C';
  ctx.fillRect(bx + 2, ry - 15, 5, 4);
  ctx.fillStyle = '#111';
  ctx.fillRect(bx + 5, ry - 13, 1, 1);  // olho

  // Corpo (casaco cinza, ligeiramente curvado)
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(bx + 1, ry - 11, 7, 6);
  ctx.fillStyle = '#888';
  ctx.fillRect(bx + 1, ry - 11, 1, 6);   // sombra lateral

  // Pernas
  ctx.fillStyle = '#666';
  if (o.animFrame === 0) {
    ctx.fillRect(bx + 1, ry - 5, 3, 5);
    ctx.fillRect(bx + 5, ry - 5, 3, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(bx + 1, ry - 1, 3, 1);
    ctx.fillRect(bx + 5, ry - 2, 3, 1);
  } else {
    ctx.fillRect(bx + 1, ry - 5, 3, 4);
    ctx.fillRect(bx + 5, ry - 5, 3, 5);
    ctx.fillStyle = '#222';
    ctx.fillRect(bx + 1, ry - 2, 3, 1);
    ctx.fillRect(bx + 5, ry - 1, 3, 1);
  }
}

function drawThief(ctx, o) {
  const rx = Math.round(o.x);
  // jumpY negativo = ladrão no ar; ry ajustado para o salto
  const ry = Math.round(o.y + (o.jumpY || 0));

  // ── Cabeça (capuz preto) ─────────────────────────────────────────────────
  ctx.fillStyle = '#101010';
  ctx.fillRect(rx + 1, ry - 18, 8, 6);
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect(rx + 2, ry - 15, 6, 2);   // máscara
  ctx.fillStyle = '#101010';
  ctx.fillRect(rx + 3, ry - 15, 2, 2);
  ctx.fillRect(rx + 6, ry - 15, 2, 2);

  // ── Corpo ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#181818';
  ctx.fillRect(rx + 1, ry - 12, 8, 7);
  ctx.fillStyle = '#1A3A1A';
  ctx.fillRect(rx + 2, ry - 11, 6, 1);
  ctx.fillRect(rx + 2, ry - 9,  6, 1);
  ctx.fillRect(rx + 2, ry - 7,  6, 1);

  // ── Sacola roubada ───────────────────────────────────────────────────────
  ctx.fillStyle = P.SUN_YELLOW;
  ctx.fillRect(rx - 1, ry - 10, 4, 5);
  ctx.fillStyle = '#CC9900';
  ctx.fillRect(rx, ry - 9, 2, 3);
  ctx.fillStyle = '#333';
  ctx.fillRect(rx, ry - 12, 2, 2);

  // ── Pernas (dobradas quando no ar) ───────────────────────────────────────
  ctx.fillStyle = '#141414';
  const inAir = (o.jumpY || 0) < -2;
  if (inAir) {
    // No ar: pernas dobradas para cima
    ctx.fillRect(rx + 1, ry - 7, 3, 3);
    ctx.fillRect(rx + 6, ry - 7, 4, 3);
    ctx.fillStyle = '#444';
    ctx.fillRect(rx + 1, ry - 5, 3, 1);
    ctx.fillRect(rx + 6, ry - 5, 4, 1);
  } else if (o.animFrame === 0) {
    ctx.fillRect(rx + 1, ry - 5, 3, 5);
    ctx.fillRect(rx + 6, ry - 5, 4, 4);
    ctx.fillStyle = '#444';
    ctx.fillRect(rx + 0, ry - 1, 4, 1);
    ctx.fillRect(rx + 6, ry - 2, 4, 1);
  } else {
    ctx.fillRect(rx + 1, ry - 5, 3, 4);
    ctx.fillRect(rx + 6, ry - 5, 4, 5);
    ctx.fillStyle = '#444';
    ctx.fillRect(rx + 0, ry - 2, 4, 1);
    ctx.fillRect(rx + 6, ry - 1, 4, 1);
  }

  // Sombra no chão quando no ar (indica que está pulando)
  if (inAir) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(rx + 2, o.y - 2, 10, 2);
  }
}

function drawTree(ctx, o) {
  const rx = Math.round(o.x);
  const ry = Math.round(o.y);

  // ── Copa (aproxima círculo com retângulos) ──────────────────────────────
  // Camada de sombra (verde mais escuro)
  ctx.fillStyle = '#006600';
  ctx.fillRect(rx + 2, ry - 26, 10,  2);
  ctx.fillRect(rx + 1, ry - 24, 12,  8);
  ctx.fillRect(rx + 2, ry - 16, 10,  4);

  // Camada principal (verde médio)
  ctx.fillStyle = P.TREE_GREEN;
  ctx.fillRect(rx + 3, ry - 26, 8,  2);
  ctx.fillRect(rx + 1, ry - 24, 12, 8);
  ctx.fillRect(rx + 2, ry - 16, 10, 4);

  // Highlights (verde claro — luz solar)
  ctx.fillStyle = '#22CC22';
  ctx.fillRect(rx + 3, ry - 25, 4, 3);
  ctx.fillRect(rx + 2, ry - 22, 3, 2);
  ctx.fillRect(rx + 8, ry - 23, 3, 2);

  // ── Tronco ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#6B3A1A';
  ctx.fillRect(rx + 5, ry - 14, 4, 14);
  // Detalhe do tronco (casca mais escura)
  ctx.fillStyle = '#4A2A0E';
  ctx.fillRect(rx + 5, ry - 14, 1, 14);
  ctx.fillStyle = '#8B5A2A';
  ctx.fillRect(rx + 8, ry - 12, 1, 10);
}

function drawCat(ctx, o) {
  // Gato em PERFIL LATERAL — olha para a ESQUERDA (em direção ao Pedro).
  // Cabeça/focinho: lado esquerdo do sprite. Rabo: lado direito.
  const rx = Math.round(o.x);
  const ry = Math.round(o.y - (o.animFrame === 0 ? 1 : 0));  // bob de 1px

  // ── Rabo levantado (lado DIREITO — atrás do gato) ───────────────────────
  ctx.fillStyle = P.CAT_ORANGE;
  ctx.fillRect(rx + 10, ry - 6,  2, 3);   // base
  ctx.fillRect(rx + 11, ry - 10, 2, 5);   // haste vertical
  ctx.fillRect(rx + 10, ry - 12, 3, 2);   // ponta curvada

  // ── Corpo ────────────────────────────────────────────────────────────────
  ctx.fillRect(rx + 2, ry - 8, 9, 6);

  // ── Cabeça (lado ESQUERDO — voltada para Pedro) ──────────────────────────
  ctx.fillRect(rx, ry - 12, 7, 6);

  // Orelha (topo da cabeça, visível no perfil)
  ctx.fillRect(rx + 1, ry - 15, 2, 4);   // orelha frontal (esq)
  ctx.fillRect(rx + 5, ry - 14, 2, 3);   // orelha traseira
  ctx.fillStyle = '#FF9999';
  ctx.fillRect(rx + 1, ry - 15, 1, 3);   // interior orelha
  ctx.fillRect(rx + 5, ry - 14, 1, 2);

  // Olho grande (único — perfil lateral, olho visível do lado esquerdo)
  ctx.fillStyle = '#FFEE00';
  ctx.fillRect(rx + 2, ry - 11, 3, 2);
  ctx.fillStyle = '#111';
  ctx.fillRect(rx + 3, ry - 11, 1, 2);   // pupila vertical

  // Focinho (ponta esquerda)
  ctx.fillStyle = P.CAT_ORANGE;
  ctx.fillRect(rx - 1, ry - 8, 3, 3);    // focinho projetado à esquerda
  ctx.fillStyle = '#FF6677';
  ctx.fillRect(rx - 1, ry - 8, 2, 1);    // nariz

  // Bigodes (somente para a ESQUERDA — direção do focinho)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(rx - 3, ry - 7, 4, 1);    // bigode esq superior
  ctx.fillRect(rx - 3, ry - 6, 4, 1);    // bigode esq inferior

  // ── Patas animadas ────────────────────────────────────────────────────────
  ctx.fillStyle = P.CAT_ORANGE;
  if (o.animFrame === 0) {
    ctx.fillRect(rx + 2, ry - 2, 3, 2);  // pata dianteira (frente)
    ctx.fillRect(rx + 8, ry - 2, 3, 2);  // pata traseira
  } else {
    ctx.fillRect(rx + 2, ry - 2, 3, 3);
    ctx.fillRect(rx + 7, ry - 2, 3, 2);
  }
}

function drawDog(ctx, o) {
  const rx = Math.round(o.x);
  const ry = Math.round(o.y);
  // O cachorro corre em direção a Pedro (que está à esquerda).
  // Cabeça/focinho = lado ESQUERDO do sprite (menor x).
  // Rabo levantado = lado DIREITO (maior x).

  // ── Rabo (lado direito, levantado alegremente) ────────────────────────
  ctx.fillStyle = '#9A5000';
  ctx.fillRect(rx + 13, ry - 11, 3, 2);
  ctx.fillRect(rx + 14, ry - 14, 2, 4);
  ctx.fillRect(rx + 13, ry - 15, 2, 2);

  // ── Corpo ─────────────────────────────────────────────────────────────
  ctx.fillStyle = P.DOG_BROWN;
  ctx.fillRect(rx + 4, ry - 10, 10, 7);
  ctx.fillStyle = '#9A5000';
  ctx.fillRect(rx + 4, ry - 10, 1, 7);   // sombra lateral esq do corpo

  // Barriga mais clara
  ctx.fillStyle = '#C07040';
  ctx.fillRect(rx + 5, ry - 8, 8, 4);

  // ── Cabeça (lado ESQUERDO — olha para Pedro) ──────────────────────────
  ctx.fillStyle = P.DOG_BROWN;
  ctx.fillRect(rx + 1, ry - 12, 7, 8);

  // Orelha caída (pendura do topo para a esquerda)
  ctx.fillStyle = '#5C3000';
  ctx.fillRect(rx, ry - 13, 4, 6);

  // Focinho (se projeta para a ESQUERDA)
  ctx.fillStyle = '#C07030';
  ctx.fillRect(rx - 1, ry - 9, 4, 4);

  // Nariz (ponta esquerda)
  ctx.fillStyle = '#111';
  ctx.fillRect(rx - 1, ry - 9, 2, 2);
  ctx.fillStyle = '#FF5555';   // narinas
  ctx.fillRect(rx, ry - 8, 1, 1);

  // Olho (levemente à direita do focinho)
  ctx.fillStyle = '#220C00';
  ctx.fillRect(rx + 3, ry - 11, 2, 2);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(rx + 4, ry - 11, 1, 1);

  // ── Patas animadas (dianteiras à esquerda, traseiras à direita) ──────
  ctx.fillStyle = P.DOG_BROWN;
  if (o.animFrame === 0) {
    ctx.fillRect(rx + 4,  ry - 3, 3, 3);   // pata dianteira esq (para baixo)
    ctx.fillRect(rx + 10, ry - 3, 3, 2);   // pata traseira dir (para cima)
  } else {
    ctx.fillRect(rx + 4,  ry - 3, 3, 2);
    ctx.fillRect(rx + 10, ry - 3, 3, 3);
  }
}

function drawBirdObstacle(ctx, o) {
  // Ave (pombo/gavião) voando na altura da cabeça de Pedro → agache!
  const rx  = Math.round(o.x);
  // swoopY é puramente visual — o hitbox permanece no flyHeight base
  const cy  = Math.round(o.y - o.flyHeight + (o.swoopY || 0));
  const flap = o.animFrame;

  // ── Rabo (lado direito — ave voa em direção a Pedro, à esquerda) ──────────
  ctx.fillStyle = '#484848';
  ctx.fillRect(rx + 11, cy - 1, 5, 2);
  ctx.fillRect(rx + 13, cy - 3, 2, 6);   // leque do rabo

  // ── Corpo ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#606060';
  ctx.fillRect(rx + 3, cy - 2, 10, 4);

  // Peito (mais claro)
  ctx.fillStyle = '#888';
  ctx.fillRect(rx + 3, cy - 1, 5, 3);

  // ── Cabeça (lado ESQUERDO — voltada para Pedro) ───────────────────────────
  ctx.fillStyle = '#505050';
  ctx.fillRect(rx, cy - 3, 6, 5);

  // Bico (pontudo, aponta para a esquerda)
  ctx.fillStyle = '#C8A800';   // bico amarelo
  ctx.fillRect(rx - 3, cy - 1, 4, 2);

  // Olho vermelho (intimidador)
  ctx.fillStyle = '#DD0000';
  ctx.fillRect(rx + 1, cy - 2, 2, 2);
  ctx.fillStyle = '#FF2200';
  ctx.fillRect(rx + 1, cy - 2, 1, 1);  // highlight

  // ── Asas (batem para cima ou para baixo) ─────────────────────────────────
  ctx.fillStyle = '#707070';
  if (flap === 0) {
    // Asas erguidas (V invertido)
    ctx.fillRect(rx + 2, cy - 7, 12, 4);  // asa superior
    ctx.fillRect(rx + 4, cy - 8, 8, 2);   // ponta das asas
    ctx.fillStyle = '#555';
    ctx.fillRect(rx + 2, cy - 7, 1, 4);   // sombra borda
    ctx.fillRect(rx + 13, cy - 7, 1, 3);
  } else {
    // Asas abaixadas (V normal)
    ctx.fillRect(rx + 2, cy + 3, 12, 4);  // asa inferior
    ctx.fillRect(rx + 4, cy + 6, 8, 2);   // ponta das asas
    ctx.fillStyle = '#555';
    ctx.fillRect(rx + 2, cy + 3, 1, 4);
    ctx.fillRect(rx + 13, cy + 3, 1, 3);
  }

  // ── Sombra no chão (indica altura) ───────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(rx + 2, o.y - 2, o.w - 2, 2);  // sombra projetada no asfalto
}
