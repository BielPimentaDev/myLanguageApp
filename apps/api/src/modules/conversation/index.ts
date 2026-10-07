import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { StaticScenarioCatalog } from './domain/scenario-catalog/static-scenario-catalog.js';
import type { LanguagePair } from './domain/value-objects/language-pair.js';
import type { ConversationAIPort } from './domain/ports/conversation-ai.port.js';
import type { ScenarioCatalog } from './domain/ports/scenario-catalog.js';
import { StartConversationUseCase } from './application/use-cases/start-conversation.js';
import { SendMessageUseCase } from './application/use-cases/send-message.js';
import { EndConversationUseCase } from './application/use-cases/end-conversation.js';
import { GetConversationUseCase } from './application/use-cases/get-conversation.js';
import { SqliteConversationRepository } from './infrastructure/repositories/sqlite-conversation.repository.js';
import { registerConversationRoutes } from './infrastructure/http/conversation.routes.js';

export type { ConversationStatus } from './domain/entities/conversation.js';
export type { Scenario } from './domain/entities/scenario.js';
export type { LanguagePair, Language } from './domain/value-objects/language-pair.js';
export type { ConversationAIPort } from './domain/ports/conversation-ai.port.js';
export type { ScenarioCatalog } from './domain/ports/scenario-catalog.js';
export { AnthropicConversationAIAdapter } from './infrastructure/ai/anthropic-conversation-ai.adapter.js';
export { GeminiConversationAIAdapter } from './infrastructure/ai/gemini-conversation-ai.adapter.js';
export type { GeminiConversationAIConfig } from './infrastructure/ai/gemini-conversation-ai.adapter.js';
export { ConversationAlreadyEndedError } from './domain/errors/conversation-already-ended-error.js';
export { ConversationNotFoundError } from './domain/errors/conversation-not-found-error.js';
export { ScenarioNotFoundError } from './domain/errors/scenario-not-found-error.js';
export { StartConversationUseCase } from './application/use-cases/start-conversation.js';
export { SendMessageUseCase } from './application/use-cases/send-message.js';
export { EndConversationUseCase } from './application/use-cases/end-conversation.js';
export { GetConversationUseCase } from './application/use-cases/get-conversation.js';

/**
 * Builds the ConversationAIPort adapter. Receives the module's scenario catalog because
 * adapters need each scenario's system prompt to talk to the model.
 */
export type ConversationAIFactory = (scenarioCatalog: ScenarioCatalog) => ConversationAIPort;

export interface ConversationModuleDeps {
  db: DatabaseSync;
  languagePair: LanguagePair;
  createConversationAI: ConversationAIFactory;
}

export interface ConversationModule {
  registerRoutes(app: FastifyInstance): Promise<void>;
}

export function createConversationModule(deps: ConversationModuleDeps): ConversationModule {
  const scenarioCatalog = new StaticScenarioCatalog();
  const conversationRepository = new SqliteConversationRepository(deps.db);
  const conversationAI = deps.createConversationAI(scenarioCatalog);

  const generateId = () => randomUUID();
  const now = () => new Date();

  const startConversation = new StartConversationUseCase({
    scenarioCatalog,
    conversationRepository,
    conversationAI,
    languagePair: deps.languagePair,
    generateId,
    now,
  });
  const sendMessage = new SendMessageUseCase({ conversationRepository, conversationAI, generateId, now });
  const endConversation = new EndConversationUseCase({ conversationRepository, now });
  const getConversation = new GetConversationUseCase({ conversationRepository });

  return {
    async registerRoutes(app: FastifyInstance) {
      await registerConversationRoutes(app, { startConversation, sendMessage, endConversation, getConversation });
    },
  };
}
