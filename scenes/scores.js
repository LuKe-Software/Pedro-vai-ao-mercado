// Tela de ranking — top 10 pontuações.
// Acesso: após nameinput (newEntryRank >= 0 ou -1) ou pelo título ([T]).

import { ctx } from '../engine/canvas.js';
import { W, H } from '../engine/constants.js';
import { wasActionJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';
import { loadScores } from '../storage.js';

const ROW_H   = 14;
const START_Y  = 34;
const RANK_X   = 8;
const STAR_X   = 22;
const NAME_X   = 30;
const SCORE_X  = W - 8;

let scores = [];
let newEntryRank = -1;
let blinkTimer = 0;
let blinkOn = true;

export default {
  enter(payload = {}) {
    clearAll();
    scores       = loadScores();
    newEntryRank = payload.newEntryRank ?? -1;
    blinkTimer   = 0;
    blinkOn      = true;
  },

  update(dt) {
    blinkTimer++;
    if (blinkTimer >= 25) { blinkTimer = 0; blinkOn = !blinkOn; }
    if (wasActionJustPressed()) sceneManager.switch('title');
  },

  render(alpha) {
    // Fundo
    ctx.fillStyle = '#000820';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = P.PEDRO_SHIRT;
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.fillRect(0, 4, W, 1);
    ctx.fillRect(0, H - 5, W, 1);

    // Título
    ctx.textAlign = 'center';
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('TOP 10', W / 2, 18);

    // Cabeçalho de colunas
    ctx.fillStyle = '#1A2A44';
    ctx.fillRect(4, 22, W - 8, 9);
    ctx.fillStyle = '#6688AA';
    ctx.font = '4px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('#', RANK_X, 29);
    ctx.fillText('NOME', NAME_X, 29);
    ctx.textAlign = 'right';
    ctx.fillText('PONTOS', SCORE_X, 29);

    ctx.fillStyle = '#1A3060';
    ctx.fillRect(4, 31, W - 8, 1);

    // ── Linhas do ranking ─────────────────────────────────────────────────
    if (scores.length === 0) {
      ctx.fillStyle = '#334';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhuma pontuacao', W / 2, 100);
      ctx.fillText('ainda. Jogue!', W / 2, 113);
    } else {
      for (let i = 0; i < scores.length; i++) {
        const s    = scores[i];
        const yTop = START_Y + i * ROW_H;
        const yTxt = yTop + 9;
        const isNew = i === newEntryRank;

        // Fundo da linha
        if (isNew) {
          ctx.fillStyle = blinkOn ? '#0C2800' : '#081A00';
          ctx.fillRect(4, yTop, W - 8, ROW_H);
          ctx.fillStyle = '#1A5200';
          ctx.fillRect(4, yTop, W - 8, 1);
          ctx.fillRect(4, yTop + ROW_H - 1, W - 8, 1);
        } else if (i % 2 === 1) {
          ctx.fillStyle = '#050C1A';
          ctx.fillRect(4, yTop, W - 8, ROW_H);
        }

        // Cor por posição
        let rankColor;
        if (i === 0)      rankColor = P.SUN_YELLOW;
        else if (i === 1) rankColor = '#C8C8C8';
        else if (i === 2) rankColor = '#CD8040';
        else              rankColor = isNew ? '#AAFFAA' : '#6688AA';

        // Rank
        ctx.fillStyle = rankColor;
        ctx.font = i < 3 ? 'bold 5px monospace' : '5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, RANK_X, yTxt);

        // Estrela (★ = venceu; espaço em branco = não venceu)
        if (s.won) {
          ctx.fillStyle = P.SUN_YELLOW;
          ctx.font = '5px monospace';
          ctx.fillText('*', STAR_X, yTxt);
        }

        // Nome (4 chars)
        ctx.fillStyle = isNew ? '#AAFFAA' : (i < 3 ? P.WHITE : '#8899BB');
        ctx.font = i < 3 ? 'bold 5px monospace' : '5px monospace';
        ctx.fillText(s.name || '????', NAME_X, yTxt);

        // Pontuação
        ctx.fillStyle = isNew ? '#88FF88' : (i < 3 ? P.SUN_YELLOW : '#556688');
        ctx.textAlign = 'right';
        ctx.fillText(`${s.total}`, SCORE_X, yTxt);
      }
    }

    // Footer
    if (blinkOn) {
      ctx.fillStyle = P.WHITE;
      ctx.font = '4px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ESPACO ] voltar ao inicio', W / 2, H - 9);
    }

    ctx.textAlign = 'left';
  },

  exit() {},
};
