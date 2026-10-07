import type { Conversation } from '../../../../../src/modules/conversation/domain/entities/conversation.js';
import type { ConversationAIPort } from '../../../../../src/modules/conversation/domain/ports/conversation-ai.port.js';
import type { ConversationRepository } from '../../../../../src/modules/conversation/domain/ports/conversation-repository.js';
import type { Scenario } from '../../../../../src/modules/conversation/domain/entities/scenario.js';
import type { ScenarioCatalog } from '../../../../../src/modules/conversation/domain/ports/scenario-catalog.js';

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly conversations = new Map<string, Conversation>();

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }
}

export class FakeConversationAI implements ConversationAIPort {
  calls: Array<{ conversation: Conversation; userMessage: string }> = [];

  constructor(private readonly replies: string[]) {}

  async generateReply(conversation: Conversation, userMessage: string): Promise<string> {
    this.calls.push({ conversation, userMessage });
    const reply = this.replies[this.calls.length - 1] ?? this.replies[this.replies.length - 1];
    if (reply === undefined) {
      throw new Error('FakeConversationAI has no reply configured');
    }
    return reply;
  }
}

export class FakeScenarioCatalog implements ScenarioCatalog {
  constructor(private readonly scenarios: Scenario[]) {}

  findById(id: string): Scenario | null {
    return this.scenarios.find((scenario) => scenario.id === id) ?? null;
  }

  listAll(): Scenario[] {
    return [...this.scenarios];
  }
}

export function fakeIdGenerator(prefix = 'id'): () => string {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}
