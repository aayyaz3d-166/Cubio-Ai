/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Causality Auditor
 *
 * Tracks all R8 operations and enforces ΔReality = 0 for every downstream interaction.
 * Rejects any attempted direct mutation of Reality from selection, transform, camera, UI, undo, or redo.
 */

import { deterministicHash } from './determinism';

export interface R8CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export class R8CausalityAuditor {
  private events: R8CausalityEvent[] = [];

  public static readonly DOWNSTREAM_DOMAINS = Object.freeze([
    'INTERACTION',
    'SELECTION',
    'TRANSFORM',
    'PREVIEW',
    'COMMIT',
    'UNDO',
    'REDO',
    'CAMERA',
    'UI',
    'INSPECTOR',
    'VIEWPORT',
    'LAYER_TOGGLE',
    'RESET',
    'CANCEL',
  ]);

  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): R8CausalityEvent {
    const seq = this.events.length;
    const isRealityInvariant = realityChecksumBefore === realityChecksumAfter;
    const eventId = `EVT_R8_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: R8CausalityEvent = Object.freeze({
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

  public getEvents(): readonly R8CausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyDownstreamInvariance(event: R8CausalityEvent): boolean {
    if (R8CausalityAuditor.DOWNSTREAM_DOMAINS.includes(event.domain)) {
      return event.isRealityInvariant;
    }
    return true;
  }

  public static rejectUnauthorizedRealityMutation(
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): boolean {
    if (R8CausalityAuditor.DOWNSTREAM_DOMAINS.includes(domain)) {
      return realityChecksumBefore !== realityChecksumAfter;
    }
    return false;
  }
}
