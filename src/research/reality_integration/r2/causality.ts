/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality State Causality Auditor & Event Logger
 *
 * Enforces unidirectional causality:
 * Reality -> Model -> Geometry -> Workspace -> View/UI
 * Downstream mutations NEVER alter Reality (Delta Reality = 0).
 */

import {
  RealityCausalDomain,
  RealityCausalityEvent,
} from './types';
import {
  generateDeterministicEventId,
} from './determinism';

export class R2CausalityAuditor {
  private events: RealityCausalityEvent[] = [];

  public logEvent(
    sourceDomain: RealityCausalDomain,
    targetDomain: RealityCausalDomain,
    operation: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): RealityCausalityEvent {
    const seq = this.events.length;
    const eventId = generateDeterministicEventId(sourceDomain, seq);
    const isRealityInvariant = (realityChecksumBefore === realityChecksumAfter);

    const event: RealityCausalityEvent = Object.freeze({
      eventId,
      sourceDomain,
      targetDomain,
      operation,
      realityChecksumBefore,
      realityChecksumAfter,
      isRealityInvariant,
      sequence: seq,
      timestamp: 0,
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly RealityCausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariants(event: RealityCausalityEvent): boolean {
    // Non-Reality sources MUST NEVER mutate Reality
    if (event.sourceDomain !== 'REALITY' && event.sourceDomain !== 'OBSERVATION') {
      if (!event.isRealityInvariant) {
        return false;
      }
    }

    // Camera, Observer, Selection, UI MUST be 100% Reality invariant
    if (['CAMERA', 'OBSERVER', 'SELECTION', 'UI', 'WORKSPACE', 'GEOMETRY', 'MODEL'].includes(event.sourceDomain)) {
      if (!event.isRealityInvariant) {
        return false;
      }
    }

    return true;
  }
}
