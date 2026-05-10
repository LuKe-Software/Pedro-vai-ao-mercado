# MEMORY.md — Pedro vai ao mercado

> Memória de longo prazo. Registra **decisões arquiteturais** e **conhecimento estável**. Não registra TODOs (esses ficam em `STATUS.md`).
> Atualizar apenas quando o Luiz pedir "consolidar memória" ou ao tomar uma decisão técnica relevante.

---

## 1. Identidade e missão

Jogo HTML5 estilo Atari 2600 onde Pedro precisa atravessar a cidade para comprar um bolo no mercado, dentro de um tempo limitado, desviando de obstáculos urbanos. Versão alfa termina apenas por vitória ou timeout.

**Pilares de design:**
- Estética Atari 2600 fielmente reproduzida (paleta TIA, blocos, beep-boop)
- Mecânica de runner clássico (auto-corrida + pulo)
- Loop curto (~2-3 minutos por partida)
- Distribuição zero-fricção (abre direto no browser, sem instalar nada)

---

## 2. Decisões arquiteturais

### 2.1 Stack
- **Vanilla JS + Canvas 2D**, sem build tools.
  - *Motivo:* portabilidade extrema, longevidade, simplicidade pedagógica (Luiz pode mostrar para alunos).
- **ES6 modules nativos** (`<script type="module">`), sem bundler.
  - *Motivo:* todos os browsers modernos suportam; elimina toolchain.
- **Web Audio API direto**, sem Howler/Tone.js.
  - *Motivo:* o som é parte da estética Atari (square waves), bibliotecas atrapalhariam.

### 2.2 Loop principal
- **Fixed timestep + render interpolation** (Glenn Fiedler).
  - `dt = 1/60 s` para física, render usa `requestAnimationFrame`.
  - *Motivo:* determinismo e estabilidade independente do refresh rate (60Hz, 120Hz, 144Hz).
  - *Fonte:* <https://gafferongames.com/post/fix_your_timestep/>

### 2.3 Resolução e escala
- **Resolução interna fixa: 160×192 px** (proporções do Atari 2600 NTSC).
- Canvas exibido escalado por inteiros (×3 = 480×576, ×4 = 640×768) via CSS `image-rendering: pixelated`.
- *Motivo:* preservar o pixel art autêntico, evitar blur.

### 2.4 Coordenadas
- Origem no canto **superior-esquerdo**, X cresce para direita, Y cresce para baixo (padrão Canvas).
- Posições em **inteiros** (sem subpixel) para reforçar o look retro.

### 2.5 Colisão
- **AABB (Axis-Aligned Bounding Box)** simples, sem rotação.
- *Motivo:* suficiente para todos os obstáculos do jogo; Atari não tinha colisão por pixel sofisticada.

### 2.6 Persistência
- `localStorage` para high score e configurações (mute, volume).
- Chaves namespaced: `pedroMercado_highScore`, `pedroMercado_muted`.

### 2.7 Geração de obstáculos
- **Procedural com semente determinística** (LCG simples).
  - *Motivo:* permite reprodutibilidade para debug e high scores comparáveis.
- Distância mínima entre obstáculos calculada a partir da física do pulo (gap mínimo = velocidade × tempo de ar).

---

## 3. Paleta TIA do Atari 2600 (subset usado)

Não é a paleta completa (128 cores), mas o subset escolhido para o jogo:

| Nome             | Hex      | Uso                                  |
|------------------|----------|--------------------------------------|
| `BLACK`          | `#000000`| Fundo de telas, contornos            |
| `WHITE`          | `#FFFFFF`| Texto, brilhos                       |
| `SKY_BLUE`       | `#5C94FC`| Céu                                  |
| `SUN_YELLOW`     | `#FCFC54`| Sol, moedas, dinheiro                |
| `STREET_GRAY`    | `#7C7C7C`| Asfalto                              |
| `SIDEWALK_TAN`   | `#BCAC78`| Calçada                              |
| `BUILDING_RED`   | `#A8281C`| Prédios fundo                        |
| `BUILDING_BROWN` | `#5C2C04`| Prédios fundo (alternado)            |
| `PEDRO_SHIRT`    | `#1C8CFC`| Camisa do Pedro (azul vivo)          |
| `PEDRO_PANTS`    | `#10381C`| Calça do Pedro (verde escuro)        |
| `PEDRO_SKIN`     | `#FCBC78`| Pele do Pedro                        |
| `PEDRO_HAIR`     | `#5C2C04`| Cabelo do Pedro                      |
| `THIEF_BLACK`    | `#181818`| Ladrão                               |
| `ELDER_GRAY`     | `#C8C8C8`| Idoso (cabelo branco/cinza)          |
| `TREE_GREEN`     | `#00A800`| Copa de árvore                       |
| `CAT_ORANGE`     | `#FC9838`| Gato                                 |
| `DOG_BROWN`      | `#8C4400`| Cachorro                             |
| `MARKET_RED`     | `#FC4828`| Placa do mercado                     |
| `HOLE_BLACK`     | `#000000`| Buraco na rua                        |

> Fonte: <https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#Atari_2600>
> Subset escolhido para maximizar contraste do Pedro (azul) contra fundos terrosos.

---

## 4. Física do Pedro (constantes consagradas)

Após calibração inicial, esses valores devem **mudar pouco**:

```
GRAVITY              = 0.55  px/frame²  (queda natural)
JUMP_VELOCITY        = -8.5  px/frame   (impulso vertical inicial)
RUN_SPEED            = 2.0   px/frame   (velocidade de scroll do mundo)
GROUND_Y             = 160   px         (linha do chão na resolução interna)
PEDRO_WIDTH          = 12    px
PEDRO_HEIGHT         = 18    px
```

- Tempo de ar: ~30 frames (0.5 s a 60 FPS) → suficiente para pular obstáculos de até 24 px de largura.
- Altura máxima do pulo: ~65 px → cabe sob copas de árvores baixas.

> Calibração validada em [DATA A PREENCHER NA PRIMEIRA CALIBRAÇÃO]. Se mudar, justificar aqui.

---

## 5. Obstáculos canônicos

| Obstáculo          | Tamanho (px) | Hitbox      | Comportamento                                     | Pulo necessário |
|--------------------|--------------|-------------|---------------------------------------------------|-----------------|
| Buraco na rua      | 16×8         | só fundo    | Estático, no chão                                 | Sim (pulo curto) |
| Idoso c/ carrinho  | 14×16        | corpo todo  | Move 1 px/frame contra Pedro                      | Sim             |
| Ladrão             | 10×16        | corpo todo  | Move 1.5 px/frame contra Pedro, anima corrida     | Sim             |
| Árvore             | 12×24        | tronco      | Estático                                          | Sim             |
| Gato               | 10×8         | corpo       | Pula entre 2 alturas, move 0.8 px/frame           | Sim (timing)    |
| Cachorro           | 14×10        | corpo       | Move 1.2 px/frame, late (SFX)                     | Sim             |

---

## 6. Áudio (síntese)

- **2 canais lógicos**: melodia + SFX (mimética dos 2 canais TIA).
- **Formas de onda usadas**: square (default), triangle (graves), noise (passos, colisão).
- **Música tema** (tela inicial e cutscene): loop de 16 compassos em Lá menor, BPM 120.
- **Música ingame**: minimalista, só percussão (noise rítmico) para não cansar.
- **SFX canônicos**:
  - `jump`: square, 880 Hz → 1320 Hz, 80 ms
  - `land`: noise burst, 50 ms
  - `coin`: square, 1760 Hz, 100 ms (caso adicione coletáveis no futuro)
  - `hit`: noise + triangle 110 Hz, 200 ms
  - `victory`: arpejo de 4 notas em Dó maior
  - `gameover`: square descendente 440 → 110 Hz, 600 ms

---

## 7. Estrutura de cenas (state machine)

```
TITLE → STORY → GAME → (VICTORY ou GAMEOVER) → TITLE
```

Cada cena implementa: `enter()`, `update(dt)`, `render(ctx)`, `exit()`.
Transições gerenciadas por `engine/sceneManager.js`.

---

## 8. Score e timer

- **Score** = distância percorrida em px (exibida em metros virtuais: `score / 10`).
- **Bônus de tempo restante** somado ao chegar no mercado: `timeLeft × 10`.
- **Timer inicial:** 60 segundos. Vitória aos ~50 s de gameplay deixa folga.
- **High score** persistente em `localStorage`, exibido na tela inicial.

---

## 9. Histórico de mudanças significativas

> Append-only. Quem aterar acima precisa registrar aqui.

- **[a preencher]** Projeto iniciado. Decisões 2.1–2.7 firmadas.

---

## Contexto do desenvolvedor

- **Desenvolvedor**: Luiz Antonio Celiberto Junior
- **Instituição**: UFABC — Engenharia de Instrumentação, Automação e Robótica
- **Preferências**: Python comentado em português · Git via SSH · respostas detalhadas
- **Terminologia**: pode usar linguagem técnica de RL, robótica e visão computacional
- **Ambiente**: Windows / Linux dual boot — partição exFAT compartilhada em D:\ e /mnt/projetos
