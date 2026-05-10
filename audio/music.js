// Música chiptune em loop via Web Audio API scheduler.
// Melodia em Lá menor, BPM 120, 2 vozes (melodia + baixo simples).
// Referência scheduler: https://web.dev/articles/audio-scheduling

import { getContext, isMuted } from './synth.js';

// Frequências das notas (Hz)
const N = {
  G3: 196.00, A3: 220.00, C4: 261.63, D4: 293.66,
  E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 784.00, A5: 880.00, R: 0,  // R = pausa
};

// Melodia: [frequência, duração em semínimas a 120 BPM]
// 1.0 = semínima (0.5s), 0.5 = colcheia (0.25s), 2.0 = mínima (1.0s)
const MELODY = [
  [N.A4, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.A5, 0.5],
  [N.G5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.A4, 0.5],
  [N.A4, 0.5], [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5],
  [N.F5, 0.5], [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5],
  [N.A4, 0.5], [N.G5, 0.5], [N.E5, 0.5], [N.C5, 0.5],
  [N.A4, 1.0], [N.G4, 0.5], [N.A4, 0.5],
  [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5], [N.G5, 0.5],
  [N.A5, 0.5], [N.G5, 0.5], [N.E5, 0.5], [N.A4, 1.0],
];

const BASS = [
  [N.A3, 2.0], [N.A3, 2.0],
  [N.C4, 2.0], [N.G3, 2.0],
  [N.A3, 1.0], [N.A3, 1.0], [N.E4, 2.0],
  [N.A3, 1.0], [N.G3, 1.0], [N.A3, 2.0],
];

const BPM = 120;
const BEAT = 60 / BPM;       // 0.5s por batida
const LOOKAHEAD = 0.1;        // janela de agendamento (s)
const SCHEDULE_INTERVAL = 50; // intervalo do scheduler em ms

let playing = false;
let timerId = null;
let melodyIdx = 0;
let bassIdx = 0;
let nextMelodyTime = 0;
let nextBassTime = 0;

function scheduleNote(freq, when, dur, type = 'square', vol = 0.08) {
  const ctx = getContext();
  if (!ctx || isMuted() || freq === 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, when);
  gain.gain.setValueAtTime(vol * 0.7, when + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur - 0.01);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + dur);
}

function schedule() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Agenda notas da melodia dentro da janela de lookahead
  while (nextMelodyTime < now + LOOKAHEAD) {
    const [freq, beats] = MELODY[melodyIdx % MELODY.length];
    const dur = beats * BEAT;
    scheduleNote(freq, nextMelodyTime, dur * 0.85, 'square', 0.08);
    nextMelodyTime += dur;
    melodyIdx++;
  }

  // Agenda notas do baixo dentro da janela de lookahead
  while (nextBassTime < now + LOOKAHEAD) {
    const [freq, beats] = BASS[bassIdx % BASS.length];
    const dur = beats * BEAT;
    scheduleNote(freq, nextBassTime, dur * 0.9, 'triangle', 0.06);
    nextBassTime += dur;
    bassIdx++;
  }
}

export function musicStart() {
  if (playing) return;
  const ctx = getContext();
  if (!ctx) return;

  const _start = () => {
    playing = true;
    melodyIdx = 0;
    bassIdx   = 0;
    nextMelodyTime = ctx.currentTime + 0.01;
    nextBassTime   = ctx.currentTime + 0.01;
    schedule();  // agenda primeiro lote imediatamente
    timerId = setInterval(schedule, SCHEDULE_INTERVAL);
  };

  // Contexto criado dentro do evento DOM → já está 'running'. Caso raro: resume.
  if (ctx.state === 'suspended') ctx.resume().then(_start);
  else _start();
}

export function musicStop() {
  if (!playing) return;
  playing = false;
  clearInterval(timerId);
  timerId = null;
}

export function isMusicPlaying() { return playing; }
