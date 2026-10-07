import type { ConversationStatus } from '../../domain/entities/conversation.js';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found-error.js';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.js';

export interface EndConversationDeps {
  conversationRepository: ConversationRepository;
  now: () => Date;
}

export interface EndConversationInput {
  conversationId: string;
}

export interface EndConversationOutput {
  status: ConversationStatus;
}

export class EndConversationUseCase {
  constructor(private readonly deps: EndConversationDeps) {}

  async execute(input: EndConversationInput): Promise<EndConversationOutput> {
    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    conversation.end(this.deps.now());
    await this.deps.conversationRepository.save(conversation);

    return { status: conversation.status };
  }
}
