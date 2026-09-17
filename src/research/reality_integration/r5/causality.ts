/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Causality Auditor
 *
 * Enforces unidirectional causality:
 * Downstream spatial calculations, distance evaluations, directional queries,
 * and topology inspections NEVER mutate Reality (Delta Reality = 0).
 */

import { deterministicHash } from './determinism';

export interface R5CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export class RealitySpatialCausalityAuditor {
  private events: R5CausalityEvent[] = [];

  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): R5CausalityEvent {
    const seq = this.events.length;
    const isRealityInvariant = (realityChecksumBefore === realityChecksumAfter);
    const eventId = `EVT_R5_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: R5CausalityEvent = Object.freeze({
      eventId,
      operation,
      domain,
      realityChecksumBefore,
      realityChecksumAfter,
      isRealityInvariant,
      sequence: seq,
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly R5CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariance(event: R5CausalityEvent): boolean {
    const downstreamDomains = ['SPATIAL', 'DISTANCE', 'DIRECTION', 'CONTAINMENT', 'TOPOLOGY', 'CAMERA', 'OBSERVER', 'SELECTION', 'UI', 'WORKSPACE', 'MODEL', 'GEOMETRY'];
    if (downstreamDomains.includes(event.domain)) {
      return event.isRealityInvariant;
    }
    return true;
  }
}
