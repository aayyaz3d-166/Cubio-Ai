/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Deterministic Workspace Events & Causality
 *
 * Implements cryptographic deterministic event logging (σ² = 0)
 * and strict separation of UI actions from Reality mutations.
 */

import {
  WorkspaceIntegrationEvent,
  WorkspaceIntegrationEventType,
  WorkspaceCausalityEvent,
} from './types';

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicSpaceId(
  ownerId: string,
  name: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`SPC_${ownerId}_${name}_${sequence}`);
  return `SPC_P625_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicStateId(
  spaceId: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`ST_${spaceId}_${sequence}`);
  return `ST_P625_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicViewId(
  spaceId: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`VW_${spaceId}_${sequence}`);
  return `VW_P625_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEventId(
  eventType: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`EVT_${eventType}_${sequence}`);
  return `EVT_P625I_${hashKey.slice(0, 8)}`;
}

export class WorkspaceEventLogger {
  private events: WorkspaceIntegrationEvent[] = [];

  public logEvent(
    eventType: WorkspaceIntegrationEventType,
    actorId: string,
    details: string,
    spaceId?: string
  ): WorkspaceIntegrationEvent {
    const sequence = this.events.length;
    const eventId = generateDeterministicEventId(eventType, sequence);
    const timestamp = 0; // Deterministic baseline

    const raw = JSON.stringify([eventId, eventType, spaceId ?? '', actorId, details, sequence]);
    const checksum = deterministicHash(raw);

    const event: WorkspaceIntegrationEvent = Object.freeze({
      eventId,
      eventType,
      spaceId,
      actorId,
      sequence,
      timestamp,
      details,
      checksum,
    });

    this.events.push(event);
    return event;
  }

  public getEvents(): readonly WorkspaceIntegrationEvent[] {
    return Object.freeze([...this.events]);
  }

  public clear(): void {
    this.events = [];
  }
}

export class WorkspaceCausalityAuditor {
  public static auditEvent(
    eventType: WorkspaceCausalityEvent['eventType'],
    realityBefore: string,
    realityAfter: string,
    modelBefore: string,
    modelAfter: string,
    geometryBefore: string,
    geometryAfter: string
  ): WorkspaceCausalityEvent {
    const isRealityInvariant = realityBefore === realityAfter;
    const isModelInvariant = modelBefore === modelAfter;
    const isGeometryInvariant = geometryBefore === geometryAfter;

    const eventId = `CAUS_P625I_${deterministicHash(`${eventType}_${realityBefore}_${realityAfter}`)}`;

    return Object.freeze({
      eventId,
      eventType,
      realityChecksumBefore: realityBefore,
      realityChecksumAfter: realityAfter,
      modelChecksumBefore: modelBefore,
      modelChecksumAfter: modelAfter,
      geometryChecksumBefore: geometryBefore,
      geometryChecksumAfter: geometryAfter,
      isRealityInvariant,
      isModelInvariant,
      isGeometryInvariant,
    });
  }

  public static verifyInvariants(event: WorkspaceCausalityEvent): boolean {
    if (
      event.eventType === 'SPACE_NAVIGATED' ||
      event.eventType === 'CAMERA_MOVED' ||
      event.eventType === 'OBJECT_SELECTED' ||
      event.eventType === 'STATE_SAVED' ||
      event.eventType === 'SPACE_SWITCHED'
    ) {
      return event.isRealityInvariant && event.isModelInvariant && event.isGeometryInvariant;
    }
    return true;
  }
}
