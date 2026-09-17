/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Causality Auditor & Event Logger
 *
 * Enforces unidirectional causality:
 * Reality -> Model -> Geometry -> Workspace -> View/UI
 * Downstream mutations NEVER alter Reality.
 */

import {
  RealityCausalDomain,
  RealityIntegrationEvent,
} from './types';
import {
  generateDeterministicEventId,
} from './determinism';

export class RealityCausalityAuditor {
  private events: RealityIntegrationEvent[] = [];

  public logEvent(
    sourceDomain: RealityCausalDomain,
    targetDomain: RealityCausalDomain,
    operation: string,
    rBefore: string,
    rAfter: string,
    mBefore: string,
    mAfter: string,
    gBefore: string,
    gAfter: string,
    wBefore: string,
    wAfter: string
  ): RealityIntegrationEvent {
    const seq = this.events.length;
    const eventId = generateDeterministicEventId(sourceDomain, seq);
    const isRealityInvariant = (rBefore === rAfter);

    const event: RealityIntegrationEvent = Object.freeze({
      eventId,
      sourceDomain,
      targetDomain,
      operation,
      realityChecksumBefore: rBefore,
      realityChecksumAfter: rAfter,
      modelChecksumBefore: mBefore,
      modelChecksumAfter: mAfter,
      geometryChecksumBefore: gBefore,
      geometryChecksumAfter: gAfter,
      workspaceChecksumBefore: wBefore,
      workspaceChecksumAfter: wAfter,
      isRealityInvariant,
      sequence: seq,
      timestamp: 0,
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly RealityIntegrationEvent[] {
    return Object.freeze([...this.events]);
  }

  public static verifyCausalInvariants(event: RealityIntegrationEvent): boolean {
    // 1. Non-Reality sources MUST NEVER mutate Reality
    if (event.sourceDomain !== 'REALITY' && event.sourceDomain !== 'OBSERVATION') {
      if (!event.isRealityInvariant) {
        return false;
      }
    }

    // 2. Camera, Observer, Selection, UI MUST be 100% Reality invariant
    if (['CAMERA', 'OBSERVER', 'SELECTION', 'UI'].includes(event.sourceDomain)) {
      if (!event.isRealityInvariant) {
        return false;
      }
    }

    return true;
  }
}
