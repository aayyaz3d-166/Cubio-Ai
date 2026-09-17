/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Visualization Causality Auditor
 *
 * Enforces unidirectional causality from Reality down to Viewport.
 *
 * Invariant:
 * Viewport, Visual Scene, Selection, Camera, and UI operations NEVER mutate Reality (Delta Reality = 0).
 */

import { deterministicHash } from './determinism';

export interface R7CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export class R7CausalityAuditor {
  private events: R7CausalityEvent[] = [];

  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): R7CausalityEvent {
    const seq = this.events.length;
    const isRealityInvariant = realityChecksumBefore === realityChecksumAfter;
    const eventId = `EVT_R7_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: R7CausalityEvent = Object.freeze({
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

  public getEvents(): readonly R7CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyDownstreamInvariance(event: R7CausalityEvent): boolean {
    const downstreamDomains = [
      'VISUALIZATION',
      'SELECTION',
      'CAMERA',
      'UI',
      'INSPECTOR',
      'VIEWPORT',
      'LAYER_TOGGLE',
    ];
    if (downstreamDomains.includes(event.domain)) {
      return event.isRealityInvariant;
    }
    return true;
  }
}
