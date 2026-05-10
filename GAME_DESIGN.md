# GAME_DESIGN.md — Pedro vai ao mercado

> Game Design Document. Define **o quê** e **o porquê** das mecânicas. Pareado com `TECHNICAL_SPEC.md` (que define o **como**).

---

## 1. Conceito em uma frase

> **Pedro precisa atravessar a cidade, desviando de obstáculos urbanos, para comprar um bolo no mercado antes que o tempo acabe.**

---

## 2. Pitch (1 parágrafo)

A mãe do Pedro mandou ele comprar um bolo para a sobremesa e deu um dinheiro. Pedro precisa correr até o mercado pulando buracos na rua, desviando de idosos com carrinhos, ladrões, árvores, gatos e cachorros que aparecem no caminho. Mas tem pressa: a sobremesa é hoje! Se demorar demais, a mãe fica brava e ele tem que tentar de novo.

Visualmente, o jogo evoca um cartucho perdido do Atari 2600 — paleta TIA, blocos pixelados, beep-boop monofônico. A tensão vem do **timer regressivo** e da **densidade crescente** de obstáculos.

---

## 3. Plataforma e duração

- **Plataforma:** Browser (HTML5/Canvas)
- **Duração de uma sessão:** ~60 s por partida bem sucedida
- **Curva de retenção esperada:** loops de 3-5 minutos (perde, tenta de novo, supera high score)

---

## 4. Loop de gameplay

```
   ┌────────────────────────────────────┐
   │                                    ▼
[Tela inicial] → [História] → [Gameplay] → [Vitória]
                                  │
                                  ▼
                              [Derrota] → volta para Gameplay
```

### 4.1 Tela inicial
- Logo "PEDRO VAI AO MERCADO" pixelado, piscando entre 2 cores
- "PRESS START" piscando abaixo
- High score no canto inferior
- Música chiptune em loop, BPM 120, Lá menor

### 4.2 Tela de história (cutscene)
- Texto narrativo com efeito **typewriter** (caractere por caractere, ~30 ms cada)
- Texto:
  ```
  A MAE DO PEDRO PEDIU UM BOLO
  PARA A SOBREMESA DE HOJE.

  ELA DEU UM DINHEIRO E
  MANDOU PEDRO AO MERCADO.

  MAS A FAMILIA TEM PRESSA!

  PEDRO TEM 60 SEGUNDOS PARA
  CHEGAR LA. CUIDADO COM
  BURACOS, IDOSOS, LADROES,
  ARVORES, GATOS E CACHORROS!

  BOA SORTE, PEDRO!

  - APERTE PARA COMECAR -
  ```
- Mesma música de fundo da tela inicial
- Apertar qualquer coisa → entra em GAME

### 4.3 Gameplay
- Pedro auto-corre da esquerda para direita (mundo rola)
- Jogador só controla pulo
- Timer regressivo no canto superior esquerdo
- Score (distância) no canto superior direito
- Música ambiente minimal (só percussão noise rítmica)
- Aos ~50 s aparece a placa do MERCADO no horizonte
- Aos 60 s ou ao tocar a placa → VICTORY

### 4.4 Vitória
- Pedro para na frente do mercado
- Texto: "PEDRO COMPROU O BOLO!"
- Score final: `distância + (tempoRestante × 10)`
- Comparação com high score (atualiza se necessário)
- Música: arpejo ascendente em Dó maior
- "PRESS START PARA JOGAR DE NOVO"

### 4.5 Derrota
- Timer chega a 0 OU Pedro colide com obstáculo
- Pedro pisca em vermelho 3 vezes
- Texto: "TEMPO ESGOTADO!" ou "PEDRO TROPEÇOU!"
- "A MAE FICOU BRAVA..."
- Música: square descendente 440 → 110 Hz
- "PRESS START PARA TENTAR DE NOVO"

> **Nota alfa:** versão alfa só usa timeout como derrota; colisão **deduz tempo** (penalidade de 5 s) mas não encerra. Decisão registrada para ajustar conforme playtesting.

---

## 5. Personagem: Pedro

**Aparência:** menino brasileiro, ~12 anos, cabelo escuro curto, camisa azul, calça verde escura. Sprite 12×18 px.

**Animações:**
- `run-A` e `run-B`: alterna a cada 6 frames durante corrida no chão
- `jump`: braços levantados, pernas dobradas (1 frame único enquanto no ar)
- `hurt` (futuro): pisca em vermelho ao tomar dano

**Física:**
- Velocidade de corrida do mundo: 2 px/frame (constante)
- Pulo: impulso vertical -8.5 px/frame, gravidade 0.55 px/frame²
- Tempo de ar: ~30 frames (0.5 s)
- Altura máxima: ~65 px

---

## 6. Obstáculos

| #  | Obstáculo            | Sprite (px) | Comportamento                                  | Estratégia do jogador |
|----|----------------------|-------------|-------------------------------------------------|------------------------|
| 1  | Buraco na rua        | 16×8        | Estático, no nível do chão                      | Pulo curto             |
| 2  | Idoso c/ carrinho    | 14×16       | Anda lentamente em direção a Pedro              | Pulo médio             |
| 3  | Ladrão               | 10×16       | Corre em direção a Pedro (mais rápido)          | Pulo no momento certo  |
| 4  | Árvore               | 12×24       | Estática, alta                                  | Pulo no último momento |
| 5  | Gato                 | 10×8        | Pula entre 2 alturas (~30 px)                   | Timing crítico         |
| 6  | Cachorro             | 14×10       | Anda + late (SFX) + às vezes para               | Pulo médio             |

### 6.1 Densidade
- Probabilidade de spawn aumenta com o tempo (ver `TECHNICAL_SPEC.md` §6.2)
- Combinações duplas (2 obstáculos próximos) liberadas só após 30 s

### 6.2 Justiça
- **Garantia matemática:** todo obstáculo é pulável a partir do momento em que o jogador o vê na tela.
- Distância mínima entre obstáculos > distância de pulo + tempo de reação.

---

## 7. Cenário

### 7.1 Camadas (parallax)
1. **Céu (fundo):** azul `#5C94FC`, estático
2. **Sol:** círculo amarelo no canto, estático
3. **Prédios distantes:** silhuetas pretas com janelinhas amarelas, scroll 0.3 px/frame
4. **Prédios próximos:** silhuetas marrons/vermelhas com mais detalhe, scroll 0.7 px/frame
5. **Calçada:** scroll 2 px/frame (mesma do mundo)
6. **Pedro:** posição fixa em x=32

### 7.2 Detalhes do chão
- Tijolos da calçada alternados (textura repetitiva)
- Tampas de bueiro a cada ~80 px (decoração)

### 7.3 Marco visual: o mercado
- Aos 60 s aparece à direita uma fachada com a placa "MERCADO"
- Cor da placa: `#FC4828` (vermelho mercado)
- Detalhe: vitrine com o bolo desenhado

---

## 8. HUD

```
┌──────────────────────────────────┐
│ TEMPO 47    SCORE 1240   $       │
├──────────────────────────────────┤
│                                  │
│       [gameplay]                 │
│                                  │
└──────────────────────────────────┘
```

- **TEMPO:** segundos restantes (pisca em vermelho quando < 10 s, com tick sonoro)
- **SCORE:** distância em metros (`px / 10`)
- **$:** ícone do dinheiro (decorativo nesta alfa)

---

## 9. Sistema de pontuação

```
scoreFinal = distanciaPercorrida + (tempoRestante × 10)
```

- Distância percorrida: 1 ponto por px (~720 pontos numa partida de 60s)
- Bônus de tempo: incentiva chegar rápido
- Score máximo teórico: ~1300

**High score** persistido em `localStorage`.

**Não há sistema de níveis nesta alfa** — uma fase única, replay para superar score.

---

## 10. Áudio

### 10.1 Música tema (tela inicial + história)
- Lá menor, BPM 120, 16 compassos em loop
- 2 vozes: melodia (square) + baixo (triangle)
- Melodia inspirada em "trilha de aventura urbana 8-bit"

### 10.2 Música ingame
- Apenas percussão (noise burst rítmica): tum-tum-tac-tum a cada 8 frames
- Frequência aumenta sutilmente nos últimos 10 s

### 10.3 SFX (todos sintetizados em runtime)
- `jump`: square sweep 880→1320 Hz, 80 ms
- `land`: noise burst, 50 ms
- `hit`: noise + triangle 110 Hz, 200 ms
- `victory`: arpejo 523-659-784-1047 Hz
- `gameover`: square sweep 440→110 Hz, 600 ms
- `tick`: square 220 Hz, 30 ms (último 10 s do timer)
- `coin` (reservado): square 1760 Hz, 100 ms

---

## 11. Acessibilidade

- Controle redundante: teclado/mouse/touch
- Mute com `M`
- Pausa com `P`
- Pedro sempre destaca contra o fundo (cor azul vivo em fundos terrosos/marrons)
- Sem flashes >3 Hz
- Texto em fonte bitmap legível (mínimo 5×7 px)

---

## 12. Decisões de design — racional

### 12.1 Por que auto-runner?
- Reduz superfície de input → fácil em qualquer plataforma (1 botão).
- Estilo Atari simples (Pitfall era multidirecional, mas Keystone Kapers e o T-Rex são auto-runners).
- Foco em timing e padrão, não em controle complexo.

### 12.2 Por que timer ao invés de vidas?
- Cria pressão constante sem "morte" abrupta.
- Mais coerente com a história ("a mãe tem pressa").
- Permite alfa simples sem sistema de respawn.

### 12.3 Por que 60 segundos?
- Loop curto = mais tentativas por sessão.
- Tempo justo para uma corrida sem ser frustrante.
- Ajustável por playtesting.

### 12.4 Por que sem inimigos atacáveis?
- Atari 2600 raramente tinha mecânica de combate em runners.
- Mantém o jogo focado em uma única ação (pular).
- Beta pode adicionar coletáveis (moedas) e power-ups.

---

## 13. Roadmap de design (pós-alfa)

- **Beta:** moedas coletáveis, 3 fases (manhã/tarde/noite com paletas diferentes)
- **1.0:** boss "Cachorrão do quarteirão" antes do mercado
- **Mods:** modo "Kelly" (esposa do Luiz) com sprite alternativo
- **Educacional:** versão para alunos do UFABC com modo debug visual (hitboxes, FPS, RNG seed)

---

## 14. Inspirações canônicas

| Jogo               | O que pegamos                              |
|--------------------|--------------------------------------------|
| Pitfall! (1982)    | Estética de cenário urbano, paleta, scroll |
| Keystone Kapers    | Cenário urbano lateral, perseguição        |
| T-Rex Runner       | Auto-run + 1 botão (pular), geração proc.  |
| Pac-Man (música)   | Chiptune curto e memorável                 |

---

## 15. Métricas de sucesso da alfa

- [ ] Luiz consegue terminar o jogo em < 5 tentativas
- [ ] Luiz se diverte (auto-relato)
- [ ] Roda em < 100 KB total
- [ ] 60 FPS estáveis em hardware modesto
- [ ] Crianças entendem a mecânica em < 10 s sem instruções
