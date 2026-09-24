/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Conversational Voice Context Manager
 *
 * Preserves multi-turn dialogue memory, language switching continuity,
 * user persona attunement, and conversational turn summaries.
 */

import { LanguageCode } from '../../universalTypes';
import {
  VoiceConversationalContext,
  VoicePersona,
  SolfeggioAttunementHz,
  VoiceTurnResult,
} from '../types';

export class VoiceContextManager {
  private contexts: Map<string, VoiceConversationalContext> = new Map();

  public getOrCreateContext(
    conversationId: string,
    initialPersona: VoicePersona = 'CUBIO_SOVEREIGN',
    initialHz: SolfeggioAttunementHz = 528,
    initialLang: LanguageCode = 'en'
  ): VoiceConversationalContext {
    if (!this.contexts.has(conversationId)) {
      this.contexts.set(
        conversationId,
        Object.freeze({
          conversationId,
          preferredLanguage: initialLang,
          activePersona: initialPersona,
          solfeggioHz: initialHz,
          recentTurnSummaries: Object.freeze([]),
          totalTurns: 0,
        })
      );
    }
    return this.contexts.get(conversationId)!;
  }

  public updateContextWithTurn(
    conversationId: string,
    turn: VoiceTurnResult
  ): VoiceConversationalContext {
    const current = this.getOrCreateContext(conversationId);
    const summary = `Turn ${current.totalTurns + 1} [${turn.detectedLanguage}]: User "${turn.transcribedText}" -> CubiO "${turn.reasoningText.slice(0, 48)}..."`;

    const recentSummaries = [...current.recentTurnSummaries, summary].slice(-8);

    const updated: VoiceConversationalContext = Object.freeze({
      conversationId,
      preferredLanguage: turn.detectedLanguage || current.preferredLanguage,
      activePersona: current.activePersona,
      solfeggioHz: current.solfeggioHz,
      recentTurnSummaries: Object.freeze(recentSummaries),
      totalTurns: current.totalTurns + 1,
    });

    this.contexts.set(conversationId, updated);
    return updated;
  }
}
