'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { conversationService, type ConversationService } from '../services/conversation.service';

export type ChatMessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
}

export type ConversationUiStatus = 'starting' | 'active' | 'ending' | 'ended' | 'error';

export interface UseConversationOptions {
  scenarioId: string;
  service?: ConversationService;
}

export interface UseConversationResult {
  status: ConversationUiStatus;
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  end: () => Promise<void>;
}

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

export function useConversation({ scenarioId, service = conversationService }: UseConversationOptions): UseConversationResult {
  const [status, setStatus] = useState<ConversationUiStatus>('starting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const result = await service.start(scenarioId);
        if (cancelled) return;
        conversationIdRef.current = result.conversationId;
        setMessages([{ id: nextMessageId(), role: 'ai', content: result.firstAiMessage }]);
        setStatus('active');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to start conversation');
        setStatus('error');
      }
    }

    void start();

    return () => {
      cancelled = true;
    };
  }, [scenarioId, service]);

  const sendMessage = useCallback(
    async (content: string) => {
      const conversationId = conversationIdRef.current;
      if (status !== 'active' || !conversationId) {
        return;
      }

      setMessages((current) => [...current, { id: nextMessageId(), role: 'user', content }]);
      setIsSending(true);
      setError(null);

      try {
        const result = await service.sendMessage(conversationId, content);
        if (result.aiReply) {
          setMessages((current) => [...current, { id: nextMessageId(), role: 'ai', content: result.aiReply as string }]);
        }
        setStatus(result.status === 'ended' ? 'ended' : 'active');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [service, status],
  );

  const end = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (status !== 'active' || !conversationId) {
      return;
    }

    setStatus('ending');
    try {
      await service.end(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end conversation');
    } finally {
      setStatus('ended');
    }
  }, [service, status]);

  return { status, messages, isSending, error, sendMessage, end };
}
