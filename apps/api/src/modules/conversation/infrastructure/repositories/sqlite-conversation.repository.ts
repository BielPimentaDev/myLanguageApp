import type { DatabaseSync } from 'node:sqlite';
import { Conversation, type ConversationStatus } from '../../domain/entities/conversation.js';
import { ConversationTurn, type ConversationTurnRole } from '../../domain/entities/conversation-turn.js';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.js';
import type { Language } from '../../domain/value-objects/language-pair.js';

interface ConversationRow {
  id: string;
  scenario_id: string;
  target_language: Language;
  native_language: Language;
  status: ConversationStatus;
  started_at: string;
  ended_at: string | null;
}

interface ConversationTurnRow {
  id: string;
  conversation_id: string;
  role: ConversationTurnRole;
  content: string;
  created_at: string;
}

export class SqliteConversationRepository implements ConversationRepository {
  constructor(private readonly db: DatabaseSync) {}

  async save(conversation: Conversation): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO conversations (id, scenario_id, target_language, native_language, status, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, ended_at = excluded.ended_at`,
      )
      .run(
        conversation.id,
        conversation.scenarioId,
        conversation.languagePair.target,
        conversation.languagePair.native,
        conversation.status,
        conversation.startedAt.toISOString(),
        conversation.endedAt ? conversation.endedAt.toISOString() : null,
      );

    const insertTurn = this.db.prepare(
      `INSERT OR IGNORE INTO conversation_turns (id, conversation_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const turn of conversation.turns) {
      insertTurn.run(turn.id, conversation.id, turn.role, turn.content, turn.createdAt.toISOString());
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConversationRow | undefined;
    if (!row) {
      return null;
    }

    const turnRows = this.db
      .prepare('SELECT * FROM conversation_turns WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC')
      .all(id) as unknown as ConversationTurnRow[];

    const turns = turnRows.map(
      (turnRow) =>
        new ConversationTurn({
          id: turnRow.id,
          role: turnRow.role,
          content: turnRow.content,
          createdAt: new Date(turnRow.created_at),
        }),
    );

    return new Conversation({
      id: row.id,
      scenarioId: row.scenario_id,
      languagePair: { target: row.target_language, native: row.native_language },
      status: row.status,
      turns,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
    });
  }
}
