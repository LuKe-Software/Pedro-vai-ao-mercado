// Detecção de colisão AABB (Axis-Aligned Bounding Box).
// Suficiente para todos os obstáculos do jogo — sem rotação, sem pixel-perfect.

/**
 * Verifica se dois retângulos se sobrepõem.
 * @param {{x,y,w,h}} a
 * @param {{x,y,w,h}} b
 * @returns {boolean}
 */
export function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
