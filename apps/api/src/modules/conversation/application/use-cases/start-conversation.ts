import { Conversation } from '../../domain/entities/conversation.js';
import { ConversationTurn } from '../../domain/entities/conversation-turn.js';
import type { Scenario } from '../../domain/entities/scenario.js';
import { ScenarioNotFoundError } from '../../domain/errors/scenario-not-found-error.js';
import type { ConversationAIPort } from '../../domain/ports/conversation-ai.port.js';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.js';
import type { ScenarioCatalog } from '../../domain/ports/scenario-catalog.js';
import type { LanguagePair } from '../../domain/value-objects/language-pair.js';

export interface StartConversationDeps {
  scenarioCatalog: ScenarioCatalog;
  conversationRepository: ConversationRepository;
  conversationAI: ConversationAIPort;
  languagePair: LanguagePair;
  generateId: () => string;
  now: () => Date;
}

export interface StartConversationInput {
  scenarioId: string;
}

export interface StartConversationOutput {
  conversation: Conversation;
  scenario: Scenario;
  firstAiMessage: string;
}

export class StartConversationUseCase {
  constructor(private readonly deps: StartConversationDeps) {}

  async execute(input: StartConversationInput): Promise<StartConversationOutput> {
    const scenario = this.deps.scenarioCatalog.findById(input.scenarioId);
    if (!scenario) {
      throw new ScenarioNotFoundError(input.scenarioId);
    }

    const conversation = new Conversation({
      id: this.deps.generateId(),
      scenarioId: scenario.id,
      languagePair: this.deps.languagePair,
      status: 'active',
      turns: [],
      startedAt: this.deps.now(),
      endedAt: null,
    });

    const firstAiMessage = await this.deps.conversationAI.generateReply(conversation, '');
    conversation.addTurn(
      new ConversationTurn({
        id: this.deps.generateId(),
        role: 'ai',
        content: firstAiMessage,
        createdAt: this.deps.now(),
      }),
      this.deps.now(),
    );

    await this.deps.conversationRepository.save(conversation);

    return { conversation, scenario, firstAiMessage };
  }
}
