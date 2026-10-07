# Tech Spec 01 — Conversa

**Status:** Pronto para implementação
**PRD:** `docs/prd.md`
**ADRs relacionadas:** 0001 (port de IA), 0002 (SQLite), 0005 (texto apenas), 0006 (idioma parametrizado), 0007 (cenário fixo)

## Objetivo da entrega

Permitir que o usuário tenha uma conversa de texto completa com a IA no cenário "Cafeteria" e a encerre — sem análise, flashcard ou qualquer etapa posterior ainda.

## Escopo

**Dentro:**
- Catálogo de cenários com um único cenário fixo (Cafeteria), definido em código (não em banco).
- Iniciar uma conversa.
- Enviar mensagem do usuário e receber resposta da IA, mantendo o histórico de turnos.
- Encerrar a conversa (botão do usuário) ou encerramento automático ao atingir limite de segurança de turnos.
- Persistir a conversa e seus turnos em SQLite.

**Fora (entra em entregas futuras):** análise de erros, flashcards, qualquer tela além do chat.

## Módulo de backend: `conversation`

```
src/modules/conversation/
  domain/
    entities/conversation.ts        # Conversation (id, scenarioId, languagePair, status, turns[])
    entities/scenario.ts            # Scenario (id, name, systemPrompt, goalDescription)
    entities/conversation-turn.ts   # ConversationTurn (role: 'user' | 'ai', content, createdAt)
    value-objects/language-pair.ts  # { target: Language, native: Language } — ver ADR-0006
    errors/                         # ex: ConversationAlreadyEndedError, TurnLimitExceededError
    ports/
      conversation-repository.ts    # save(conversation), findById(id)
      conversation-ai.port.ts       # generateReply(conversation, userMessage): Promise<string>
      scenario-catalog.ts           # findById(id), listAll() — implementação em domain mesmo (dado estático) ou infra, ver nota abaixo
  application/
    use-cases/
      start-conversation.ts         # cria Conversation em status 'active' a partir de um Scenario
      send-message.ts               # valida status/limite, adiciona turno do usuário, chama port de IA, adiciona turno da IA
      end-conversation.ts           # muda status para 'ended', seta endedAt
  infrastructure/
    http/
      conversation.routes.ts
    repositories/
      sqlite-conversation.repository.ts
    ai/
      anthropic-conversation-ai.adapter.ts   # implementa conversation-ai.port usando Anthropic SDK
  index.ts                           # exporta use cases/tipos públicos do módulo
```

**Nota sobre o catálogo de cenários:** como o catálogo é fixo e pequeno (ADR-0007), ele pode viver como uma constante em `domain` (ex: `SCENARIOS: Scenario[]`) sem necessidade de tabela própria no banco — evita um repositório inteiro para um dado que hoje tem um item só. Reavaliar quando o catálogo crescer.

## Regras de domínio (TDD obrigatório)

- `Conversation` não aceita novo turno se `status !== 'active'` (lança `ConversationAlreadyEndedError`).
- `Conversation` aplica o limite de segurança de turnos (ex: 15 trocas usuário+IA) — ao atingir, a própria entidade marca `status = 'ended'` automaticamente no próximo turno que excederia o limite.
- `send-message` (use case): orquestra validação de domínio → chamada ao `ConversationAIPort` → persistência. Testado com um fake do port de IA e um fake/in-memory do repositório.

## Dados (SQLite)

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  target_language TEXT NOT NULL,
  native_language TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
  started_at TEXT NOT NULL,
  ended_at TEXT
);

CREATE TABLE conversation_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## API (Fastify)

| Método | Rota | Body | Resposta |
|---|---|---|---|
| POST | `/conversations` | `{ scenarioId }` | `{ conversationId, scenario, firstAiMessage }` |
| POST | `/conversations/:id/messages` | `{ content }` | `{ aiReply, status }` |
| POST | `/conversations/:id/end` | — | `{ status: 'ended' }` |
| GET | `/conversations/:id` | — | `{ conversation, turns[] }` |

`POST /conversations` já pode disparar a primeira fala da IA (ex: o atendente cumprimenta o cliente), para o chat não começar vazio.

## Frontend: tela de Conversa

```
app/conversation/
  components/
    ChatMessageList.tsx     # UI pura: lista de turnos
    ChatInput.tsx            # UI pura: campo de texto + botão enviar
    EndConversationButton.tsx
  hooks/
    useConversation.ts       # estado da conversa atual, envia mensagem, chama end
  services/
    conversation.service.ts  # chamadas HTTP aos endpoints acima
```

`useConversation` orquestra: iniciar conversa ao montar a tela, enviar mensagem (otimista: mostra a mensagem do usuário antes da resposta da IA chegar), tratar fim de conversa (local ou forçado pelo limite retornado pela API).

## Critério de aceite (teste manual)

1. Abrir a tela de conversa → já aparece uma primeira fala da IA no papel de atendente da cafeteria.
2. Enviar algumas mensagens → respostas da IA condizem com o papel/cenário.
3. Clicar "Finalizar conversa" → UI indica que a conversa terminou; nenhuma nova mensagem pode ser enviada.
4. Enviar mensagens até o limite de segurança → conversa encerra automaticamente, sem erro.
5. Dados da conversa e dos turnos aparecem persistidos no arquivo SQLite.
