import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createDatabase } from './db/connection.js';
import { createConversationModule } from './modules/conversation/index.js';
import type { ConversationAIFactory, LanguagePair } from './modules/conversation/index.js';

const DEFAULT_LANGUAGE_PAIR: LanguagePair = { target: 'en', native: 'pt' };

export interface BuildAppOptions {
  createConversationAI: ConversationAIFactory;
  databasePath?: string;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const databasePath = options.databasePath ?? process.env.DATABASE_PATH ?? './data/app.db';

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  const db = createDatabase(databasePath);
  const conversationModule = createConversationModule({
    db,
    languagePair: DEFAULT_LANGUAGE_PAIR,
    createConversationAI: options.createConversationAI,
  });

  await conversationModule.registerRoutes(app);

  return app;
}
