'use client';

import { ChatInput } from './components/ChatInput';
import { ChatMessageList } from './components/ChatMessageList';
import { EndConversationButton } from './components/EndConversationButton';
import { useConversation } from './hooks/useConversation';

const CAFETERIA_SCENARIO_ID = 'cafeteria';

export default function ConversationPage() {
  const { status, messages, isSending, error, sendMessage, end } = useConversation({
    scenarioId: CAFETERIA_SCENARIO_ID,
  });

  const isActive = status === 'active';
  const hasEnded = status === 'ended';

  return (
    <main className="conversation-page">
      <h1>Cafeteria</h1>

      {status === 'starting' && <p>Starting conversation...</p>}
      {status === 'error' && <p role="alert">{error}</p>}

      <ChatMessageList messages={messages} />

      {hasEnded && <p className="conversation-ended-notice">A conversa foi encerrada.</p>}

      <ChatInput disabled={!isActive || isSending} onSend={sendMessage} />
      <EndConversationButton disabled={!isActive} onEnd={end} />
    </main>
  );
}
