// Tela de vitória.

import { ctx } from '../engine/canvas.js';
import { W, H } from '../engine/constants.js';
import { wasActionJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';
import { loadState } from '../storage.js';

let blinkTimer = 0;
let blinkOn = true;
let score = 0, timeLeft = 0, bonus = 0, total = 0, distMeters = 0, highScore = 0, isNewRecord = false;

export default {
  enter(payload = {}) {
    clearAll();
    blinkTimer = 0; blinkOn = true;
    score = payload.score || 0;
    timeLeft = payload.timeLeft || 0;
    bonus = payload.bonus || 0;
    total = payload.total || 0;
    distMeters = Math.floor((payload.worldDistance || 0) / 10);
    const state = loadState();
    highScore = state.highScore || 0;
    isNewRecord = total > highScore;
  },

  update(dt) {
    blinkTimer++;
    if (blinkTimer >= 25) { blinkTimer = 0; blinkOn = !blinkOn; }
    // Só vai para o TÍTULO (nunca direto ao jogo)
    if (wasActionJustPressed()) sceneManager.switch('title');
  },

  render(alpha) {
    // Fundo verde celebração
    ctx.fillStyle = '#002800';
    ctx.fillRect(0, 0, W, H);

    // Faixas decorativas
    ctx.fillStyle = P.TREE_GREEN;
    ctx.fillRect(0, 0, W, 5);
    ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.fillRect(0, 5, W, 2);
    ctx.fillRect(0, H - 7, W, 2);

    // Título
    ctx.textAlign = 'center';
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('PARABENS!', W / 2, 24);

    ctx.fillStyle = P.WHITE;
    ctx.font = '5px monospace';
    ctx.fillText('Pedro comprou o bolo!', W / 2, 36);
    ctx.fillText('O pai vai adorar!', W / 2, 47);

    // Ícone do mercado (mini)
    const mx = W / 2 - 12;
    ctx.fillStyle = P.MARKET_RED;
    ctx.fillRect(mx, 52, 24, 18);
    ctx.fillStyle = P.WHITE;
    ctx.fillRect(mx + 2, 54, 20, 5);
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(mx + 3, 55, 18, 3);
    ctx.fillStyle = P.WHITE;
    ctx.font = 'bold 3px monospace';
    ctx.fillText('MERCADO', mx + 4, 57);

    // Linha
    ctx.fillStyle = '#004400';
    ctx.fillRect(15, 74, W - 30, 1);

    // Pontuação
    ctx.fillStyle = P.ELDER_GRAY;
    ctx.font = '5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Distancia:`, 20, 86);
    ctx.fillStyle = P.WHITE;
    ctx.textAlign = 'right';
    ctx.fillText(`${distMeters} m`, W - 20, 86);

    ctx.fillStyle = P.ELDER_GRAY;
    ctx.textAlign = 'left';
    ctx.fillText(`Bonus de tempo:`, 20, 97);
    ctx.fillStyle = '#88FF88';
    ctx.textAlign = 'right';
    ctx.fillText(`+${bonus}`, W - 20, 97);

    ctx.fillStyle = P.ELDER_GRAY;
    ctx.textAlign = 'left';
    ctx.fillText(`Tempo restante:`, 20, 108);
    ctx.fillStyle = P.WHITE;
    ctx.textAlign = 'right';
    ctx.fillText(`${timeLeft}s`, W - 20, 108);

    // Score total
    ctx.fillStyle = '#222';
    ctx.fillRect(15, 114, W - 30, 18);
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PONTOS: ${total}`, W / 2, 126);

    // Novo recorde
    if (isNewRecord) {
      ctx.fillStyle = P.MARKET_RED;
      ctx.font = 'bold 6px monospace';
      ctx.fillText('*** NOVO RECORDE! ***', W / 2, 142);
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '4px monospace';
      ctx.fillText(`Recorde: ${highScore} pts`, W / 2, 142);
    }

    // Press space
    if (blinkOn) {
      ctx.fillStyle = P.WHITE;
      ctx.font = '5px monospace';
      ctx.fillText('[ ESPACO ] jogar novamente', W / 2, H - 12);
    }

    ctx.textAlign = 'left';
  },

  exit() {},
};
