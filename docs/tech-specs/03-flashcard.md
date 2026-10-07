# Tech Spec 03 — Flashcard

**Status:** Pronto para implementação
**Depende de:** Tech Spec 02 (Análise)
**ADRs relacionadas:** 0004 (sem SRS na v1)

## Objetivo da entrega

Permitir que o usuário marque um achado para treinar, transformando-o num flashcard, e veja seus flashcards numa lista simples.

## Escopo

**Dentro:** criar flashcard a partir de um achado; listar flashcards.
**Fora:** conteúdo de aprendizado (tradução/exemplos — entrega 4), prática de frase (entrega 5), qualquer agendamento/SRS (ver ADR-0004).

## Módulo de backend: `flashcard`

```
src/modules/flashcard/
  domain/
    entities/flashcard.ts     # Flashcard (id, term, suggestion, explanation, sourceFindingId, createdAt)
    errors/                   # ex: FindingNotFoundError, FlashcardAlreadyExistsForFindingError
    ports/
      flashcard-repository.ts # save(flashcard), findAll(), findById(id)
  application/
    use-cases/
      create-flashcard-from-finding.ts   # recebe findingId, busca o finding (via módulo analysis), cria e persiste Flashcard
      list-flashcards.ts
  infrastructure/
    http/flashcard.routes.ts
    repositories/sqlite-flashcard.repository.ts
  index.ts
```

**Acesso entre módulos:** `flashcard` não lê a tabela de `findings` diretamente — obtém o dado do achado através do `index.ts` público do módulo `analysis` (ex: `getFindingById(id)`).

## Regra de domínio

- Um `Finding` só pode gerar **um** flashcard (evita duplicata se o usuário clicar "treinar" duas vezes) — `create-flashcard-from-finding` verifica isso antes de criar.
- `Flashcard.term` é o texto que o usuário vai estudar: por padrão, a `suggestion` do achado (a forma correta/melhor), não o `originalText` (o erro) — é isso que o usuário deve aprender a usar.

## Dados (SQLite)

```sql
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  source_finding_id TEXT NOT NULL REFERENCES findings(id),
  term TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## API (Fastify)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/flashcards` | `{ findingId }` | `{ flashcard }` |
| GET | `/flashcards` | — | `{ flashcards: Flashcard[] }` |

## Frontend

```
app/
  conversation/
    components/FindingsList.tsx   # ganha um botão "Treinar" por achado (atualiza entrega 2)
    hooks/useFindings.ts           # ganha ação markForTraining(findingId) -> chama POST /flashcards
  flashcards/
    components/FlashcardList.tsx   # UI pura: lista simples de flashcards
    hooks/useFlashcards.ts         # busca a lista
    services/flashcard.service.ts
```

## Critério de aceite (teste manual)

1. Na tela de achados, clicar "Treinar" num item → aparece confirmação de que virou flashcard.
2. Clicar "Treinar" de novo no mesmo achado não cria um segundo flashcard duplicado.
3. Tela de lista de flashcards mostra todos os flashcards criados até agora, sem ordenação especial de revisão (apenas lista, ver ADR-0004).
