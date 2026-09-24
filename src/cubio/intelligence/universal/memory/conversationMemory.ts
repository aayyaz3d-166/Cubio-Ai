/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tier 2 — Conversation Memory Store
 *
 * Multi-turn history, entity recall buffer, and user preferences.
 */

import { deterministicHash } from '../../../state/determinism';
import { ConversationMemoryState, ConversationTurn } from './types';

export class ConversationMemoryStore {
  private sessions: Map<string, ConversationMemoryState> = new Map();

  public recordTurn(
    conversationId: string,
    turnData: Omit<ConversationTurn, 'turnId' | 'timestamp'>
  ): Readonly<ConversationTurn> {
    const timestamp = Date.now();
    const turnId = `TURN_${deterministicHash(conversationId + turnData.userMessage + timestamp).slice(2, 10)}`;

    const turn: ConversationTurn = Object.freeze({
      turnId,
      userMessage: turnData.userMessage,
      assistantResponse: turnData.assistantResponse,
      intent: turnData.intent,
      entities: Object.freeze([...turnData.entities]),
      timestamp,
    });

    let state = this.sessions.get(conversationId);
    if (!state) {
      state = {
        conversationId,
        turns: [],
        userPreferences: {},
        entitiesRecognized: [],
      };
    }

    const updatedEntities = new Set([...state.entitiesRecognized, ...turnData.entities]);

    const updatedState: ConversationMemoryState = Object.freeze({
      conversationId,
      turns: Object.freeze([...state.turns, turn]),
      userPreferences: state.userPreferences,
      entitiesRecognized: Object.freeze(Array.from(updatedEntities)),
    });

    this.sessions.set(conversationId, updatedState);
    return turn;
  }

  public getSession(conversationId: string): Readonly<ConversationMemoryState> | null {
    return this.sessions.get(conversationId) || null;
  }

  public getRecentTurns(conversationId: string, limit: number = 5): readonly ConversationTurn[] {
    const session = this.sessions.get(conversationId);
    if (!session) return Object.freeze([]);
    return Object.freeze(session.turns.slice(-limit));
  }
}
