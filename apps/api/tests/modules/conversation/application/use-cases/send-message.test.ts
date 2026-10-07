import { describe, expect, it } from 'vitest';
import { SendMessageUseCase } from '../../../../../src/modules/conversation/application/use-cases/send-message.js';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationNotFoundError } from '../../../../../src/modules/conversation/domain/errors/conversation-not-found-error.js';
import { ConversationAlreadyEndedError } from '../../../../../src/modules/conversation/domain/errors/conversation-already-ended-error.js';
import { FakeConversationAI, InMemoryConversationRepository, fakeIdGenerator } from './test-fakes.js';

const languagePair = { target: 'en', native: 'pt' } as const;

function buildConversation(overrides: Partial<ConstructorParameters<typeof Conversation>[0]> = {}) {
  return new Conversation({
    id: 'conv-1',
    scenarioId: 'cafeteria',
    languagePair,
    status: 'active',
    turns: [],
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: null,
    ...overrides,
  });
}

function buildUseCase(ai: FakeConversationAI, repository: InMemoryConversationRepository) {
  return new SendMessageUseCase({
    conversationRepository: repository,
    conversationAI: ai,
    generateId: fakeIdGenerator('turn'),
    now: () => new Date('2026-01-01T10:05:00Z'),
  });
}

describe('SendMessageUseCase', () => {
  it('adds the user turn, calls the AI port and persists the AI reply', async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = buildConversation();
    await repository.save(conversation);
    const ai = new FakeConversationAI(['One flat white coming up!']);
    const useCase = buildUseCase(ai, repository);

    const result = await useCase.execute({ conversationId: conversation.id, content: 'A flat white, please' });

    expect(result.aiReply).toBe('One flat white coming up!');
    expect(result.status).toBe('active');
    expect(ai.calls[0]?.userMessage).toBe('A flat white, please');

    const saved = await repository.findById(conversation.id);
    expect(saved?.turns).toHaveLength(2);
    expect(saved?.turns[0]?.role).toBe('user');
    expect(saved?.turns[1]?.role).toBe('ai');
  });

  it('throws ConversationNotFoundError when the conversation does not exist', async () => {
    const repository = new InMemoryConversationRepository();
    const ai = new FakeConversationAI(['irrelevant']);
    const useCase = buildUseCase(ai, repository);

    await expect(useCase.execute({ conversationId: 'missing', content: 'hi' })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });

  it('throws ConversationAlreadyEndedError and never calls the AI port when the conversation already ended', async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = buildConversation({ status: 'ended', endedAt: new Date() });
    await repository.save(conversation);
    const ai = new FakeConversationAI(['irrelevant']);
    const useCase = buildUseCase(ai, repository);

    await expect(useCase.execute({ conversationId: conversation.id, content: 'hi' })).rejects.toThrow(
      ConversationAlreadyEndedError,
    );
    expect(ai.calls).toHaveLength(0);
  });

  it('auto-ends the conversation once the exchange limit is reached, returning status ended', async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = buildConversation({ maxExchanges: 1 });
    await repository.save(conversation);
    const ai = new FakeConversationAI(['Last reply before closing']);
    const useCase = buildUseCase(ai, repository);

    const result = await useCase.execute({ conversationId: conversation.id, content: 'final message' });

    expect(result.status).toBe('ended');
    expect(result.aiReply).toBe('Last reply before closing');

    const saved = await repository.findById(conversation.id);
    expect(saved?.status).toBe('ended');
  });
});
