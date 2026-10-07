import type { Conversation } from '../../domain/entities/conversation.js';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found-error.js';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.js';

export interface GetConversationDeps {
  conversationRepository: ConversationRepository;
}

export interface GetConversationInput {
  conversationId: string;
}

export interface GetConversationOutput {
  conversation: Conversation;
}

export class GetConversationUseCase {
  constructor(private readonly deps: GetConversationDeps) {}

  async execute(input: GetConversationInput): Promise<GetConversationOutput> {
    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    return { conversation };
  }
}
