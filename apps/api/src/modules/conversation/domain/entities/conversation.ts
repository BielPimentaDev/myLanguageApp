import type { LanguagePair } from '../value-objects/language-pair.js';
import { ConversationAlreadyEndedError } from '../errors/conversation-already-ended-error.js';
import type { ConversationTurn } from './conversation-turn.js';

export type ConversationStatus = 'active' | 'ended';

const DEFAULT_MAX_EXCHANGES = 15;

export interface ConversationProps {
  id: string;
  scenarioId: string;
  languagePair: LanguagePair;
  status: ConversationStatus;
  turns: ConversationTurn[];
  startedAt: Date;
  endedAt: Date | null;
  maxExchanges?: number;
}

export class Conversation {
  readonly id: string;
  readonly scenarioId: string;
  readonly languagePair: LanguagePair;
  readonly startedAt: Date;
  private _status: ConversationStatus;
  private _turns: ConversationTurn[];
  private _endedAt: Date | null;
  private readonly maxExchanges: number;

  constructor(props: ConversationProps) {
    this.id = props.id;
    this.scenarioId = props.scenarioId;
    this.languagePair = props.languagePair;
    this.startedAt = props.startedAt;
    this._status = props.status;
    this._turns = [...props.turns];
    this._endedAt = props.endedAt;
    this.maxExchanges = props.maxExchanges ?? DEFAULT_MAX_EXCHANGES;
  }

  get status(): ConversationStatus {
    return this._status;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  get turns(): ConversationTurn[] {
    return [...this._turns];
  }

  addTurn(turn: ConversationTurn, now: Date = new Date()): void {
    if (this._status !== 'active') {
      throw new ConversationAlreadyEndedError(this.id);
    }

    this._turns.push(turn);

    if (turn.role === 'ai') {
      const exchangeCount = this._turns.filter((t) => t.role === 'user').length;
      if (exchangeCount >= this.maxExchanges) {
        this._status = 'ended';
        this._endedAt = now;
      }
    }
  }

  end(now: Date = new Date()): void {
    if (this._status !== 'active') {
      throw new ConversationAlreadyEndedError(this.id);
    }
    this._status = 'ended';
    this._endedAt = now;
  }
}
