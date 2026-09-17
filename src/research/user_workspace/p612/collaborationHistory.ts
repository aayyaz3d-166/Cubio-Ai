/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Collaboration History Logger
 *
 * Maintains append-only collaboration events isolated from Reality/Geometry history.
 */

import { CollaborationEvent } from './types';
import { deterministicHash } from './determinism';

export class CollaborationHistoryLogger {
  private events: CollaborationEvent[] = [];

  public logEvent(event: CollaborationEvent): void {
    this.events.push(event);
  }

  public getEvents(shareId?: string): readonly CollaborationEvent[] {
    if (!shareId) {
      return Object.freeze([...this.events]);
    }
    return Object.freeze(this.events.filter((e) => e.shareId === shareId));
  }

  public getHistoryChecksum(shareId?: string): string {
    const evts = this.getEvents(shareId);
    const raw = JSON.stringify(evts.map((e) => [e.eventId, e.eventType, e.actorUserId]));
    return deterministicHash(raw);
  }

  public clear(): void {
    this.events = [];
  }
}
