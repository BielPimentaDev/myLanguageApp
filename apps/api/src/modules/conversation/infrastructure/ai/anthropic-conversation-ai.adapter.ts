import Anthropic from '@anthropic-ai/sdk';
import type { Conversation } from '../../domain/entities/conversation.js';
import { ScenarioNotFoundError } from '../../domain/errors/scenario-not-found-error.js';
import type { ConversationAIPort } from '../../domain/ports/conversation-ai.port.js';
import type { ScenarioCatalog } from '../../domain/ports/scenario-catalog.js';
import { buildChatMessages, buildTutorSystemPrompt } from './tutor-prompt.js';

const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_REPLY_TOKENS = 400;

export class AnthropicConversationAIAdapter implements ConversationAIPort {
  constructor(
    private readonly client: Anthropic,
    private readonly scenarioCatalog: ScenarioCatalog,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generateReply(conversation: Conversation, userMessage: string): Promise<string> {
    const scenario = this.scenarioCatalog.findById(conversation.scenarioId);
    if (!scenario) {
      throw new ScenarioNotFoundError(conversation.scenarioId);
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_REPLY_TOKENS,
      system: buildTutorSystemPrompt(scenario.systemPrompt, conversation.languagePair),
      messages: buildChatMessages(conversation, userMessage),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic response did not contain a text block');
    }
    return textBlock.text;
  }
}
