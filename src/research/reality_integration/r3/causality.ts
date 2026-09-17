/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Causality Auditor & Event Integrity Guard
 *
 * Verifies unidirectional causality and Delta Reality = 0 for all observation/temporal operations.
 */

import {
  RealityEvent,
  RealityEventType,
} from './types';
import {
  generateDeterministicEventId,
  computeEventChecksum,
} from './determinism';

export class R3CausalityAuditor {
  private events: RealityEvent[] = [];

  public logEvent(
    eventType: RealityEventType,
    sourceRealityStateId: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string,
    observationId?: string,
    targetRealityStateId?: string,
    provenance = 'R3_OBSERVATION_ENGINE'
  ): RealityEvent {
    const seq = this.events.length;
    const eventId = generateDeterministicEventId(eventType, seq);
    const parentEventId = seq > 0 ? this.events[seq - 1].eventId : null;
    const isRealityInvariant = (realityChecksumBefore === realityChecksumAfter);

    const eventChecksum = computeEventChecksum(
      eventId,
      eventType,
      sourceRealityStateId,
      seq,
      realityChecksumBefore,
      realityChecksumAfter
    );

    const event: RealityEvent = Object.freeze({
      eventId,
      eventType,
      sourceRealityStateId,
      targetRealityStateId,
      observationId,
      parentEventId,
      sequence: seq,
      realityChecksumBefore,
      realityChecksumAfter,
      isRealityInvariant,
      provenance,
      timestamp: 0,
      eventChecksum,
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly RealityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariance(event: RealityEvent): boolean {
    const nonMutatingEvents: RealityEventType[] = [
      'INITIAL_OBSERVATION',
      'OBSERVATION_ADDED',
      'OBSERVATION_UPDATED',
      'SNAPSHOT_CREATED',
      'OBSERVATION_REJECTED',
      'VALIDATION_FAILED',
    ];

    if (nonMutatingEvents.includes(event.eventType)) {
      return event.isRealityInvariant;
    }

    return true;
  }
}
