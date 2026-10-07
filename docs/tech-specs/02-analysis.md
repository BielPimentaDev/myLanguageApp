# Tech Spec 02 — Análise

**Status:** Pronto para implementação
**Depende de:** Tech Spec 01 (Conversa)
**ADRs relacionadas:** 0001 (port de IA)

## Objetivo da entrega

Ao encerrar uma conversa, gerar e exibir uma lista de achados (erros ou expressões que poderiam ser melhores) a partir das falas do usuário — usando a conversa inteira como contexto para a IA, mas expondo ao usuário somente achados sobre as falas dele.

## Escopo

**Dentro:** disparar análise de uma conversa já encerrada; gerar achados via IA; persistir e exibir os achados.
**Fora:** marcar achado para treinar / flashcard (entrega 3).

## Módulo de backend: `analysis`

```
src/modules/analysis/
  domain/
    entities/finding.ts        # Finding (id, conversationId, originalText, suggestion, explanation, createdAt)
    errors/                    # ex: ConversationNotEndedError
    ports/
      analysis-repository.ts   # save(findings[]), findByConversationId(id)
      analysis-ai.port.ts      # analyze(transcript: TranscriptTurn[]): Promise<FindingDraft[]>
  application/
    use-cases/
      analyze-conversation.ts  # recebe conversationId, busca transcript (via conversation module), chama port de IA, persiste e retorna findings
  infrastructure/
    http/analysis.routes.ts
    repositories/sqlite-analysis.repository.ts
    ai/anthropic-analysis-ai.adapter.ts
  index.ts
```

**Acesso entre módulos:** `analysis` não lê o banco de `conversation` diretamente. Ele recebe o transcript (lista de turnos) através do `index.ts` público do módulo `conversation` (ex: uma função exportada `getConversationTranscript(conversationId)`), respeitando o limite de módulo do `CLAUDE.md`.

## Regra de domínio

- `analyze-conversation` só pode rodar se a conversa estiver com `status === 'ended'` (consulta via `conversation` module); caso contrário lança `ConversationNotEndedError`.
- O prompt de análise envia **todos** os turnos (IA + usuário) como contexto, mas instrui a IA a apontar achados **apenas** sobre os turnos de `role: 'user'`.
- Cada achado gerado vira um `Finding` com: `originalText` (trecho exato dito pelo usuário), `suggestion` (expressão melhor/correta), `explanation` (por que, em poucas palavras).

## Dados (SQLite)

```sql
CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  original_text TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## API (Fastify)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/conversations/:id/analysis` | — | `{ findings: Finding[] }` |
| GET | `/conversations/:id/analysis` | — | `{ findings: Finding[] }` (idempotente — se já analisado, retorna o que já existe em vez de gerar de novo) |

Frontend chama `POST .../analysis` imediatamente após `POST .../end` ter sucesso (orquestração na camada de hook/service do frontend, não um acoplamento direto entre os módulos de backend).

## Frontend: tela de Achados

```
app/conversation/
  components/
    FindingsList.tsx    # UI pura: lista de achados (original, sugestão, explicação)
  hooks/
    useFindings.ts       # dispara análise ao entrar na tela, guarda lista de achados
  services/
    analysis.service.ts  # chamada HTTP
```

Esta tela ainda não tem ação de "treinar" (isso é da entrega 3) — por ora é só visualização da lista de achados.

## Critério de aceite (teste manual)

1. Encerrar uma conversa com pelo menos um erro perceptível do usuário.
2. Tela de achados exibe pelo menos um item com trecho original + sugestão + explicação coerentes com o que foi digitado.
3. Falas da IA não aparecem como "achado" (a análise nunca aponta erro em turno `role: 'ai'`).
4. Reabrir a tela de achados da mesma conversa não gera uma segunda chamada de análise (usa o que já foi persistido).
