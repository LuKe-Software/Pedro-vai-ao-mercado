// Constantes globais do jogo. Alterar aqui propaga para todos os módulos.

// Fator de escala: 1 px lógico (160×192) → SCALE px de canvas (640×768)
export const SCALE = 4;

// Dimensões internas do canvas (resolução Atari 2600 NTSC)
export const W = 160;
export const H = 192;

// Física do Pedro (calibradas para jogabilidade — ver MEMORY.md seção 4)
export const GRAVITY       = 0.55;   // px/frame²
export const JUMP_VELOCITY = -8.5;   // px/frame (impulso inicial do pulo)
export const RUN_SPEED     = 2;      // px/frame (velocidade de scroll do mundo)
export const GROUND_Y      = 160;    // y do chão (posição dos pés do Pedro)

// Dimensões do Pedro
export const PEDRO_X      = 32;  // posição X fixa na tela (mundo rola atrás)
export const PEDRO_WIDTH  = 12;
export const PEDRO_HEIGHT = 18;

// Jogo
export const TIMER_SECONDS    = 60;    // tempo total da partida
export const VICTORY_DISTANCE = 5800;  // distância (px) para o mercado aparecer

// Pool de obstáculos
export const POOL_SIZE = 12;
