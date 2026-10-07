# ADR-0004 — Flashcards sem algoritmo de repetição espaçada (SRS) na v1

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

Repetição espaçada (ex: SM-2) é uma peça de lógica de domínio não-trivial — exigiria TDD completo (regra obrigatória em `application`/`domain` conforme `apps/api/CLAUDE.md`) para algo que ainda não sabemos se é a parte do produto que gera valor. O que o MVP precisa validar primeiro é se o ciclo "errei → guardei → revisei e aprendi" funciona, não a otimização de quando revisar.

## Decisão

Flashcards criados no MVP ficam numa **lista simples**, sem data de próxima revisão, sem algoritmo de priorização. O usuário acessa e revisa livremente, na ordem que quiser.

## Consequências

- Reduz drasticamente o escopo de domínio da entrega 3 (Flashcard).
- Introduzir SRS depois é aditivo: um campo de agendamento + uma regra de ordenação na listagem, sem redesenhar o conceito de flashcard em si.
- Sem SRS, não há garantia de que o usuário revise os cards no momento ótimo para retenção — risco aceito deliberadamente nesta fase.
