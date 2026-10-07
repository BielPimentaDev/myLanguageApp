import { describe, expect, it } from 'vitest';
import { GetConversationUseCase } from '../../../../../src/modules/conversation/application/use-cases/get-conversation.js';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationNotFoundError } from '../../../../../src/modules/conversation/domain/errors/conversation-not-found-error.js';
import { InMemoryConversationRepository } from './test-fakes.js';

const languagePair = { target: 'en', native: 'pt' } as const;

describe('GetConversationUseCase', () => {
  it('returns the conversation when it exists', async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = new Conversation({
      id: 'conv-1',
      scenarioId: 'cafeteria',
      languagePair,
      status: 'active',
      turns: [],
      startedAt: new Date('2026-01-01T10:00:00Z'),
      endedAt: null,
    });
    await repository.save(conversation);

    const useCase = new GetConversationUseCase({ conversationRepository: repository });
    const result = await useCase.execute({ conversationId: conversation.id });

    expect(result.conversation.id).toBe(conversation.id);
  });

  it('throws ConversationNotFoundError when the conversation does not exist', async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = new GetConversationUseCase({ conversationRepository: repository });

    await expect(useCase.execute({ conversationId: 'missing' })).rejects.toThrow(ConversationNotFoundError);
  });
});
