/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version History Logger
 *
 * Dedicated version history logger isolated from camera, model, geometry, and collaboration histories.
 */

import { VersionCausalityEvent } from './types';
import { deterministicHash } from './determinism';

export class VersionHistoryLogger {
  private events: VersionCausalityEvent[] = [];

  public logEvent(event: VersionCausalityEvent): void {
    this.events.push(event);
  }

  public getEvents(workspaceId?: string): readonly VersionCausalityEvent[] {
    if (!workspaceId) {
      return Object.freeze([...this.events]);
    }
    return Object.freeze(this.events.filter((e) => e.workspaceId === workspaceId));
  }

  public getHistoryChecksum(workspaceId?: string): string {
    const evts = this.getEvents(workspaceId);
    const raw = JSON.stringify(evts.map((e) => [e.eventId, e.versionId, e.eventType]));
    return deterministicHash(raw);
  }

  public clear(): void {
    this.events = [];
  }
}
