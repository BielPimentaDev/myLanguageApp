export class ConversationAlreadyEndedError extends Error {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} has already ended`);
    this.name = 'ConversationAlreadyEndedError';
  }
}
