// Sistema de input unificado: teclado + mouse + touch.
// Distinção entre "pressionado agora" (isDown) e "acabou de pressionar" (wasJustPressed).

const keys = new Set();
const justPressed = new Set();
let pointerJustDown = false;

addEventListener('keydown', e => {
  if (!keys.has(e.code)) justPressed.add(e.code);
  keys.add(e.code);
  // Previne scroll da página com teclas de jogo
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
});

addEventListener('keyup', e => keys.delete(e.code));

// pointerdown cobre mouse e touch de forma unificada
addEventListener('pointerdown', () => { pointerJustDown = true; });

/**
 * Verifica se uma tecla está pressionada agora.
 * @param {string} code - e.g. 'Space', 'ArrowUp'
 */
export function isDown(code) {
  return keys.has(code);
}

/**
 * Retorna true uma única vez no frame em que a tecla foi pressionada.
 * Consome o evento (edge-triggered).
 */
export function wasJustPressed(code) {
  if (justPressed.has(code)) {
    justPressed.delete(code);
    return true;
  }
  return false;
}

/**
 * Retorna true uma única vez no frame em que o ponteiro (mouse/touch) foi pressionado.
 */
export function wasPointerJustPressed() {
  if (pointerJustDown) {
    pointerJustDown = false;
    return true;
  }
  return false;
}

/**
 * "Ação" de pulo/confirmar: Space, ArrowUp, W, clique ou toque.
 */
export function wasActionJustPressed() {
  const kb = wasJustPressed('Space') ||
             wasJustPressed('ArrowUp') ||
             wasJustPressed('KeyW') ||
             wasJustPressed('Enter');
  const ptr = wasPointerJustPressed();
  return kb || ptr;
}

/**
 * Limpa todos os estados (útil na transição entre cenas).
 */
export function clearAll() {
  keys.clear();
  justPressed.clear();
  pointerJustDown = false;
}
