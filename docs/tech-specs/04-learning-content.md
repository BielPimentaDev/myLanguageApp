# Tech Spec 04 — Conteúdo de Aprendizado

**Status:** Pronto para implementação
**Depende de:** Tech Spec 03 (Flashcard)
**ADRs relacionadas:** 0001 (port de IA)

## Objetivo da entrega

Ao criar um flashcard, gerar (uma única vez) tradução e exemplos de uso em contexto via IA, persistir junto ao flashcard, e exibir isso numa tela de aprendizado dedicada.

## Escopo

**Dentro:** geração e persistência de conteúdo de aprendizado no momento da criação do flashcard; tela de aprendizado exibindo esse conteúdo.
**Fora:** prática de frase com feedback (entrega 5).

## Mudança no módulo `flashcard`

```
src/modules/flashcard/
  domain/
    entities/flashcard.ts             # ganha: translation, contextExamples: string[], learningContentGeneratedAt
    ports/
      learning-content-ai.port.ts     # generate(term, languagePair): Promise<{ translation, contextExamples }>
  application/
    use-cases/
      create-flashcard-from-finding.ts  # após criar o Flashcard, chama learning-content-ai.port e persiste o conteúdo antes de retornar
  infrastructure/
    ai/anthropic-learning-content-ai.adapter.ts
```

Geração de conteúdo acontece **dentro** do mesmo use case de criação do flashcard (não é um endpoint separado), porque a decisão de produto (Q8) foi gerar uma única vez, no momento da criação. Isso mantém o flashcard sempre "completo" assim que existe — não há um estado intermediário de flashcard sem conteúdo de aprendizado.

## Regra de domínio

- Se a chamada de IA para gerar conteúdo falhar, a criação do flashcard inteira falha (não existe flashcard "parcial" sem conteúdo) — simples e consistente para o MVP; revisitar se isso se provar frágil demais na prática.
- `contextExamples` é uma lista pequena (ex: 2–3 frases de exemplo) com a palavra/expressão em uso real.

## Dados (SQLite)

```sql
ALTER TABLE flashcards ADD COLUMN translation TEXT;
ALTER TABLE flashcards ADD COLUMN context_examples TEXT; -- JSON array serializado
ALTER TABLE flashcards ADD COLUMN learning_content_generated_at TEXT;
```

## API (Fastify)

Nenhuma rota nova — `GET /flashcards/:id` (criado nesta entrega) passa a retornar os campos de conteúdo de aprendizado junto com o flashcard:

| Método | Rota | Resposta |
|---|---|---|
| GET | `/flashcards/:id` | `{ flashcard: { ...,  translation, contextExamples[] } }` |

## Frontend

```
app/flashcards/
  [id]/
    components/
      LearningContent.tsx   # UI pura: mostra term, translation, contextExamples
    hooks/
      useFlashcard.ts        # busca o flashcard por id
```

`FlashcardList.tsx` (entrega 3) ganha navegação para `flashcards/[id]`.

## Critério de aceite (teste manual)

1. Criar um flashcard novo (via tela de achados) → ao abrir a tela de aprendizado dele, tradução e exemplos já aparecem, sem delay perceptível de geração (foi gerado na criação).
2. Reabrir a mesma tela de aprendizado depois → mesmo conteúdo aparece (não muda a cada visita).
3. Exemplos de contexto usam a palavra/expressão do jeito correto (a `suggestion`, não o erro original).
