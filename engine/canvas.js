// Inicialização do canvas com configurações para visual Atari (sem antialiasing).

const canvas = document.getElementById('game');

// alpha: false informa ao browser que o canvas é opaco → render mais rápido
const ctx = canvas.getContext('2d', { alpha: false });

// Garante que não haverá suavização de imagens (necessário além do CSS)
ctx.imageSmoothingEnabled = false;

export { canvas, ctx };
