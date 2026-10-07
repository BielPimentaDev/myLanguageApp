'use client';

import { useState, type FormEvent } from 'react';

export interface ChatInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = value.trim();
    if (!content || disabled) {
      return;
    }
    onSend(content);
    setValue('');
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder="Type your message..."
        aria-label="Message"
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
