/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Causality Auditor
 *
 * Audits every natural language input, plan generation, and workspace execution.
 * Enforces: Reality_before == Reality_after (ΔReality = 0).
 */

import { F10CausalityEvent } from './types';
import { generateDeterministicCausalityId } from './determinism';

export class F10CausalityAuditor {
  private events: F10CausalityEvent[] = [];
  private sequence = 0;

  public logEvent(
    commandId: string,
    planId: string,
    operation: string,
    userUtterance: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): F10CausalityEvent {
    this.sequence++;
    const isRealityInvariant = realityChecksumBefore === realityChecksumAfter;
    const eventId = generateDeterministicCausalityId(commandId, this.sequence);

    const event: F10CausalityEvent = {
      eventId,
      commandId,
      planId,
      operation,
      userUtterance,
      realityChecksumBefore,
      realityChecksumAfter,
      isRealityInvariant,
      sequence: this.sequence,
    };

    this.events.push(event);
    return event;
  }

  public verifyInvariant(): boolean {
    if (this.events.length === 0) return true;
    return this.events.every((e) => e.isRealityInvariant);
  }

  public getEvents(): readonly F10CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public reset(): void {
    this.events = [];
    this.sequence = 0;
  }
}
