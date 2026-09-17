/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Causality & Invariant Auditor
 *
 * Enforces and audits causal boundaries between Reality, Model, Geometry,
 * Workspace, Selection, Camera, and UI operations.
 */

import {
  WorkspaceCausalityEvent,
  CausalityDomain,
} from './types';
import { generateDeterministicEventId } from './determinism';

export class WorkspaceCausalityEngine {
  private events: WorkspaceCausalityEvent[] = [];
  private sequence = 0;

  public auditEvent(
    domain: CausalityDomain,
    operation: string,
    targetSpaceId: string,
    realityCSBefore: string,
    realityCSAfter: string,
    modelCSBefore: string,
    modelCSAfter: string,
    geometryCSBefore: string,
    geometryCSAfter: string,
    targetObjectId?: string
  ): WorkspaceCausalityEvent {
    const isRealityInvariant = realityCSBefore === realityCSAfter;
    const isModelInvariant = modelCSBefore === modelCSAfter;
    const isGeometryInvariant = geometryCSBefore === geometryCSAfter;

    const event: WorkspaceCausalityEvent = Object.freeze({
      eventId: generateDeterministicEventId(domain, this.sequence),
      domain,
      operation,
      targetSpaceId,
      targetObjectId,
      realityChecksumBefore: realityCSBefore,
      realityChecksumAfter: realityCSAfter,
      modelChecksumBefore: modelCSBefore,
      modelChecksumAfter: modelCSAfter,
      geometryChecksumBefore: geometryCSBefore,
      geometryChecksumAfter: geometryCSAfter,
      isRealityInvariant,
      isModelInvariant,
      isGeometryInvariant,
      sequence: this.sequence++,
      timestamp: Date.now(),
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly WorkspaceCausalityEvent[] {
    return Object.freeze([...this.events]);
  }

  public clear(): void {
    this.events = [];
    this.sequence = 0;
  }

  public static verifyCameraInvariants(evt: WorkspaceCausalityEvent): boolean {
    return evt.domain === 'CAMERA' && evt.isRealityInvariant && evt.isModelInvariant && evt.isGeometryInvariant;
  }

  public static verifySelectionInvariants(evt: WorkspaceCausalityEvent): boolean {
    return evt.domain === 'SELECTION' && evt.isRealityInvariant && evt.isModelInvariant && evt.isGeometryInvariant;
  }

  public static verifyWorkspaceMutationInvariants(evt: WorkspaceCausalityEvent): boolean {
    return evt.isRealityInvariant;
  }
}
