import type { Conversation } from '../entities/conversation.js';

export interface ConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
}
