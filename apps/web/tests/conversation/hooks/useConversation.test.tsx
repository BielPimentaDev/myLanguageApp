import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversation } from '../../../app/conversation/hooks/useConversation';
import type { ConversationService } from '../../../app/conversation/services/conversation.service';

function buildFakeService(overrides: Partial<ConversationService> = {}) {
  return {
    start: vi.fn().mockResolvedValue({
      conversationId: 'conv-1',
      scenario: { id: 'cafeteria', name: 'Cafeteria', goalDescription: 'Order a drink' },
      firstAiMessage: 'Hi, welcome!',
    }),
    sendMessage: vi.fn().mockResolvedValue({ aiReply: 'Sure, anything else?', status: 'active' }),
    end: vi.fn().mockResolvedValue({ status: 'ended' }),
    ...overrides,
  } as unknown as ConversationService;
}

describe('useConversation', () => {
  it('starts a conversation on mount and exposes the first AI message', async () => {
    const service = buildFakeService();
    const { result } = renderHook(() => useConversation({ scenarioId: 'cafeteria', service }));

    expect(result.current.status).toBe('starting');

    await waitFor(() => expect(result.current.status).toBe('active'));

    expect(service.start).toHaveBeenCalledWith('cafeteria');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ role: 'ai', content: 'Hi, welcome!' });
  });

  it('optimistically shows the user message before the AI reply arrives', async () => {
    let resolveSendMessage: (value: { aiReply: string; status: 'active' }) => void = () => {};
    const service = buildFakeService({
      sendMessage: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveSendMessage = resolve;
          }),
      ),
    });
    const { result } = renderHook(() => useConversation({ scenarioId: 'cafeteria', service }));
    await waitFor(() => expect(result.current.status).toBe('active'));

    act(() => {
      void result.current.sendMessage('A flat white please');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({ role: 'user', content: 'A flat white please' });
    expect(result.current.isSending).toBe(true);

    await act(async () => {
      resolveSendMessage({ aiReply: 'One flat white coming up!', status: 'active' });
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toMatchObject({ role: 'ai', content: 'One flat white coming up!' });
    expect(result.current.isSending).toBe(false);
    expect(result.current.status).toBe('active');
  });

  it('transitions to ended when the API reports the exchange limit was reached', async () => {
    const service = buildFakeService({
      sendMessage: vi.fn().mockResolvedValue({ aiReply: 'See you next time!', status: 'ended' }),
    });
    const { result } = renderHook(() => useConversation({ scenarioId: 'cafeteria', service }));
    await waitFor(() => expect(result.current.status).toBe('active'));

    await act(async () => {
      await result.current.sendMessage('last message');
    });

    expect(result.current.status).toBe('ended');
  });

  it('ends the conversation when end() is called', async () => {
    const service = buildFakeService();
    const { result } = renderHook(() => useConversation({ scenarioId: 'cafeteria', service }));
    await waitFor(() => expect(result.current.status).toBe('active'));

    await act(async () => {
      await result.current.end();
    });

    expect(service.end).toHaveBeenCalledWith('conv-1');
    expect(result.current.status).toBe('ended');
  });

  it('does not send a message when the conversation has already ended', async () => {
    const service = buildFakeService();
    const { result } = renderHook(() => useConversation({ scenarioId: 'cafeteria', service }));
    await waitFor(() => expect(result.current.status).toBe('active'));

    await act(async () => {
      await result.current.end();
    });

    await act(async () => {
      await result.current.sendMessage('should be ignored');
    });

    expect(service.sendMessage).not.toHaveBeenCalled();
  });
});
