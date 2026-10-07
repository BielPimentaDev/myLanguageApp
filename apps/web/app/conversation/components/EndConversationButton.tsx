export interface EndConversationButtonProps {
  disabled: boolean;
  onEnd: () => void;
}

export function EndConversationButton({ disabled, onEnd }: EndConversationButtonProps) {
  return (
    <button type="button" className="end-conversation-button" disabled={disabled} onClick={onEnd}>
      Finalizar conversa
    </button>
  );
}
