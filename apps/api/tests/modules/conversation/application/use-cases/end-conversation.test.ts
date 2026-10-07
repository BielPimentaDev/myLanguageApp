import { describe, expect, it } from 'vitest';
import { EndConversationUseCase } from '../../../../../src/modules/conversation/application/use-cases/end-conversation.js';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationNotFoundError } from '../../../../../src/modules/conversation/domain/errors/conversation-not-found-error.js';
import { InMemoryConversationRepository } from './test-fakes.js';

const languagePair = { target: 'en', native: 'pt' } as const;

function buildUseCase(repository: InMemoryConversationRepository) {
  return new EndConversationUseCase({
    conversationRepository: repository,
    now: () => new Date('2026-01-01T11:00:00Z'),
  });
}

describe('EndConversationUseCase', () => {
  it('ends an active conversation and persists it', async () => {
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

    const result = await buildUseCase(repository).execute({ conversationId: conversation.id });

    expect(result.status).toBe('ended');
    const saved = await repository.findById(conversation.id);
    expect(saved?.status).toBe('ended');
    expect(saved?.endedAt).toEqual(new Date('2026-01-01T11:00:00Z'));
  });

  it('throws ConversationNotFoundError when the conversation does not exist', async () => {
    const repository = new InMemoryConversationRepository();
    await expect(buildUseCase(repository).execute({ conversationId: 'missing' })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });
});
