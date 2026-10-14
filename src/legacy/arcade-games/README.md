# Arcade Games (legado, não utilizado)

Este diretório guarda dois minijogos — `CyberSnake` (Snake) e `SpaceDefender`
(shoot 'em up) — que faziam parte de uma versão anterior do projeto, antes do
pivô para o jogo de defesa tática **Summoner Guardian**.

## Por que estão aqui e não em `src/components/`

Nenhum dos dois componentes é importado por `App.tsx` ou por qualquer outro
arquivo ativo do app — confirmado via busca em todo o `src/`. Ou seja, hoje
eles são código morto do ponto de vista do bundle que roda em produção
(o Vite não vai incluí-los a menos que algo passe a importá-los).

Em vez de apagar ~1850 linhas de código funcional de uma vez, optei por
isolá-las aqui, claramente sinalizadas, para que a decisão de descartar ou
reaproveitar seja do time/dono do projeto — não uma decisão unilateral de
limpeza automática.

## Conteúdo

- `CyberSnake.tsx` — clone de Snake com power-ups (dourado, congelar, fantasma).
- `SpaceDefender.tsx` — shoot 'em up vertical com partículas e power-ups.
- `types.ts` — tipos compartilhados pelos dois (`GameId`, `GameState`,
  `HighScoreRecord`, `GameInfo`, `PlayerStats`). Note que `GameId` inclui
  `'brick'` (um terceiro jogo, "Brick Breaker"), mas não há componente
  correspondente — provavelmente foi planejado e nunca implementado, ou foi
  removido antes do pivô.
- `assets/images/` — as 3 imagens de capa dos jogos de arcade
  (`arcade_brick_card`, `arcade_snake_card`, `arcade_space_hero`). Nenhuma
  delas é referenciada pelo código atual, nem mesmo pelos próprios jogos
  acima (ambos renderizam tudo via `<canvas>`).

Ambos dependem de `src/utils/audio.ts` (`sound`), que continua em uso pelo
jogo principal — por isso esse utilitário **não** foi movido para cá.

## Opções a partir daqui

1. **Descartar de vez**: apagar esta pasta inteira. O histórico do Git
   preserva o código caso seja necessário recuperá-lo depois.
2. **Reativar como um hub de minigames**: criar uma tela de seleção de jogos
   em `App.tsx` que alterne entre Summoner Guardian e os arcade games — nesse
   caso, mover este diretório de volta para `src/components/games/` e
   implementar o "Brick Breaker" que falta, ou remover a entrada `'brick'`
   de `GameId`.
3. **Manter como está**: deixar isolado aqui até que haja uma decisão.
