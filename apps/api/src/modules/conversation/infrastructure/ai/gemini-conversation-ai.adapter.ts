import type { Conversation } from '../../domain/entities/conversation.js';
import { ScenarioNotFoundError } from '../../domain/errors/scenario-not-found-error.js';
import type { ConversationAIPort } from '../../domain/ports/conversation-ai.port.js';
import type { ScenarioCatalog } from '../../domain/ports/scenario-catalog.js';
import { buildChatMessages, buildTutorSystemPrompt } from './tutor-prompt.js';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const MAX_REPLY_TOKENS = 400;

export interface GeminiConversationAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * Talks to Gemini through Google's OpenAI-compatible Chat Completions endpoint.
 */
export class GeminiConversationAIAdapter implements ConversationAIPort {
  private readonly baseUrl: string;
  private readonly fetch: typeof fetch;

  constructor(
    private readonly scenarioCatalog: ScenarioCatalog,
    private readonly config: GeminiConversationAIConfig,
  ) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetch = config.fetch ?? globalThis.fetch;
  }

  async generateReply(conversation: Conversation, userMessage: string): Promise<string> {
    const scenario = this.scenarioCatalog.findById(conversation.scenarioId);
    if (!scenario) {
      throw new ScenarioNotFoundError(conversation.scenarioId);
    }

    const response = await this.fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: MAX_REPLY_TOKENS,
        messages: [
          { role: 'system', content: buildTutorSystemPrompt(scenario.systemPrompt, conversation.languagePair) },
          ...buildChatMessages(conversation, userMessage),
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Gemini request failed with status ${response.status}: ${details.slice(0, 500)}`);
    }

    const body = (await response.json()) as ChatCompletionResponse;
    const text = body.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Gemini response did not contain a text reply');
    }
    return text;
  }
}
