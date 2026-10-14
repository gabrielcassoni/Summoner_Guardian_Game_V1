# Summoner Guardian 🌿

Jogo de defesa tática no navegador onde você é um **Invocador da Natureza**:
ganhe energia com o tempo e use cartas de um baralho customizável para
invocar criaturas e defender seu Santuário contra hordas de monstros.

![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Sumário

- [Stack](#stack)
- [Começando](#começando)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como o jogo funciona](#como-o-jogo-funciona)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Qualidade de código](#qualidade-de-código)
- [Estado do projeto / limitações conhecidas](#estado-do-projeto--limitações-conhecidas)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## Stack

- **[React 19](https://react.dev/)** + **TypeScript** para a UI e a lógica de jogo.
- **[Vite 8](https://vite.dev/)** como bundler e servidor de desenvolvimento.
- **[Tailwind CSS 4](https://tailwindcss.com/)** para estilização.
- **[lucide-react](https://lucide.dev/)** para ícones.
- **[motion](https://motion.dev/)** para animações.
- Renderização do campo de batalha (`<canvas>`) feita à mão, sem engine de
  jogo externa — veja [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

> **Nota sobre o TypeScript 7:** este projeto usa o novo compilador nativo
> do TypeScript 7. Como o ecossistema de lint ainda não suporta a API do
> TS7 diretamente, o `package.json` usa um alias de pacotes (mesma
> abordagem [documentada pela equipe do TypeScript](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/))
> para rodar `tsc` na v7 e o ESLint na v6 por baixo dos panos. Isso é
> transparente para quem só roda `npm install`.

## Começando

Pré-requisitos: **Node.js 20+** (veja [`.nvmrc`](.nvmrc)) e npm.

```bash
# instalar dependências
npm install

# subir o servidor de desenvolvimento em http://localhost:3000
npm run dev
```

Para gerar o build de produção:

```bash
npm run build   # gera a pasta dist/
npm run preview # serve o build de produção localmente
```

## Scripts disponíveis

| Script                 | O que faz                                              |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento com hot reload (porta 3000). |
| `npm run build`         | Build de produção (pasta `dist/`).                      |
| `npm run preview`       | Serve o build de produção localmente.                   |
| `npm run clean`         | Remove a pasta `dist/`.                                 |
| `npm run typecheck`     | Checa os tipos com `tsc --noEmit`, sem gerar arquivos.   |
| `npm run lint`          | Roda o ESLint em todo o projeto.                         |
| `npm run lint:fix`      | Roda o ESLint e corrige o que for automaticamente corrigível. |
| `npm run format`        | Formata o projeto com Prettier.                          |
| `npm run format:check`  | Verifica a formatação sem alterar arquivos.              |

## Estrutura do projeto

```
.
├── index.html                  # entrada HTML (Vite)
├── metadata.json                # metadados do app (nome, descrição)
├── src/
│   ├── main.tsx                 # bootstrap do React
│   ├── App.tsx                  # componente raiz
│   ├── index.css                # estilos globais (Tailwind)
│   ├── assets/images/           # artes das cartas usadas pelo jogo ativo
│   ├── components/
│   │   ├── common/              # componentes reutilizáveis (ex.: SafeImage)
│   │   └── summoner/            # UI do Summoner Guardian (o jogo em si)
│   │       ├── SummonerGame.tsx     # componente "orquestrador": estado, loop de jogo, HUD
│   │       ├── BattleArena.tsx      # renderização do campo de batalha em <canvas>
│   │       ├── CardHand.tsx         # mão de cartas do jogador
│   │       └── DeckBuilder.tsx      # tela de montagem de baralho / upgrades
│   ├── data/
│   │   └── summonerCards.ts     # definição de todas as cartas/criaturas do jogo
│   ├── types/
│   │   └── summoner.ts          # tipos do domínio do jogo (Card, BattlefieldUnit, etc.)
│   ├── utils/
│   │   ├── audio.ts             # sintetizador de som via Web Audio API
│   │   ├── pixelSprites.ts      # sprites pixel-art desenhados em canvas
│   │   └── pixelEnvironments.ts # fundos/cenários pixel-art desenhados em canvas
│   └── legacy/arcade-games/     # código de uma versão anterior do projeto,
│                                 # hoje não importado por lugar nenhum do app.
│                                 # Veja o README dentro da pasta antes de
│                                 # apagar ou reativar.
├── docs/
│   └── ARCHITECTURE.md          # visão arquitetural mais detalhada
├── .github/
│   ├── workflows/ci.yml         # typecheck + lint + build em cada push/PR
│   └── PULL_REQUEST_TEMPLATE.md
├── eslint.config.js
├── .prettierrc.json
├── .editorconfig
├── .nvmrc
├── tsconfig.json
└── vite.config.ts
```

## Como o jogo funciona

1. O jogador monta um baralho de cartas de criaturas/feitiços em
   `DeckBuilder`.
2. Durante a partida, `SummonerGame` controla o loop principal: regeneração
   de energia, compra de cartas, spawn de ondas de monstros e progresso de
   wave.
3. `BattleArena` desenha o campo de batalha, as unidades, projéteis e
   efeitos visuais em um `<canvas>`, usando sprites e cenários pixel-art
   gerados em `src/utils/pixelSprites.ts` e `pixelEnvironments.ts`.
4. O progresso (cartas desbloqueadas, baralho, cristais, upgrades) é
   persistido no `localStorage` do navegador — não há backend.

Mais detalhes de arquitetura, decisões de design e pontos de atenção estão
em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores necessários:

```bash
cp .env.example .env
```

| Variável          | Descrição                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `GEMINI_API_KEY`   | Chave da API do Gemini. **Atualmente não é consumida pelo código em `src/`** — ver [Estado do projeto](#estado-do-projeto--limitações-conhecidas). |
| `APP_URL`          | URL onde o app está hospedado (usada por integrações futuras).    |

## Qualidade de código

- **TypeScript em modo estrito** via `tsconfig.json`.
- **ESLint** (`eslint.config.js`) com regras de React Hooks e TypeScript.
- **Prettier** para formatação consistente (não aplicado retroativamente a
  todo o código legado nesta limpeza, para manter o diff revisável — rode
  `npm run format` quando quiser aplicar).
- **CI** (`.github/workflows/ci.yml`) roda `typecheck`, `lint` e `build` em
  todo push/PR.

## Estado do projeto / limitações conhecidas

Esta seção documenta, de forma transparente, o que foi encontrado durante
uma revisão do repositório — para que as próximas pessoas a mexer no
código (ou você mesmo, daqui a uns meses) não percam tempo redescobrindo.

- **`src/legacy/arcade-games/`**: dois minijogos (Snake e um shoot 'em up)
  de uma versão anterior do projeto não estão conectados ao app atual.
  Foram isolados nessa pasta em vez de apagados — veja o README lá dentro
  para o raciocínio e as opções.
- **Dependências não utilizadas pelo código atual**: `@google/genai`,
  `express`, `dotenv` e `tsx` estão no `package.json` mas não há nenhuma
  chamada a eles em `src/`. O `metadata.json` declara a capacidade
  `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, o que sugere que uma
  integração server-side com a API do Gemini foi planejada mas ainda não
  implementada (não existe nenhum `server.js` no repositório). Mantive as
  dependências por ora — remover ou implementar a integração é uma decisão
  de produto, não de limpeza de repositório.
- **Imagens das cartas são grandes**: cada imagem em `src/assets/images/`
  tem quase 1 MB, e o build de produção reflete isso. Vale considerar
  comprimir (ex.: `.webp` ou JPEG com qualidade menor) ou gerar
  thumbnails, especialmente se o jogo for hospedado publicamente.
- **`npm run lint` ainda reporta alguns avisos** (não erros) sobre uma prop
  (`onBackToHub`) sem uso em `SummonerGame.tsx` — provavelmente um resquício
  de uma tela "hub" que selecionava entre os jogos de arcade e o Summoner
  Guardian — e uma dependência de `useEffect` possivelmente incompleta.
  Ambos documentados para investigação futura em vez de corrigidos às
  cegas sem poder testar o jogo interativamente.

## Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

Distribuído sob a licença MIT — veja [`LICENSE`](LICENSE).
