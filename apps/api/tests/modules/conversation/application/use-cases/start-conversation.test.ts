import { describe, expect, it } from 'vitest';
import { StartConversationUseCase } from '../../../../../src/modules/conversation/application/use-cases/start-conversation.js';
import { ScenarioNotFoundError } from '../../../../../src/modules/conversation/domain/errors/scenario-not-found-error.js';
import {
  FakeConversationAI,
  FakeScenarioCatalog,
  InMemoryConversationRepository,
  fakeIdGenerator,
} from './test-fakes.js';

const scenario = {
  id: 'cafeteria',
  name: 'Cafeteria',
  goalDescription: 'Order a drink',
  systemPrompt: 'You are a barista.',
};

const languagePair = { target: 'en', native: 'pt' } as const;

function buildUseCase(overrides: { ai?: FakeConversationAI; repository?: InMemoryConversationRepository } = {}) {
  const repository = overrides.repository ?? new InMemoryConversationRepository();
  const ai = overrides.ai ?? new FakeConversationAI(['Hi, welcome! What can I get you?']);
  const useCase = new StartConversationUseCase({
    scenarioCatalog: new FakeScenarioCatalog([scenario]),
    conversationRepository: repository,
    conversationAI: ai,
    languagePair,
    generateId: fakeIdGenerator('conv'),
    now: () => new Date('2026-01-01T10:00:00Z'),
  });
  return { useCase, repository, ai };
}

describe('StartConversationUseCase', () => {
  it('creates an active conversation with the first AI turn', async () => {
    const { useCase, repository } = buildUseCase();
    const result = await useCase.execute({ scenarioId: 'cafeteria' });

    expect(result.firstAiMessage).toBe('Hi, welcome! What can I get you?');
    expect(result.conversation.status).toBe('active');
    expect(result.conversation.turns).toHaveLength(1);
    expect(result.conversation.turns[0]?.role).toBe('ai');
    expect(result.conversation.languagePair).toEqual(languagePair);
    expect(result.scenario.id).toBe('cafeteria');

    const saved = await repository.findById(result.conversation.id);
    expect(saved).not.toBeNull();
    expect(saved?.turns).toHaveLength(1);
  });

  it('calls the AI port with an empty user message to produce the opening line', async () => {
    const { useCase, ai } = buildUseCase();
    await useCase.execute({ scenarioId: 'cafeteria' });
    expect(ai.calls).toHaveLength(1);
    expect(ai.calls[0]?.userMessage).toBe('');
  });

  it('throws ScenarioNotFoundError for an unknown scenario', async () => {
    const { useCase } = buildUseCase();
    await expect(useCase.execute({ scenarioId: 'unknown' })).rejects.toThrow(ScenarioNotFoundError);
  });
});
