# TECHNICAL_SPEC.md — Pedro vai ao mercado

> Especificação técnica detalhada. Documento de **referência**, mudanças aqui exigem justificativa em `MEMORY.md`.

---

## 1. Loop principal

### 1.1 Fixed timestep com interpolação

Implementação canônica do Glenn Fiedler.

```javascript
// engine/loop.js
const TIMESTEP = 1000 / 60; // 16.67 ms por frame de física
let accumulator = 0;
let lastTime = performance.now();

function frame(currentTime) {
  const deltaMs = Math.min(currentTime - lastTime, 250); // clamp p/ tab inativa
  lastTime = currentTime;
  accumulator += deltaMs;

  // física determinística
  while (accumulator >= TIMESTEP) {
    update(TIMESTEP / 1000); // dt em segundos
    accumulator -= TIMESTEP;
  }

  // render usando interpolação alpha
  const alpha = accumulator / TIMESTEP;
  render(alpha);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

**Referência:** <https://gafferongames.com/post/fix_your_timestep/> (seção "The Final Touch")

### 1.2 Por que fixed timestep?
- Determinismo: salvar/replay consistentes.
- Independência de refresh rate (60/120/144 Hz mostram a mesma física).
- Estabilidade numérica (saltos grandes de `dt` quebram colisão de plataforma).

---

## 2. Canvas e renderização

### 2.1 HTML
```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Pedro vai ao mercado</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game" width="160" height="192"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### 2.2 CSS
```css
html, body {
  margin: 0;
  background: #000;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: monospace;
}

#game {
  width: 640px;   /* 160 * 4 */
  height: 768px;  /* 192 * 4 */
  image-rendering: pixelated;          /* Chrome/Edge/Firefox novos */
  image-rendering: crisp-edges;        /* fallback */
  background: #000;
}
```

### 2.3 Inicialização do contexto
```javascript
// engine/canvas.js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
export { canvas, ctx };
```

`alpha: false` informa ao browser que o canvas é opaco → render mais rápido.

---

## 3. Sistema de cenas (state machine)

```javascript
// engine/sceneManager.js
class SceneManager {
  constructor() {
    this.current = null;
    this.scenes = new Map();
  }
  register(name, scene) { this.scenes.set(name, scene); }
  switch(name, payload) {
    if (this.current?.exit) this.current.exit();
    this.current = this.scenes.get(name);
    if (this.current?.enter) this.current.enter(payload);
  }
  update(dt) { this.current?.update(dt); }
  render(alpha) { this.current?.render(alpha); }
}
```

Cada cena exporta:
```javascript
export default {
  enter(payload) { /* setup */ },
  update(dt) { /* lógica */ },
  render(alpha) { /* desenho */ },
  exit() { /* cleanup */ }
};
```

---

## 4. Input

### 4.1 Mapeamento
| Ação           | Teclado          | Mouse  | Touch    |
|----------------|------------------|--------|----------|
| Pular          | Space, ArrowUp, W| Click  | Tap      |
| Iniciar        | Enter, Space     | Click  | Tap      |
| Pausar         | P, Esc           | —      | 2-finger |
| Mute           | M                | —      | —        |

### 4.2 Implementação
```javascript
// engine/input.js
const keys = new Set();
addEventListener('keydown', e => { keys.add(e.code); });
addEventListener('keyup',   e => { keys.delete(e.code); });

// edge-triggered (uma única vez por pressionada)
const justPressed = new Set();
addEventListener('keydown', e => {
  if (!keys.has(e.code)) justPressed.add(e.code);
});

export function isDown(code) { return keys.has(code); }
export function wasJustPressed(code) {
  if (justPressed.has(code)) { justPressed.delete(code); return true; }
  return false;
}
```

Touch e mouse: `pointerdown` unificado.

---

## 5. Entidades

### 5.1 Pedro
```javascript
class Pedro {
  constructor() {
    this.x = 32;          // posição X fixa (mundo rola atrás)
    this.y = GROUND_Y;    // 160
    this.vy = 0;          // velocidade vertical
    this.onGround = true;
    this.frame = 0;       // 0=corrida-A, 1=corrida-B, 2=pulo
    this.frameTimer = 0;
  }
  update(dt) {
    // Gravidade
    this.vy += GRAVITY;
    this.y += this.vy;
    // Colisão com chão
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    }
    // Animação de corrida (alterna a cada 6 frames)
    this.frameTimer += 1;
    if (this.frameTimer >= 6) {
      this.frame = this.onGround ? (1 - this.frame) : 2;
      this.frameTimer = 0;
    }
  }
  jump() {
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      playSfx('jump');
    }
  }
  render(ctx) { drawPedroSprite(ctx, this.x, this.y, this.frame); }
}
```

### 5.2 Object pool de obstáculos
Criar 16 instâncias na inicialização, reaproveitar:
```javascript
const pool = Array.from({length: 16}, () => new Obstacle());
function spawnObstacle(type, x) {
  const o = pool.find(o => !o.active);
  if (o) o.activate(type, x);
}
```

---

## 6. Geração procedural de obstáculos

### 6.1 Espaçamento mínimo
Distância segura entre obstáculos para que o jogador consiga reagir + pular:

```
gapMinimo = (tempoReacaoMin + tempoArDoPulo) × velocidadeScroll
         = (0.25 s + 0.5 s) × (2 px/frame × 60 frame/s)
         = 0.75 × 120 = 90 px
```

### 6.2 Curva de dificuldade
- **0-15 s:** 1 obstáculo a cada 100-130 px (fácil)
- **15-30 s:** 1 a cada 80-110 px (médio)
- **30-45 s:** 1 a cada 70-100 px (difícil)
- **45-60 s:** 1 a cada 60-90 px (rampa final)
- **60 s:** placa do MERCADO aparece, jogador chega.

### 6.3 RNG determinístico
```javascript
// LCG (Numerical Recipes)
let seed = 12345;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xFFFFFFFF;
}
```
Permite reproduzir partidas para debug.

---

## 7. Colisão (AABB)

```javascript
function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
```

**Hitboxes** menores que sprites (mais permissivo, sensação Atari):
- Pedro: hitbox `10×16` dentro de sprite `12×18` (margem 1 px lateral, 1 px topo, 1 px base)

---

## 8. Áudio (Web Audio API)

### 8.1 Inicialização
```javascript
// audio/synth.js
let ctx = null;
export function audioInit() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
}
// Atenção: precisa ser chamada após interação do usuário (autoplay policy)
```

### 8.2 Tom Atari (square wave)
```javascript
export function beep(freq, durMs, type = 'square', vol = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durMs / 1000);
}
```

### 8.3 SFX library
```javascript
export const SFX = {
  jump:    () => sweep(880, 1320, 80),
  land:    () => noiseBurst(50),
  hit:     () => { noiseBurst(120); beep(110, 200, 'triangle'); },
  victory: () => arpeggio([523, 659, 784, 1047], 100),
  gameover:() => sweep(440, 110, 600),
  tick:    () => beep(220, 30, 'square', 0.05) // tick do timer
};
```

### 8.4 Música chiptune (loop)
Estrutura simples baseada em scheduler de Web Audio:
```javascript
// audio/music.js — esqueleto
const melody = [
  // [freq Hz, duração em 1/16]
  [440, 2], [523, 2], [659, 2], [523, 2],
  [440, 4], [392, 2], [440, 2],
  // ... 16 compassos
];
function scheduleNote(freq, when, dur) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.1, when);
  g.gain.exponentialRampToValueAtTime(0.01, when + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(when); osc.stop(when + dur);
}
```

**Referência:** <https://web.dev/articles/audio-scheduling>

---

## 9. HUD

Layout (resolução 160×192):

```
┌──────────────────────────────────┐ y=0
│ TEMPO: 47   $$ 124               │ y=0..8 (faixa preta superior)
├──────────────────────────────────┤ y=8
│                                  │
│         CÉU                      │
│                                  │
│         (parallax prédios)       │
│                                  │
│      [Pedro corre]               │
│      ████████████████████        │ y=160 (chão)
│      calçada/asfalto             │ y=160..192
└──────────────────────────────────┘ y=192
```

Texto desenhado com fonte bitmap 5×7 ou 8×8 codificada em arrays:
```javascript
const FONT_5x7 = {
  'A': [
    0b01110,
    0b10001,
    0b10001,
    0b11111,
    0b10001,
    0b10001,
    0b10001,
  ],
  // ... outras letras
};
```

---

## 10. Persistência

```javascript
const STORAGE_KEY = 'pedroMercado_v1';

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
```

Objeto típico:
```json
{
  "highScore": 1280,
  "muted": false,
  "lastPlayed": "2026-05-10T20:00:00Z"
}
```

---

## 11. Distribuição

### 11.1 Local (dev)
```bash
cd pedro_mercado
python3 -m http.server 8080
# abrir http://localhost:8080
```

### 11.2 GitHub Pages
```bash
git init
git add .
git commit -m "feat: alfa-0.1"
git branch -M main
git remote add origin git@github.com:celibertojr/pedro-mercado.git
git push -u origin main
# Settings → Pages → Source: main / root
```

### 11.3 ZIP
```bash
zip -r pedro-mercado-alfa-0.1.zip pedro_mercado -x "*.git*"
```

### 11.4 Empacotar como desktop (futuro, opcional)
- **Tauri** (Rust + WebView, ~3 MB) — recomendado se for empacotar.
- **Electron** (~80 MB) — não recomendado para um jogo Atari de 50 KB.
- **Neutralino.js** (~2 MB) — alternativa leve.

---

## 12. Critérios de aceitação alfa-0.1

- [ ] Tela inicial aparece em < 1 s
- [ ] 60 FPS estáveis em 5 minutos contínuos
- [ ] Pedro pula sem bug em todos os 6 obstáculos
- [ ] Vitória ao chegar no mercado dentro de 60 s
- [ ] Derrota se timer chegar a 0
- [ ] Reinício do jogo via tela de fim
- [ ] High score persiste após fechar o browser
- [ ] Som funciona em Chrome, Firefox, Edge
- [ ] Funciona offline após primeiro carregamento
- [ ] Sem erros no console em runtime

---

## 13. Bibliografia técnica

1. Fiedler, G. *Fix Your Timestep!* — <https://gafferongames.com/post/fix_your_timestep/>
2. Wikipedia. *Television Interface Adaptor* — <https://en.wikipedia.org/wiki/Television_Interface_Adaptor>
3. Crane, D. (1982). Pitfall! design notes. — Patent US 4,398,723
4. Kitchen, G. (1983). Keystone Kapers — AtariAge.
5. Smus, B. *Web Audio API* (O'Reilly, 2013).
6. MDN Web Docs — *Canvas API* — <https://developer.mozilla.org/docs/Web/API/Canvas_API>
7. Wirth, N. (1976). *Algorithms + Data Structures = Programs.* (LCG no cap. de geração de números aleatórios).
