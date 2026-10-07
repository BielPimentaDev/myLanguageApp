# Tech Spec 05 — Prática da Frase

**Status:** Pronto para implementação
**Depende de:** Tech Spec 04 (Conteúdo de Aprendizado)
**ADRs relacionadas:** 0001 (port de IA)

## Objetivo da entrega

Na tela de aprendizado, permitir que o usuário escreva uma frase usando a palavra/expressão do flashcard e receba feedback automático da IA sobre se o uso está correto.

## Escopo

**Dentro:** submissão de frase de prática; avaliação via IA; exibição do feedback; histórico simples de tentativas por flashcard.
**Fora:** qualquer nova entrega além do MVP original (esta é a última fatia planejada).

## Novo módulo de backend: `practice`

```
src/modules/practice/
  domain/
    entities/practice-attempt.ts   # PracticeAttempt (id, flashcardId, sentence, isCorrect, feedback, createdAt)
    ports/
      practice-repository.ts       # save(attempt), findByFlashcardId(id)
      practice-ai.port.ts          # evaluate(term, sentence): Promise<{ isCorrect, feedback }>
  application/
    use-cases/
      submit-practice-sentence.ts  # busca flashcard (via módulo flashcard), chama practice-ai.port, persiste e retorna avaliação
  infrastructure/
    http/practice.routes.ts
    repositories/sqlite-practice.repository.ts
    ai/anthropic-practice-ai.adapter.ts
  index.ts
```

**Por que um módulo novo, e não reaproveitar `analysis` diretamente:** a regra de negócio é a mesma ("avaliar uso de uma palavra/expressão numa frase"), mas o contexto de entrada é diferente (uma frase isolada do usuário vs. uma conversa inteira) e o destino é diferente (anexado a um flashcard, não a uma conversa). Reaproveita-se a **ideia** do prompt de avaliação (mesmo estilo de instrução pra IA), não o código do módulo `analysis` — isso evitaria o acoplamento entre dois módulos que não têm razão de negócio para se conhecer. Se, na prática, o prompt for idênto byte-a-byte, extrair um helper de prompt compartilhado é aceitável, mas os `ports`/casos de uso continuam distintos por módulo.

## Regra de domínio

- `evaluate` recebe o `term` (a forma correta que o usuário deveria usar, vindo do flashcard) e a `sentence` escrita pelo usuário; retorna `isCorrect` (booleano) + `feedback` (explicação curta, especialmente se incorreto).
- Múltiplas tentativas para o mesmo flashcard são permitidas e todas persistidas (não há limite de tentativas no MVP).

## Dados (SQLite)

```sql
CREATE TABLE practice_attempts (
  id TEXT PRIMARY KEY,
  flashcard_id TEXT NOT NULL REFERENCES flashcards(id),
  sentence TEXT NOT NULL,
  is_correct INTEGER NOT NULL, -- 0 ou 1
  feedback TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## API (Fastify)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/flashcards/:id/practice` | `{ sentence }` | `{ isCorrect, feedback }` |
| GET | `/flashcards/:id/practice` | — | `{ attempts: PracticeAttempt[] }` |

## Frontend

```
app/flashcards/[id]/
  components/
    PracticeForm.tsx       # UI pura: campo de texto + botão enviar
    PracticeFeedback.tsx   # UI pura: exibe isCorrect + feedback
  hooks/
    usePractice.ts          # submete frase, guarda feedback da última tentativa
  services/
    practice.service.ts
```

Integra na mesma tela de `LearningContent.tsx` (entrega 4) como uma seção adicional abaixo da tradução/exemplos.

## Critério de aceite (teste manual)

1. Na tela de aprendizado de um flashcard, escrever uma frase correta usando a palavra/expressão → feedback indica acerto.
2. Escrever uma frase que usa a palavra de forma errada → feedback indica erro, com explicação coerente.
3. Enviar uma segunda tentativa → ambas as tentativas ficam registradas (consultável via `GET .../practice`).

## Fechamento do MVP

Com esta entrega, o ciclo completo do PRD (`docs/prd.md`) está implementado de ponta a ponta. Próximos incrementos (áudio, auth, múltiplos cenários/idiomas, SRS, histórico de conversas) exigem PRDs/tech specs próprios, fora do escopo coberto por este conjunto de documentos.
