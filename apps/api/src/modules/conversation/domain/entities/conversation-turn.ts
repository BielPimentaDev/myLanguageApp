export type ConversationTurnRole = 'user' | 'ai';

export interface ConversationTurnProps {
  id: string;
  role: ConversationTurnRole;
  content: string;
  createdAt: Date;
}

export class ConversationTurn {
  readonly id: string;
  readonly role: ConversationTurnRole;
  readonly content: string;
  readonly createdAt: Date;

  constructor(props: ConversationTurnProps) {
    this.id = props.id;
    this.role = props.role;
    this.content = props.content;
    this.createdAt = props.createdAt;
  }
}
