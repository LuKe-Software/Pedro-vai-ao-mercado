# Pedro vai ao Mercado

> Jogo HTML5 estilo Atari 2600 — runner arcade com Canvas 2D puro, sem dependências.

---

## A história

Pedro tem **12 anos**. Era quinta-feira à tarde quando lembrou: o aniversário do pai é **amanhã** e o bolo ainda não foi comprado.

O mercado fecha às **18h**. Ele tem **60 segundos** para atravessar 6 quadras, desviar dos obstáculos e chegar a tempo.

---

## Como rodar

```bash
cd "Jogo - Pedro vai ao mercado"
python server.py
```

Abrir no browser: `http://localhost:8080`

> `server.py` serve os arquivos sem cache — garante que o browser sempre carregue a versão mais recente dos módulos JS.
> Funciona offline após o primeiro carregamento. Nenhum npm, nenhum bundler.

---

## Controles

| Tecla / Ação          | Efeito                        |
|-----------------------|-------------------------------|
| `Space` / `↑` / `W`  | **Pular**                     |
| `S` / `↓`             | **Agachar** (só contra a AVE) |
| `P` / `Esc`           | Pausar / Retomar              |
| `M`                   | Mute / Som                    |
| Clique / Toque        | Pular                         |

---

## Obstáculos e penalidades

| Obstáculo         | Como evitar   | Penalidade ao colidir |
|-------------------|---------------|-----------------------|
| Buraco            | Pule          | ❤ Perde 1 vida       |
| Idoso + carrinho  | Pule          | ❤ Perde 1 vida       |
| **Ladrão**        | **Pule**      | 💸 Perde **R$50**    |
| Árvore            | Pule          | ❤ Perde 1 vida       |
| Gato              | Pule          | ❤ Perde 1 vida       |
| Cachorro          | Pule          | ❤ Perde 1 vida       |
| **Ave**           | **Agache**    | ❤ Perde 1 vida       |

### Penalidades acumuladas — Game Over quando:

| Condição                   | Tela exibida        |
|----------------------------|---------------------|
| 0 vidas restantes          | **GAME OVER**       |
| R$0 (ladrão roubou tudo)   | **SEM DINHEIRO!**   |
| Timer chegou a zero        | **TIME UP!**        |
| ✅ Chegou ao mercado       | **VITÓRIA**         |

> Após qualquer encerramento o jogo retorna à **tela inicial** — nunca reinicia automaticamente.

---

## Mecânicas especiais

- **3 vidas** — exibidas como corações no HUD.
- **R$200** — dinheiro da mãe. O ladrão rouba R$50 por colisão (mas não mata).
- **Invulnerabilidade** — Pedro pisca por ~1,5 s após cada hit (sem hit duplo).
- **Bônus de tempo** — ao chegar no mercado, segundos restantes viram pontos extras.

---

## Stack técnica

| Componente      | Tecnologia                                      |
|-----------------|-------------------------------------------------|
| Linguagem       | JavaScript ES6+ (módulos nativos, sem bundler)  |
| Renderização    | Canvas 2D — 160×192 px internos, escala 4×      |
| Áudio           | Web Audio API (oscillators — zero assets)       |
| Persistência    | `localStorage` (high score)                     |
| Servidor dev    | `python server.py` — sem cache, zero dependências npm |

```
Tamanho total: ~35 KB de código  |  0 dependências  |  Offline-first
```

---

## Estrutura do projeto

```
├── index.html              ← Entry point (canvas 640×768)
├── style.css               ← Reset + image-rendering: pixelated
├── main.js                 ← Bootstrap + ctx.scale(4,4)
├── storage.js              ← localStorage (high score)
├── engine/
│   ├── constants.js        ← Física, dimensões, SCALE=4
│   ├── loop.js             ← Fixed timestep (Glenn Fiedler)
│   ├── input.js            ← Teclado + mouse + touch
│   ├── collision.js        ← AABB
│   ├── canvas.js           ← Inicialização do contexto 2D
│   └── sceneManager.js     ← Máquina de estados de cenas
├── assets/
│   └── palette.js          ← Paleta TIA do Atari 2600 (subset)
├── audio/
│   ├── synth.js            ← AudioContext, beep, sweep, noise
│   ├── sfx.js              ← Efeitos sonoros
│   └── music.js            ← Chiptune em Lá menor, BPM 120
├── entities/
│   ├── pedro.js            ← Personagem (sprite + física + animação)
│   ├── obstacles.js        ← 7 tipos, object pool
│   └── parallax.js         ← Céu, nuvens, passarinhos, prédios
└── scenes/
    ├── title.js            ← Tela inicial
    ├── story.js            ← História + guia de obstáculos
    ├── game.js             ← Gameplay + intro casinha + HUD
    ├── victory.js          ← Tela de vitória
    └── gameover.js         ← Tela de derrota (3 motivos)
```

---

## Documentação técnica

| Arquivo              | Conteúdo                                    |
|----------------------|---------------------------------------------|
| `CLAUDE.md`          | Diretrizes de código e fluxo de trabalho    |
| `MEMORY.md`          | Decisões arquiteturais permanentes          |
| `STATUS.md`          | Estado atual, roadmap e histórico           |
| `TECHNICAL_SPEC.md`  | Especificação técnica detalhada             |
| `GAME_DESIGN.md`     | Design do jogo, mecânicas, balanceamento    |

---

## Referências

- Game loop: Glenn Fiedler — [gafferongames.com](https://gafferongames.com/post/fix_your_timestep/)
- Paleta Atari TIA: [Wikipedia](https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#Atari_2600)
- Inspiração: Pitfall! (Activision, 1982) · Keystone Kapers (1983) · T-Rex Runner (Chrome)

---

## Autor

**Luiz Antonio Celiberto Junior**
Professor Adjunto — Engenharia de Instrumentação, Automação e Robótica
Universidade Federal do ABC (UFABC) · 2026

## Licença

MIT
