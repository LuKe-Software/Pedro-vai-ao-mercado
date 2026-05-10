// Game loop com fixed timestep + render desacoplado.
// Referência: Glenn Fiedler — https://gafferongames.com/post/fix_your_timestep/

// Intervalo fixo de física: 1/60 segundo = 16.67 ms por tick
const TIMESTEP = 1000 / 60;

let accumulator = 0;
let lastTime = null;
let running = false;
let rafId = null;

// Callbacks registrados pelo main.js
let _update = null;
let _render = null;

/**
 * Registra as funções de update e render do jogo.
 * @param {function} update - chamada com dt em segundos (fixo 1/60)
 * @param {function} render - chamada com alpha de interpolação [0, 1)
 */
export function setCallbacks(update, render) {
  _update = update;
  _render = render;
}

/**
 * Inicia o loop. Deve ser chamado uma única vez.
 */
export function startLoop() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(frame);
}

/**
 * Para o loop (útil para debug / pausa total).
 */
export function stopLoop() {
  running = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function frame(currentTime) {
  if (!running) return;

  // Clamp delta para evitar espiral da morte ao retornar de aba inativa
  const deltaMs = Math.min(currentTime - lastTime, 250);
  lastTime = currentTime;
  accumulator += deltaMs;

  // Ticks de física em passo fixo (determinístico, independente do refresh rate)
  while (accumulator >= TIMESTEP) {
    if (_update) _update(TIMESTEP / 1000); // dt em segundos
    accumulator -= TIMESTEP;
  }

  // Fração do timestep restante → usada pelo render para interpolar posições
  const alpha = accumulator / TIMESTEP;
  if (_render) _render(alpha);

  rafId = requestAnimationFrame(frame);
}
