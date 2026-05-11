// Entrada de nome após o fim de uma partida.
// Verifica se o jogador entrou no top 10 e coleta 4 letras.

import { ctx } from '../engine/canvas.js';
import { W, H } from '../engine/constants.js';
import { wasJustPressed, wasPointerJustPressed, wasActionJustPressed, clearAll } from '../engine/input.js';
import { PALETTE as P } from '../assets/palette.js';
import { sceneManager } from '../engine/sceneManager.js';
import { isTopTen, addScore } from '../storage.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLOT_W = 13;
const SLOT_H = 15;
const SLOT_GAP = 4;
const SLOTS_TOTAL_W = 4 * SLOT_W + 3 * SLOT_GAP;
const SLOTS_X = Math.floor((W - SLOTS_TOTAL_W) / 2);
const SLOTS_Y = 90;

let total = 0;
let won = false;
let qualifies = false;
let name = [' ', ' ', ' ', ' '];
let cursor = 0;
let blinkTimer = 0;
let blinkOn = true;

export default {
  enter(payload = {}) {
    clearAll();
    total     = payload.total || 0;
    won       = payload.won   || false;
    qualifies = isTopTen(total);
    name      = [' ', ' ', ' ', ' '];
    cursor    = 0;
    blinkTimer = 0;
    blinkOn    = true;
  },

  update(dt) {
    blinkTimer++;
    if (blinkTimer >= 20) { blinkTimer = 0; blinkOn = !blinkOn; }

    if (!qualifies) {
      if (wasActionJustPressed()) sceneManager.switch('scores', { newEntryRank: -1 });
      return;
    }

    // Movimento do cursor
    if (wasJustPressed('ArrowLeft')  && cursor > 0) cursor--;
    if (wasJustPressed('ArrowRight') && cursor < 3) cursor++;

    // Digitação A-Z
    for (let i = 0; i < LETTERS.length; i++) {
      if (wasJustPressed('Key' + LETTERS[i])) {
        name[cursor] = LETTERS[i];
        if (cursor < 3) cursor++;
        break;
      }
    }

    // Backspace
    if (wasJustPressed('Backspace')) {
      if (name[cursor] !== ' ') {
        name[cursor] = ' ';
      } else if (cursor > 0) {
        cursor--;
        name[cursor] = ' ';
      }
    }

    // Confirmar com Enter ou clique
    if (wasJustPressed('Enter') || wasPointerJustPressed()) confirmName();
  },

  render(alpha) {
    ctx.fillStyle = '#001200';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = P.TREE_GREEN;
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.fillRect(0, 4, W, 1);
    ctx.fillRect(0, H - 5, W, 1);

    ctx.textAlign = 'center';

    if (!qualifies) {
      // ── Não entrou no top 10 ─────────────────────────────────────────────
      ctx.fillStyle = '#334';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('TOP 10', W / 2, 34);

      ctx.fillStyle = '#FF8866';
      ctx.font = '5px monospace';
      ctx.fillText('Voce nao entrou', W / 2, 76);
      ctx.fillText('no ranking desta vez.', W / 2, 89);

      ctx.fillStyle = '#555';
      ctx.font = '4px monospace';
      ctx.fillText(`Sua pontuacao: ${total} pts`, W / 2, 108);

      if (blinkOn) {
        ctx.fillStyle = P.ELDER_GRAY;
        ctx.font = '4px monospace';
        ctx.fillText('[ ESPACO ] ver ranking', W / 2, H - 10);
      }
      ctx.textAlign = 'left';
      return;
    }

    // ── Entrou no top 10 ─────────────────────────────────────────────────
    ctx.fillStyle = P.SUN_YELLOW;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(won ? '* TOP 10! *' : 'TOP 10!', W / 2, 22);

    ctx.fillStyle = P.WHITE;
    ctx.font = '4px monospace';
    ctx.fillText('Voce entrou no ranking!', W / 2, 34);

    ctx.fillStyle = '#AAFFAA';
    ctx.fillText(`Pontos: ${total}`, W / 2, 44);

    ctx.fillStyle = '#002800';
    ctx.fillRect(10, 50, W - 20, 1);

    ctx.fillStyle = P.ELDER_GRAY;
    ctx.font = '4px monospace';
    ctx.fillText('DIGITE SEU NOME (4 letras):', W / 2, 64);

    ctx.fillStyle = '#446644';
    ctx.font = '3px monospace';
    ctx.fillText('< > mover   A-Z digitar   BACKSPACE apagar', W / 2, 74);

    // ── Slots ──────────────────────────────────────────────────────────────
    for (let i = 0; i < 4; i++) {
      const sx = SLOTS_X + i * (SLOT_W + SLOT_GAP);
      const isActive = i === cursor;

      ctx.fillStyle = isActive ? (blinkOn ? '#003800' : '#002200') : '#001800';
      ctx.fillRect(sx, SLOTS_Y, SLOT_W, SLOT_H);

      // Borda
      const borderColor = isActive ? P.TREE_GREEN : '#224422';
      ctx.fillStyle = borderColor;
      ctx.fillRect(sx,              SLOTS_Y,              SLOT_W, 1);
      ctx.fillRect(sx,              SLOTS_Y + SLOT_H - 1, SLOT_W, 1);
      ctx.fillRect(sx,              SLOTS_Y,              1, SLOT_H);
      ctx.fillRect(sx + SLOT_W - 1, SLOTS_Y,              1, SLOT_H);

      // Letra (ou underscore se vazio)
      ctx.fillStyle = isActive ? P.SUN_YELLOW : P.WHITE;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      const ch = name[i] === ' ' ? '_' : name[i];
      ctx.fillText(ch, sx + Math.floor(SLOT_W / 2), SLOTS_Y + 11);
    }

    ctx.textAlign = 'center';

    if (blinkOn) {
      ctx.fillStyle = '#88FF88';
      ctx.font = 'bold 4px monospace';
      ctx.fillText('[ ENTER / CLIQUE ] confirmar', W / 2, H - 10);
    }

    ctx.textAlign = 'left';
  },

  exit() {},
};

function confirmName() {
  const raw     = name.map(c => c === ' ' ? ' ' : c).join('');
  const trimmed = raw.trimEnd() || '????';
  const padded  = trimmed.padEnd(4, ' ').slice(0, 4);
  const rank    = addScore({ name: padded, total, won });
  sceneManager.switch('scores', { newEntryRank: rank });
}
