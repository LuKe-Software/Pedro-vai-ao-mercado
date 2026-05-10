// Síntese de áudio via Web Audio API.
// Imita os dois canais TIA do Atari 2600: square waves e noise.
// Referência: https://teropa.info/blog/2016/07/28/javascript-systems-music.html

let actx = null;
let muted = false;

// ── Inicialização automática no PRIMEIRO evento real do usuário ───────────────
// AudioContext criado dentro do handler DOM → estado 'running' imediato no Chrome/Firefox.
// Não usar RAF/loop pois o contexto fica suspenso fora de um evento de usuário.
function _initFromEvent() {
  if (actx) {
    if (actx.state === 'suspended') actx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
}

['keydown', 'pointerdown', 'touchstart'].forEach(evt =>
  document.addEventListener(evt, _initFromEvent, { passive: true })
);

/** Fallback manual caso algo não tenha sido capturado pelo listener acima. */
export function audioInit() {
  _initFromEvent();
}

export function getContext() { return actx; }

export function setMuted(v) { muted = v; }
export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

/**
 * Toca um tom simples (square ou triangle).
 * @param {number} freq    - frequência em Hz
 * @param {number} durMs   - duração em milissegundos
 * @param {string} type    - 'square' | 'triangle' | 'sawtooth'
 * @param {number} vol     - volume [0, 1]
 */
export function beep(freq, durMs, type = 'square', vol = 0.12) {
  if (!actx || muted) return;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + durMs / 1000);
  osc.connect(gain);
  gain.connect(actx.destination);
  osc.start(actx.currentTime);
  osc.stop(actx.currentTime + durMs / 1000 + 0.01);
}

/**
 * Sweep de frequência (ex: efeito de pulo).
 */
export function sweep(freqFrom, freqTo, durMs, type = 'square', vol = 0.12) {
  if (!actx || muted) return;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, actx.currentTime);
  osc.frequency.linearRampToValueAtTime(freqTo, actx.currentTime + durMs / 1000);
  gain.gain.setValueAtTime(vol, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + durMs / 1000);
  osc.connect(gain);
  gain.connect(actx.destination);
  osc.start(actx.currentTime);
  osc.stop(actx.currentTime + durMs / 1000 + 0.01);
}

/**
 * Burst de ruído (colisão, aterrissagem).
 */
export function noiseBurst(durMs, vol = 0.08) {
  if (!actx || muted) return;
  const bufLen = actx.sampleRate * (durMs / 1000);
  const buf = actx.createBuffer(1, bufLen, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource();
  const gain = actx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + durMs / 1000);
  src.connect(gain);
  gain.connect(actx.destination);
  src.start(actx.currentTime);
}

/**
 * Arpejo (vitória).
 */
export function arpeggio(freqs, noteDurMs, vol = 0.12) {
  if (!actx || muted) return;
  freqs.forEach((f, i) => {
    const when = actx.currentTime + i * (noteDurMs / 1000);
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + noteDurMs / 1000);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start(when);
    osc.stop(when + noteDurMs / 1000 + 0.01);
  });
}
