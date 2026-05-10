# CLAUDE.md — Pedro vai ao mercado

> Diretrizes vinculantes para o Claude Code neste repositório. Leia antes de qualquer alteração.

## 1. Identidade do projeto

- **Nome:** Pedro vai ao mercado
- **Gênero:** Endless runner side-scroller estilo Atari 2600
- **Inspirações:** Pitfall! (Activision, 1982), Keystone Kapers (Activision, 1983), T-Rex Runner (Chrome, 2014)
- **Plataforma alvo:** Browser desktop (Chrome/Firefox/Edge), mobile como bônus
- **Versão atual:** alfa-0.x (ver `STATUS.md`)
- **Autor:** Luiz Antonio Celiberto Junior

## 2. Stack tecnológica (fixa)

- **Linguagem:** JavaScript ES6+ (módulos nativos `import/export`)
- **Renderização:** Canvas 2D API
- **Áudio:** Web Audio API (oscillators, sem assets externos)
- **Persistência:** `localStorage` (high score, configurações)
- **Build:** **nenhum** (sem webpack, sem vite, sem npm em runtime)
- **Servidor de dev:** `python3 -m http.server 8080` na raiz
- **Distribuição:** ZIP da pasta + qualquer host estático (GitHub Pages, Netlify, Vercel)

> Justificativa: simplicidade, portabilidade, longevidade. Sem dependências = jogo continua rodando em 2035.

## 3. Estrutura de pastas

```
pedro_mercado/
├── index.html              # Entry point único
├── main.js                 # Bootstrap do jogo
├── style.css               # Reset + canvas styling
├── README.md               # Como rodar e distribuir
├── CLAUDE.md               # Este arquivo
├── MEMORY.md               # Memória de longo prazo
├── STATUS.md               # Estado atual / roadmap vivo
├── TECHNICAL_SPEC.md       # Spec técnica imutável
├── GAME_DESIGN.md          # Design do jogo
├── engine/
│   ├── loop.js             # Game loop com fixed timestep
│   ├── input.js            # Teclado + touch + gamepad
│   ├── collision.js        # AABB
│   └── canvas.js           # Inicialização, escala pixelada
├── entities/
│   ├── pedro.js            # Personagem principal
│   ├── obstacles.js        # Buraco, idoso, ladrão, árvore, gato, cachorro
│   └── parallax.js         # Camadas de fundo
├── scenes/
│   ├── title.js            # Tela inicial
│   ├── story.js            # Cutscene narrativa
│   ├── game.js             # Gameplay
│   ├── victory.js          # Tela de vitória
│   └── gameover.js         # Tela de derrota
├── audio/
│   ├── synth.js            # Geradores de onda
│   ├── sfx.js              # Efeitos sonoros
│   └── music.js            # Música chiptune
└── assets/
    └── palette.js          # Paleta TIA do Atari 2600
```

## 4. Convenções de código

- **Idioma dos comentários:** português (PT-BR)
- **Idioma dos identificadores:** inglês (`pedro`, `jump`, `obstacle`, não `pular`)
- **Indentação:** 2 espaços
- **Aspas:** simples por padrão, template literals quando interpolar
- **Semicolons:** sempre
- **Ponto-vírgula no final:** sim
- **Nomes de arquivos:** kebab-case ou camelCase consistente (escolha um e mantenha)
- **Constantes globais:** `SCREAMING_SNAKE_CASE` em `engine/constants.js`
- **Magic numbers:** proibidos em código de gameplay; promova para constante nomeada
- **Funções:** verbos (`updatePedro`, `drawObstacle`)
- **Classes:** PascalCase substantivos (`Pedro`, `Obstacle`, `ParallaxLayer`)

## 5. Fluxo de trabalho com Claude Code

### Cada sessão começa com
1. `read CLAUDE.md`
2. `read MEMORY.md`
3. `read STATUS.md`
4. Confirma em 3-5 linhas o entendimento
5. Propõe o próximo micro-passo

### Cada micro-passo termina com
1. Código rodando (testado pelo Luiz)
2. `STATUS.md` atualizado
3. Commit sugerido (mensagem em português, formato `feat:`, `fix:`, `chore:`)

### Quando o Luiz disser "consolidar memória"
1. Revisar o git log desde a última consolidação
2. Extrair decisões arquiteturais (não TODOs)
3. Adicionar a `MEMORY.md` na seção apropriada

### Quando algo der errado
1. **Não esconder.** Reportar bug em `STATUS.md` na seção "Bugs conhecidos".
2. Não tentar corrigir múltiplos bugs simultaneamente.
3. Reproduzir → isolar → corrigir → testar.

## 6. Princípios estéticos (regra de ouro)

> **"Se um jogador de 1982 jogasse, ele deveria sentir que viu na seção de jogos novos da TecToy."**

- **Cor:** apenas paleta TIA do Atari 2600 (ver `assets/palette.js`)
- **Resolução interna:** 160×192 px, escalada com `image-rendering: pixelated`
- **Sprites:** desenhados em código com `fillRect` ou bitmap inline em arrays
- **Animação:** 2-3 frames por entidade, máximo
- **Sem antialiasing.** Sem gradientes. Sem sombras. Sem transparência (exceto paleta).
- **Som:** apenas square, triangle, sawtooth, noise. Sem samples.
- **Música:** monofônica ou 2 vozes no máximo (Atari tinha 2 canais de áudio).
- **Texto:** fonte bitmap desenhada em código (8×8 ou 5×7).

Referência canônica: <https://en.wikipedia.org/wiki/Television_Interface_Adaptor>

## 7. Acessibilidade mínima

- Controles redundantes: teclado (Espaço/Setas), mouse (clique), touch (tap)
- Pausar com `P`
- Mute com `M`
- Sem flashes a >3 Hz (epilepsia fotossensitiva)
- Contraste alto entre Pedro e fundo (ele sempre numa cor que destaque)

## 8. O que NÃO fazer

- Não usar bibliotecas externas (jQuery, Lodash, Phaser, GSAP, etc.)
- Não usar `eval`, `Function()`, ou injeção de HTML
- Não baixar fontes do Google Fonts em runtime (usar fonte bitmap própria)
- Não usar imagens externas (PNG, JPG) — tudo procedural
- Não usar Howler.js, Tone.js — Web Audio API direto
- Não criar mais de **um arquivo HTML** (single-page)
- Não usar TypeScript (só JS puro nesta alfa, simplicidade primeiro)

## 9. Performance

- Alvo: **60 FPS estáveis** em laptop com integrated GPU
- Loop: fixed timestep 60 Hz, render decoupled
- Canvas: 1 só, sem `OffscreenCanvas` nesta alfa
- Sem alocação de objetos no loop principal (object pool para obstáculos)
- `requestAnimationFrame` sempre, nunca `setInterval`

## 10. Referências externas (consulte quando precisar)

- **Game loop:** Glenn Fiedler — <https://gafferongames.com/post/fix_your_timestep/>
- **Atari TIA palette:** <https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#Atari_2600>
- **Pitfall! análise técnica:** <https://www.theatari2600.com/category/pitfall/>
- **Keystone Kapers:** <https://atariage.com/software_page.php?SoftwareID=1392>
- **T-Rex Runner código:** Chromium source — `chrome/browser/resources/dino/`
- **Web Audio chiptune:** <https://teropa.info/blog/2016/07/28/javascript-systems-music.html>

## 11. Licença e distribuição

- Código: MIT (sugestão; confirmar com Luiz)
- Distribuição alfa: ZIP enviado direto, sem store
- Distribuição beta+: GitHub Pages (`https://celibertojr.github.io/pedro-mercado/`)
