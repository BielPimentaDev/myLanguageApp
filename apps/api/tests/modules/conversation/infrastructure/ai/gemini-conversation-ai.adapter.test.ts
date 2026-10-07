import { describe, expect, it } from 'vitest';
import { GeminiConversationAIAdapter } from '../../../../../src/modules/conversation/infrastructure/ai/gemini-conversation-ai.adapter.js';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationTurn } from '../../../../../src/modules/conversation/domain/entities/conversation-turn.js';
import { ScenarioNotFoundError } from '../../../../../src/modules/conversation/domain/errors/scenario-not-found-error.js';
import { FakeScenarioCatalog } from '../../application/use-cases/test-fakes.js';

const languagePair = { target: 'en', native: 'pt' } as const;

const scenarioCatalog = new FakeScenarioCatalog([
  { id: 'cafeteria', name: 'Cafeteria', systemPrompt: 'You are a barista.', goalDescription: 'Order a coffee' },
]);

function buildConversation(scenarioId = 'cafeteria'): Conversation {
  return new Conversation({
    id: 'conv-1',
    scenarioId,
    languagePair,
    status: 'active',
    turns: [],
    startedAt: new Date('2026-01-01T10:00:00.000Z'),
    endedAt: null,
  });
}

interface RecordedRequest {
  url: string;
  init: RequestInit;
}

function fakeFetch(response: Response): { fetch: typeof fetch; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init: init ?? {} });
    return response;
  }) as typeof fetch;
  return { fetch: fetchFn, requests };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('GeminiConversationAIAdapter', () => {
  it('sends the scenario prompt and conversation turns to the chat completions endpoint', async () => {
    const { fetch, requests } = fakeFetch(jsonResponse({ choices: [{ message: { content: 'Sure, one latte!' } }] }));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: 'test-key', model: 'gemini-test', fetch });

    const conversation = buildConversation();
    conversation.addTurn(new ConversationTurn({ id: 't1', role: 'ai', content: 'Hi! What can I get you?', createdAt: new Date() }));
    conversation.addTurn(new ConversationTurn({ id: 't2', role: 'user', content: 'A latte, please', createdAt: new Date() }));

    const reply = await adapter.generateReply(conversation, 'A latte, please');

    expect(reply).toBe('Sure, one latte!');
    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request?.url).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    expect(request?.init.method).toBe('POST');
    expect((request?.init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const body = JSON.parse(String(request?.init.body)) as { model: string; messages: Array<{ role: string; content: string }> };
    expect(body.model).toBe('gemini-test');
    expect(body.messages[0]?.role).toBe('system');
    expect(body.messages[0]?.content).toContain('You are a barista.');
    expect(body.messages.slice(1)).toEqual([
      { role: 'assistant', content: 'Hi! What can I get you?' },
      { role: 'user', content: 'A latte, please' },
    ]);
  });

  it('sends the opening instruction when the conversation has no turns yet', async () => {
    const { fetch, requests } = fakeFetch(jsonResponse({ choices: [{ message: { content: 'Welcome!' } }] }));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: 'k', model: 'm', fetch });

    await adapter.generateReply(buildConversation(), '');

    const body = JSON.parse(String(requests[0]?.init.body)) as { messages: Array<{ role: string; content: string }> };
    expect(body.messages).toHaveLength(2);
    expect(body.messages[1]?.role).toBe('user');
    expect(body.messages[1]?.content).toContain('[Scene start]');
  });

  it('uses a custom base URL when provided', async () => {
    const { fetch, requests } = fakeFetch(jsonResponse({ choices: [{ message: { content: 'ok' } }] }));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, {
      apiKey: 'k',
      model: 'm',
      baseUrl: 'http://localhost:9999/v1/',
      fetch,
    });

    await adapter.generateReply(buildConversation(), '');

    expect(requests[0]?.url).toBe('http://localhost:9999/v1/chat/completions');
  });

  it('throws ScenarioNotFoundError without calling the API when the scenario does not exist', async () => {
    const { fetch, requests } = fakeFetch(jsonResponse({}));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: 'k', model: 'm', fetch });

    await expect(adapter.generateReply(buildConversation('unknown'), '')).rejects.toBeInstanceOf(ScenarioNotFoundError);
    expect(requests).toHaveLength(0);
  });

  it('throws with the status code when the API responds with an error', async () => {
    const { fetch } = fakeFetch(jsonResponse({ error: { message: 'quota exceeded' } }, 429));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: 'k', model: 'm', fetch });

    await expect(adapter.generateReply(buildConversation(), '')).rejects.toThrow(/status 429.*quota exceeded/);
  });

  it('throws when the response has no text reply', async () => {
    const { fetch } = fakeFetch(jsonResponse({ choices: [] }));
    const adapter = new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: 'k', model: 'm', fetch });

    await expect(adapter.generateReply(buildConversation(), '')).rejects.toThrow('did not contain a text reply');
  });
});
