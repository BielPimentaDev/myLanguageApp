import { buildApp } from './app.js';
import { GeminiConversationAIAdapter } from './modules/conversation/index.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to start the API`);
  }
  return value;
}

const port = Number(process.env.PORT ?? 3001);

// Composition root: to switch AI providers, pass a different ConversationAIPort adapter here.
const geminiApiKey = requireEnv('GEMINI_API_KEY');
const geminiModel = requireEnv('GEMINI_MODEL');

buildApp({
  createConversationAI: (scenarioCatalog) =>
    new GeminiConversationAIAdapter(scenarioCatalog, { apiKey: geminiApiKey, model: geminiModel }),
})
  .then((app) => app.listen({ port, host: '0.0.0.0' }))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
