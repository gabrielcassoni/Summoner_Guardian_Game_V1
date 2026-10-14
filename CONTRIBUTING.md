# Contribuindo

Obrigado pelo interesse em contribuir com o Summoner Guardian! 🌿

## Fluxo de trabalho

1. Faça um fork e crie uma branch a partir de `main`:
   `git checkout -b feat/nome-da-feature` ou `fix/nome-do-bug`.
2. Instale as dependências: `npm install`.
3. Faça suas alterações.
4. Antes de abrir o PR, rode:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```
   Todos devem passar sem erros (os mesmos checks rodam no CI).
5. Abra um Pull Request descrevendo o que mudou e por quê.

## Padrões de código

- TypeScript em todos os arquivos novos.
- Siga o estilo já usado no arquivo que você está editando; o Prettier
  (`npm run format`) cuida da formatação automática.
- Prefira nomes descritivos em vez de comentários explicando "o quê" — use
  comentários para explicar "por quê" quando a lógica não for óbvia.
- Commits pequenos e focados são mais fáceis de revisar do que um PR
  gigante.

## Convenção de commits

Não é obrigatório, mas commits no estilo
[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
`fix:`, `chore:`, `docs:`, `refactor:`) ajudam a manter o histórico
legível — é o padrão já usado no repositório.

## Reportando bugs

Abra uma issue descrevendo:

- O que você esperava que acontecesse.
- O que de fato aconteceu.
- Passos para reproduzir (se aplicável).
- Navegador/SO, se relevante.

## Código legado (`src/legacy/`)

Antes de mexer em `src/legacy/arcade-games/`, leia o
[README daquela pasta](src/legacy/arcade-games/README.md) — ele explica
por que aquele código está isolado do app ativo.
