// Tela de derrota — única forma de reiniciar é pela tela inicial.

import { ctx } from '../engine/canvas.js';
import { W, H } from '../engine/constants.js';
import { wasActionJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';

let blinkTimer = 0;
let blinkOn = true;
let reason = 'collision';
let scoreMeters = 0;
let moneyLeft = 0;

export default {
  enter(payload = {}) {
    clearAll();
    blinkTimer = 0; blinkOn = true;
    reason      = payload.reason || 'collision';
    scoreMeters = payload.score || 0;
    moneyLeft   = payload.money ?? 0;
  },

  update(dt) {
    blinkTimer++;
    if (blinkTimer >= 25) { blinkTimer = 0; blinkOn = !blinkOn; }
    // Só vai para o TÍTULO (nunca direto para o jogo)
    if (wasActionJustPressed()) sceneManager.switch('nameinput', { total: scoreMeters, won: false });
  },

  render(alpha) {
    ctx.fillStyle = '#160000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.MARKET_RED;
    ctx.fillRect(0, 0, W, 5);
    ctx.fillRect(0, H - 5, W, 5);

    ctx.textAlign = 'center';

    // ── Título e motivo ────────────────────────────────────────────────────
    let title = 'GAME OVER';
    let lines = [];

    switch (reason) {
      case 'timeout':
        title = 'TIME UP!';
        lines = ['O mercado fechou as 18h.', 'Pedro chegou tarde demais!', '', 'O pai vai comer bolo de pao...'];
        break;
      case 'nolives':
        title = 'GAME OVER';
        lines = ['Pedro perdeu todas as vidas!', '', 'Fique de olho nos obstaculos!'];
        break;
      case 'nomoney':
        title = 'SEM DINHEIRO!';
        lines = ['O ladrao levou tudo!', 'Pedro nao tem mais dinheiro', 'para comprar o bolo.', '', 'Cuidado com o ladrao!'];
        break;
      default:
        lines = ['Pedro colidiu!', 'Preste atencao', 'aos obstaculos.'];
    }

    ctx.fillStyle = P.MARKET_RED;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(title, W / 2, 32);

    ctx.fillStyle = '#FF8888';
    ctx.font = '5px monospace';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 46 + i * 12));

    // ── Linha separadora ───────────────────────────────────────────────────
    const sepY = 46 + lines.length * 12 + 4;
    ctx.fillStyle = '#330000';
    ctx.fillRect(15, sepY, W - 30, 1);

    // ── Estatísticas ────────────────────────────────────────────────────────
    const statY = sepY + 8;
    ctx.fillStyle = '#888';
    ctx.font = '4px monospace';
    ctx.fillText('Distancia percorrida:', W / 2, statY);
    ctx.fillStyle = P.WHITE;
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`${scoreMeters} m`, W / 2, statY + 10);

    if (reason !== 'nomoney') {
      ctx.fillStyle = moneyLeft > 0 ? '#88FF44' : '#FF4444';
      ctx.font = '4px monospace';
      ctx.fillText(`Dinheiro restante: R$${moneyLeft}`, W / 2, statY + 22);
    }

    // Dica contextual
    ctx.fillStyle = '#444';
    ctx.font = '4px monospace';
    const tip = reason === 'nomoney' ? 'Pule (ESPACO/↑) sobre o ladrao!' :
                reason === 'timeout' ? 'Desvie dos obstaculos mais rapido' :
                'Pule com ESPACO, agache (S/↓) sob a ave';
    ctx.fillText(tip, W / 2, H - 22);

    // ── Press space (só título) ───────────────────────────────────────────
    ctx.fillStyle = blinkOn ? P.WHITE : '#444';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('[ ESPACO ] continuar', W / 2, H - 11);

    ctx.textAlign = 'left';
  },

  exit() {},
};
