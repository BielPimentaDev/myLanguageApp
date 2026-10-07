# Documentação de produto/arquitetura — myLanguageApp

## PRD

- [`prd.md`](./prd.md) — visão do MVP, fluxo de ponta a ponta, critérios de sucesso, fora de escopo.

## Tech Specs (entregas incrementais, nesta ordem)

1. [`tech-specs/01-conversation.md`](./tech-specs/01-conversation.md) — conversa de texto no cenário fixo (cafeteria)
2. [`tech-specs/02-analysis.md`](./tech-specs/02-analysis.md) — análise de erros pós-diálogo
3. [`tech-specs/03-flashcard.md`](./tech-specs/03-flashcard.md) — marcar achado para treinar → flashcard
4. [`tech-specs/04-learning-content.md`](./tech-specs/04-learning-content.md) — tradução + exemplos gerados uma vez
5. [`tech-specs/05-sentence-practice.md`](./tech-specs/05-sentence-practice.md) — prática de frase com feedback da IA

Cada tech spec só deve começar a ser implementada depois que a anterior estiver testada (ver critério de aceite de cada uma).

## ADRs

- [`adr/0001-ai-provider-via-port.md`](./adr/0001-ai-provider-via-port.md) — IA (Anthropic) sempre via port/adapter
- [`adr/0002-sqlite-for-mvp.md`](./adr/0002-sqlite-for-mvp.md) — SQLite no MVP
- [`adr/0003-no-auth-in-mvp.md`](./adr/0003-no-auth-in-mvp.md) — sem autenticação/multiusuário
- [`adr/0004-no-srs-in-v1.md`](./adr/0004-no-srs-in-v1.md) — flashcards sem repetição espaçada
- [`adr/0005-text-only-mvp.md`](./adr/0005-text-only-mvp.md) — interação só por texto; áudio adiado
- [`adr/0006-language-fixed-but-configurable.md`](./adr/0006-language-fixed-but-configurable.md) — idioma fixo na UI, parametrizado no domínio
- [`adr/0007-single-fixed-scenario.md`](./adr/0007-single-fixed-scenario.md) — catálogo de cenários com um único item (cafeteria)
