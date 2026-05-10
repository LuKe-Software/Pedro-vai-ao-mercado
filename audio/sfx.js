// Biblioteca de efeitos sonoros do jogo.
// Todos gerados proceduralmente via Web Audio API — sem assets externos.

import { beep, sweep, noiseBurst, arpeggio } from './synth.js';

export const SFX = {
  // Pulo: sweep ascendente de 880 → 1320 Hz em 80 ms
  jump:    () => sweep(880, 1320, 80, 'square', 0.1),

  // Aterrissagem: burst de ruído curto
  land:    () => noiseBurst(40, 0.06),

  // Colisão: ruído + tom grave
  hit:     () => { noiseBurst(150, 0.1); beep(110, 200, 'triangle', 0.08); },

  // Vitória: arpejo de Dó maior
  victory: () => arpeggio([523, 659, 784, 1047], 120, 0.12),

  // Game over: sweep descendente
  gameover:() => sweep(440, 110, 600, 'square', 0.1),

  // Tick do timer (último 10 segundos)
  tick:    () => beep(880, 60, 'square', 0.05),

  // Confirmação (press start)
  confirm: () => { beep(440, 60, 'square', 0.08); beep(880, 60, 'square', 0.08); },
};
