import { describe, expect, it } from 'vitest';
import { createDatabase } from '../../../../../src/db/connection.js';
import { SqliteConversationRepository } from '../../../../../src/modules/conversation/infrastructure/repositories/sqlite-conversation.repository.js';
import { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import { ConversationTurn } from '../../../../../src/modules/conversation/domain/entities/conversation-turn.js';

const languagePair = { target: 'en', native: 'pt' } as const;

describe('SqliteConversationRepository', () => {
  it('persists a conversation with its turns and reloads it identically', async () => {
    const db = createDatabase(':memory:');
    const repository = new SqliteConversationRepository(db);

    const conversation = new Conversation({
      id: 'conv-1',
      scenarioId: 'cafeteria',
      languagePair,
      status: 'active',
      turns: [],
      startedAt: new Date('2026-01-01T10:00:00.000Z'),
      endedAt: null,
    });
    conversation.addTurn(
      new ConversationTurn({ id: 't1', role: 'ai', content: 'Hi, welcome!', createdAt: new Date('2026-01-01T10:00:01.000Z') }),
    );

    await repository.save(conversation);
    conversation.addTurn(
      new ConversationTurn({ id: 't2', role: 'user', content: 'A coffee please', createdAt: new Date('2026-01-01T10:00:05.000Z') }),
    );
    await repository.save(conversation);

    const reloaded = await repository.findById('conv-1');
    expect(reloaded).not.toBeNull();
    expect(reloaded?.status).toBe('active');
    expect(reloaded?.languagePair).toEqual(languagePair);
    expect(reloaded?.turns).toHaveLength(2);
    expect(reloaded?.turns[0]?.content).toBe('Hi, welcome!');
    expect(reloaded?.turns[1]?.role).toBe('user');

    db.close();
  });

  it('returns null when the conversation does not exist', async () => {
    const db = createDatabase(':memory:');
    const repository = new SqliteConversationRepository(db);
    expect(await repository.findById('missing')).toBeNull();
    db.close();
  });

  it('persists ended status and endedAt', async () => {
    const db = createDatabase(':memory:');
    const repository = new SqliteConversationRepository(db);
    const conversation = new Conversation({
      id: 'conv-2',
      scenarioId: 'cafeteria',
      languagePair,
      status: 'active',
      turns: [],
      startedAt: new Date('2026-01-01T10:00:00.000Z'),
      endedAt: null,
    });
    await repository.save(conversation);
    conversation.end(new Date('2026-01-01T10:10:00.000Z'));
    await repository.save(conversation);

    const reloaded = await repository.findById('conv-2');
    expect(reloaded?.status).toBe('ended');
    expect(reloaded?.endedAt).toEqual(new Date('2026-01-01T10:10:00.000Z'));

    db.close();
  });
});
