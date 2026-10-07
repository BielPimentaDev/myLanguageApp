import type { Conversation } from '../entities/conversation.js';

export interface ConversationAIPort {
  generateReply(conversation: Conversation, userMessage: string): Promise<string>;
}
