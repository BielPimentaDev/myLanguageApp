import type { FastifyInstance } from 'fastify';
import { ConversationAlreadyEndedError } from '../../domain/errors/conversation-already-ended-error.js';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found-error.js';
import { ScenarioNotFoundError } from '../../domain/errors/scenario-not-found-error.js';
import type { EndConversationUseCase } from '../../application/use-cases/end-conversation.js';
import type { GetConversationUseCase } from '../../application/use-cases/get-conversation.js';
import type { SendMessageUseCase } from '../../application/use-cases/send-message.js';
import type { StartConversationUseCase } from '../../application/use-cases/start-conversation.js';

export interface ConversationRoutesDeps {
  startConversation: StartConversationUseCase;
  sendMessage: SendMessageUseCase;
  endConversation: EndConversationUseCase;
  getConversation: GetConversationUseCase;
}

interface StartConversationBody {
  scenarioId: string;
}

interface SendMessageBody {
  content: string;
}

interface ConversationIdParams {
  id: string;
}

export async function registerConversationRoutes(
  app: FastifyInstance,
  deps: ConversationRoutesDeps,
): Promise<void> {
  app.post<{ Body: StartConversationBody }>('/conversations', async (request, reply) => {
    try {
      const { conversation, scenario, firstAiMessage } = await deps.startConversation.execute({
        scenarioId: request.body.scenarioId,
      });
      return reply.code(201).send({
        conversationId: conversation.id,
        scenario: {
          id: scenario.id,
          name: scenario.name,
          goalDescription: scenario.goalDescription,
        },
        firstAiMessage,
      });
    } catch (error) {
      if (error instanceof ScenarioNotFoundError) {
        return reply.code(404).send({ message: error.message });
      }
      throw error;
    }
  });

  app.post<{ Params: ConversationIdParams; Body: SendMessageBody }>(
    '/conversations/:id/messages',
    async (request, reply) => {
      try {
        const result = await deps.sendMessage.execute({
          conversationId: request.params.id,
          content: request.body.content,
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof ConversationNotFoundError) {
          return reply.code(404).send({ message: error.message });
        }
        if (error instanceof ConversationAlreadyEndedError) {
          return reply.code(409).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: ConversationIdParams }>('/conversations/:id/end', async (request, reply) => {
    try {
      const result = await deps.endConversation.execute({ conversationId: request.params.id });
      return reply.send(result);
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        return reply.code(404).send({ message: error.message });
      }
      if (error instanceof ConversationAlreadyEndedError) {
        return reply.code(409).send({ message: error.message });
      }
      throw error;
    }
  });

  app.get<{ Params: ConversationIdParams }>('/conversations/:id', async (request, reply) => {
    try {
      const { conversation } = await deps.getConversation.execute({ conversationId: request.params.id });
      return reply.send({
        conversation: {
          id: conversation.id,
          scenarioId: conversation.scenarioId,
          languagePair: conversation.languagePair,
          status: conversation.status,
          startedAt: conversation.startedAt,
          endedAt: conversation.endedAt,
        },
        turns: conversation.turns,
      });
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        return reply.code(404).send({ message: error.message });
      }
      throw error;
    }
  });
}
