// Bootstrap do jogo — registra cenas e inicia o loop.
// O canvas é 640×768 mas todo o código de jogo usa coordenadas lógicas 160×192.
// O ctx.scale(SCALE, SCALE) mapeia esse espaço lógico para o canvas físico,
// dando sprites pixelados Atari e texto nítido em telas modernas.

import { ctx } from './engine/canvas.js';
import { SCALE } from './engine/constants.js';
import { setCallbacks, startLoop } from './engine/loop.js';
import { sceneManager } from './engine/sceneManager.js';

import titleScene    from './scenes/title.js';
import storyScene    from './scenes/story.js';
import gameScene     from './scenes/game.js';
import victoryScene  from './scenes/victory.js';
import gameoverScene from './scenes/gameover.js';

sceneManager.register('title',    titleScene);
sceneManager.register('story',    storyScene);
sceneManager.register('game',     gameScene);
sceneManager.register('victory',  victoryScene);
sceneManager.register('gameover', gameoverScene);

setCallbacks(
  (dt) => sceneManager.update(dt),
  (alpha) => {
    // Aplica escala para que 1 px lógico = SCALE px de canvas
    ctx.save();
    ctx.scale(SCALE, SCALE);
    sceneManager.render(alpha);
    ctx.restore();
  }
);

sceneManager.switch('title');
startLoop();
