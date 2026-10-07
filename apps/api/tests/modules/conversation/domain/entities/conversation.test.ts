import { describe, expect, it } from 'vitest';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationTurn } from '../../../../../src/modules/conversation/domain/entities/conversation-turn.js';
import { ConversationAlreadyEndedError } from '../../../../../src/modules/conversation/domain/errors/conversation-already-ended-error.js';

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

function userTurn(id: string, content = 'hello') {
  return new ConversationTurn({ id, role: 'user', content, createdAt: new Date() });
}

function aiTurn(id: string, content = 'hi there') {
  return new ConversationTurn({ id, role: 'ai', content, createdAt: new Date() });
}

describe('Conversation', () => {
  it('starts active with no turns', () => {
    const conversation = buildConversation();
    expect(conversation.status).toBe('active');
    expect(conversation.turns).toHaveLength(0);
  });

  it('accepts a new turn while active', () => {
    const conversation = buildConversation();
    conversation.addTurn(aiTurn('t1', 'welcome'));
    expect(conversation.turns).toHaveLength(1);
    expect(conversation.turns[0]?.content).toBe('welcome');
  });

  it('throws ConversationAlreadyEndedError when adding a turn to an ended conversation', () => {
    const conversation = buildConversation({ status: 'ended', endedAt: new Date() });
    expect(() => conversation.addTurn(userTurn('t1'))).toThrow(ConversationAlreadyEndedError);
  });

  it('throws ConversationAlreadyEndedError when calling end() twice', () => {
    const conversation = buildConversation();
    conversation.end(new Date());
    expect(() => conversation.end(new Date())).toThrow(ConversationAlreadyEndedError);
  });

  it('sets status to ended and records endedAt when end() is called', () => {
    const conversation = buildConversation();
    const now = new Date('2026-01-01T10:05:00Z');
    conversation.end(now);
    expect(conversation.status).toBe('ended');
    expect(conversation.endedAt).toEqual(now);
  });

  it('auto-ends once the configured exchange limit is reached after an AI turn', () => {
    const conversation = buildConversation({ maxExchanges: 2 });
    conversation.addTurn(userTurn('u1'));
    conversation.addTurn(aiTurn('a1'));
    expect(conversation.status).toBe('active');

    conversation.addTurn(userTurn('u2'));
    expect(conversation.status).toBe('active');

    const now = new Date('2026-01-01T10:10:00Z');
    conversation.addTurn(aiTurn('a2'), now);
    expect(conversation.status).toBe('ended');
    expect(conversation.endedAt).toEqual(now);
  });

  it('does not auto-end on the user turn that reaches the limit, only after the AI reply', () => {
    const conversation = buildConversation({ maxExchanges: 1 });
    conversation.addTurn(userTurn('u1'));
    expect(conversation.status).toBe('active');
  });

  it('exposes a defensive copy of turns', () => {
    const conversation = buildConversation();
    conversation.addTurn(aiTurn('t1'));
    const turns = conversation.turns;
    turns.push(userTurn('intruder'));
    expect(conversation.turns).toHaveLength(1);
  });
});
