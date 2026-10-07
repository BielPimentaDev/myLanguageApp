import type { ChatMessage } from '../hooks/useConversation';

export interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <ul className="chat-message-list">
      {messages.map((message) => (
        <li key={message.id} className={`chat-message chat-message--${message.role}`} data-role={message.role}>
          <span className="chat-message__content">{message.content}</span>
        </li>
      ))}
    </ul>
  );
}
