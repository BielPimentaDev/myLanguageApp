import type { Conversation } from '../../domain/entities/conversation.js';
import type { Language, LanguagePair } from '../../domain/value-objects/language-pair.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  pt: 'Portuguese (Brazil)',
};

const OPENING_INSTRUCTION =
  '[Scene start] Begin the roleplay now. Greet the customer first and open the interaction, following your role description.';

export function buildTutorSystemPrompt(scenarioPrompt: string, languagePair: LanguagePair): string {
  const targetName = LANGUAGE_NAMES[languagePair.target];
  const nativeName = LANGUAGE_NAMES[languagePair.native];
  return (
    `${scenarioPrompt}\n\nAlways reply in ${targetName}. The user is a ${nativeName} speaker learning ` +
    `${targetName}; keep the language simple and natural, and never switch to ${nativeName}.`
  );
}

export function buildChatMessages(conversation: Conversation, userMessage: string): ChatMessage[] {
  if (conversation.turns.length === 0) {
    return [{ role: 'user', content: userMessage || OPENING_INSTRUCTION }];
  }

  return conversation.turns.map((turn) => ({
    role: turn.role === 'ai' ? 'assistant' : 'user',
    content: turn.content,
  }));
}
