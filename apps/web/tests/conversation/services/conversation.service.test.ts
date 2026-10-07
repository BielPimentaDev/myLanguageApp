import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationService, ConversationServiceError } from '../../../app/conversation/services/conversation.service';

const API_BASE_URL = 'http://localhost:3001';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('ConversationService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts a conversation by posting the scenarioId', async () => {
    const response = {
      conversationId: 'conv-1',
      scenario: { id: 'cafeteria', name: 'Cafeteria', goalDescription: 'Order a drink' },
      firstAiMessage: 'Hi, welcome!',
    };
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(response));

    const service = new ConversationService(API_BASE_URL);
    const result = await service.start('cafeteria');

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/conversations`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ scenarioId: 'cafeteria' }),
      }),
    );
    expect(result).toEqual(response);
  });

  it('sends a message to an existing conversation', async () => {
    const response = { aiReply: 'One flat white coming up!', status: 'active' };
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(response));

    const service = new ConversationService(API_BASE_URL);
    const result = await service.sendMessage('conv-1', 'A flat white please');

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/conversations/conv-1/messages`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'A flat white please' }),
      }),
    );
    expect(result).toEqual(response);
  });

  it('ends a conversation', async () => {
    const response = { status: 'ended' };
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(response));

    const service = new ConversationService(API_BASE_URL);
    const result = await service.end('conv-1');

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/conversations/conv-1/end`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(response);
  });

  it('throws a ConversationServiceError with the backend message when the response is not ok', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ message: 'Conversation conv-1 has already ended' }, false, 409),
    );

    const service = new ConversationService(API_BASE_URL);

    await expect(service.sendMessage('conv-1', 'hi')).rejects.toThrow(ConversationServiceError);
    await expect(service.sendMessage('conv-1', 'hi')).rejects.toThrow('Conversation conv-1 has already ended');
  });
});
