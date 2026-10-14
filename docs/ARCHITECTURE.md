# Arquitetura

Visão mais detalhada de como o Summoner Guardian é construído, para quem
for dar manutenção no código.

## Visão geral

É uma SPA (Single Page Application) 100% client-side — não há backend.
Todo o estado do jogo vive em memória (React state) e é persistido no
`localStorage` do navegador. Não há autenticação, multiplayer ou
sincronização entre dispositivos.

```
main.tsx
 └─ App.tsx
     └─ SummonerGame.tsx        ← componente orquestrador
         ├─ BattleArena.tsx     ← renderização em <canvas>
         ├─ CardHand.tsx        ← mão de cartas
         └─ DeckBuilder.tsx     ← montagem de baralho / upgrades (modal)
```

## `SummonerGame.tsx` — o orquestrador

É o maior componente do projeto (~1170 linhas) e concentra:

- Estado persistido em `localStorage`: coleção de cartas (`cards`),
  baralho ativo (`deckCardIds`), moeda do jogo (`crystals`) e upgrades do
  invocador (`upgrades`). Cada um é carregado de forma defensiva (com
  `try/catch` e fallback para valores padrão, logando um aviso no console
  se o JSON salvo estiver corrompido) e salvo de volta via `useEffect`
  sempre que muda.
- O loop de jogo: regeneração de energia, timers de wave, spawn de
  inimigos, resolução de combate (dano, morte de unidades, projéteis).
- O HUD: vida do Santuário, energia disponível, contador de wave, botões
  de pausa/velocidade/som.

Esse componente concentra bastante responsabilidade (estado de UI,
estado de domínio, loop de jogo e persistência, tudo junto). Funciona bem
no tamanho atual do jogo, mas se o projeto crescer (mais telas, mais
cartas, multiplayer, etc.), vale considerar:

- Extrair a persistência em `localStorage` para um hook próprio
  (`useLocalStorageState<T>`), já que o mesmo padrão
  (`try { JSON.parse } catch { fallback }` + `useEffect` de save) se
  repete 4 vezes.
- Extrair o loop de jogo (spawn, combate, timers) para um hook
  (`useGameLoop`) ou um reducer, separando "regras do jogo" de
  "apresentação".

Nenhuma dessas extrações foi feita nesta limpeza — são mudanças de
comportamento potencial (ainda que pequeno), e o foco aqui foi
organização e higiene do repositório, não refatoração de lógica de jogo
sem uma suíte de testes para validar que nada quebrou.

## `BattleArena.tsx` — renderização

Desenha o campo de batalha em um elemento `<canvas>`, unidade por unidade,
a cada frame. Usa dois utilitários de geração procedural de pixel art:

- `src/utils/pixelSprites.ts` — desenha as criaturas/unidades.
- `src/utils/pixelEnvironments.ts` — desenha o cenário/fundo de cada wave.

Ambos são desenhados programaticamente (sem assets de imagem) usando
`ctx.fillRect` em uma grade de "pixels" — por isso o CSS global
(`src/index.css`) força `image-rendering: pixelated` no canvas.

## Cartas e dados do jogo

`src/data/summonerCards.ts` é a fonte única de verdade para as cartas
iniciais do jogo (`INITIAL_CARDS`) e para o mapeamento de cada `cardId`
para sua imagem (`getCardImage`). As imagens em si são importadas
diretamente (`import heroImg from '../assets/images/...'`) para que o
Vite as inclua no bundle com hash de conteúdo — isso é proposital e
evita que uma imagem "quebre" em produção mesmo que o `localStorage`
tenha um caminho antigo salvo (ver comentário no próprio arquivo).

## Som

`src/utils/audio.ts` implementa um sintetizador simples via Web Audio API
(sem arquivos de áudio externos) — usado tanto pelo jogo ativo quanto
pelos jogos legados em `src/legacy/`.

## `src/legacy/arcade-games/`

Ver o [README dentro da própria pasta](../src/legacy/arcade-games/README.md)
para o que é, por que está isolado e as opções de seguir em frente.

## Decisões desta limpeza de repositório

Resumo do que mudou estruturalmente (o "porquê" de cada coisa está nos
commits e no README principal):

1. Removida a pasta `public/assets/images/` — era uma duplicata exata,
   não referenciada, de `src/assets/images/` (11 MB redundantes).
2. Movidos `CyberSnake.tsx`, `SpaceDefender.tsx` e `types/game.ts` para
   `src/legacy/arcade-games/`, por não serem importados por nenhum
   componente ativo.
3. Adicionado `React.StrictMode` em `main.tsx`.
4. Corrigidos 4 blocos `catch {}` vazios (agora logam um aviso) e removidas
   duas variáveis mortas em `pixelEnvironments.ts` (`laneIdx`, `isStagger`/`sx`
   — um efeito visual de "tijolos alternados" que nunca chegou a ser
   aplicado ao desenho).
5. Adicionado ESLint + Prettier + EditorConfig + `.nvmrc`.
6. `package.json`: nome, descrição, autor, licença, `engines`, scripts de
   lint/format separados do typecheck, e correção de um conflito de
   `peerDependencies` entre `vite@8` e `esbuild` (estava pinado numa
   versão antiga demais).
7. Adicionado `.github/workflows/ci.yml` para rodar typecheck + lint +
   build automaticamente.
