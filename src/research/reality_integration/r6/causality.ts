/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Causality Auditor
 *
 * Enforces unidirectional causality:
 * REALITY -> REALITY STATE -> OBSERVATIONS -> OBJECTS -> SPATIAL -> WORKSPACE -> UI/CAMERA/SELECTION
 *
 * Workspace, UI, Camera, and Selection mutations NEVER alter authoritative Reality (Delta Reality = 0).
 */

import { deterministicHash } from './determinism';

export interface R6CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export class WorkspaceCausalityAuditor {
  private events: R6CausalityEvent[] = [];

  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): R6CausalityEvent {
    const seq = this.events.length;
    const isRealityInvariant = realityChecksumBefore === realityChecksumAfter;
    const eventId = `EVT_R6_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: R6CausalityEvent = Object.freeze({
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

  public getEvents(): readonly R6CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariance(event: R6CausalityEvent): boolean {
    const downstreamDomains = [
      'WORKSPACE',
      'SELECTION',
      'CAMERA',
      'UI',
      'PANEL',
      'VIEWPORT',
      'ORBIT',
      'ZOOM',
    ];
    if (downstreamDomains.includes(event.domain)) {
      return event.isRealityInvariant;
    }
    return true;
  }
}
