import type { ConversationStatus } from '../../domain/entities/conversation.js';
import { ConversationTurn } from '../../domain/entities/conversation-turn.js';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found-error.js';
import type { ConversationAIPort } from '../../domain/ports/conversation-ai.port.js';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.js';

export interface SendMessageDeps {
  conversationRepository: ConversationRepository;
  conversationAI: ConversationAIPort;
  generateId: () => string;
  now: () => Date;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export interface SendMessageOutput {
  aiReply: string | null;
  status: ConversationStatus;
}

export class SendMessageUseCase {
  constructor(private readonly deps: SendMessageDeps) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    conversation.addTurn(
      new ConversationTurn({
        id: this.deps.generateId(),
        role: 'user',
        content: input.content,
        createdAt: this.deps.now(),
      }),
      this.deps.now(),
    );

    let aiReply: string | null = null;
    if (conversation.status === 'active') {
      aiReply = await this.deps.conversationAI.generateReply(conversation, input.content);
      conversation.addTurn(
        new ConversationTurn({
          id: this.deps.generateId(),
          role: 'ai',
          content: aiReply,
          createdAt: this.deps.now(),
        }),
        this.deps.now(),
      );
    }

    await this.deps.conversationRepository.save(conversation);

    return { aiReply, status: conversation.status };
  }
}
