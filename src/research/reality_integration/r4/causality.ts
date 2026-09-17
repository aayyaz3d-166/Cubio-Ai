/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Multi-Object Causality Auditor
 *
 * Enforces unidirectional causality:
 * Downstream object/graph/relationship actions NEVER mutate Reality (Delta Reality = 0).
 */

import { deterministicHash } from './determinism';

export interface R4CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export class RealityMultiObjectCausalityAuditor {
  private events: R4CausalityEvent[] = [];

  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): R4CausalityEvent {
    const seq = this.events.length;
    const isRealityInvariant = (realityChecksumBefore === realityChecksumAfter);
    const eventId = `EVT_R4_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: R4CausalityEvent = Object.freeze({
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

  public getEvents(): readonly R4CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariance(event: R4CausalityEvent): boolean {
    const nonRealityDomains = ['OBJECT', 'GRAPH', 'RELATIONSHIP', 'CAMERA', 'OBSERVER', 'SELECTION', 'UI', 'WORKSPACE', 'MODEL', 'GEOMETRY'];
    if (nonRealityDomains.includes(event.domain)) {
      return event.isRealityInvariant;
    }
    return true;
  }
}
