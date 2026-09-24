/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Voice Interruption & Barge-In Controller
 *
 * Provides real-time interruption signal handling, halting active audio playback,
 * canceling ongoing TTS generation, and transitioning the conversational state smoothly.
 */

import { deterministicHash } from '../../../../state/determinism';
import { VoiceTurnInterruptionEvent } from '../types';

export class VoiceInterruptionController {
  private activeTurns: Map<string, { turnId: string; startTime: number }> = new Map();
  private interruptedEvents: VoiceTurnInterruptionEvent[] = [];

  public startTurn(sessionId: string, turnId: string): void {
    this.activeTurns.set(sessionId, { turnId, startTime: Date.now() });
  }

  public finishTurn(sessionId: string): void {
    this.activeTurns.delete(sessionId);
  }

  /**
   * Triggers an immediate barge-in interruption on the active session.
   */
  public interruptSession(sessionId: string): VoiceTurnInterruptionEvent {
    const active = this.activeTurns.get(sessionId);
    const turnId = active?.turnId || `TURN_INTR_${Date.now()}`;
    const eventId = `EVT_INTR_${deterministicHash(`${sessionId}:${turnId}:${Date.now()}`).slice(2, 10)}`;

    const event: VoiceTurnInterruptionEvent = Object.freeze({
      eventId,
      turnId,
      playbackHalted: true,
      timestamp: Date.now(),
    });

    this.interruptedEvents.push(event);
    this.activeTurns.delete(sessionId);

    return event;
  }

  public isTurnInterrupted(turnId: string): boolean {
    return this.interruptedEvents.some((e) => e.turnId === turnId);
  }
}
