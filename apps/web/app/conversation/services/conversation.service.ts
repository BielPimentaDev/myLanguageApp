export interface ScenarioDTO {
  id: string;
  name: string;
  goalDescription: string;
}

export interface StartConversationResponse {
  conversationId: string;
  scenario: ScenarioDTO;
  firstAiMessage: string;
}

export type ConversationStatusDTO = 'active' | 'ended';

export interface SendMessageResponse {
  aiReply: string | null;
  status: ConversationStatusDTO;
}

export interface EndConversationResponse {
  status: ConversationStatusDTO;
}

export class ConversationServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'ConversationServiceError';
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new ConversationServiceError(body.message ?? 'Unexpected error', response.status);
  }
  return body;
}

export class ConversationService {
  constructor(private readonly baseUrl: string) {}

  async start(scenarioId: string): Promise<StartConversationResponse> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    return parseJsonResponse<StartConversationResponse>(response);
  }

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return parseJsonResponse<SendMessageResponse>(response);
  }

  async end(conversationId: string): Promise<EndConversationResponse> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/end`, {
      method: 'POST',
    });
    return parseJsonResponse<EndConversationResponse>(response);
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const conversationService = new ConversationService(API_BASE_URL);
