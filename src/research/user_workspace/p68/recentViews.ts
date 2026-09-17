/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Recent Views Engine
 *
 * Tracks recent Space perspectives without mutating Reality, Geometry, or Experiment histories.
 */

import { RecentViewRecord, ViewStateRecord, DimensionStateRecord, ObserverConfigRecord } from './types';
import { generateDeterministicRecentViewId } from './determinism';

export class RecentViewsEngine {
  private views: RecentViewRecord[] = [];
  private viewCounter = 0;

  public recordView(
    spaceId: string,
    view: ViewStateRecord,
    dimension: DimensionStateRecord,
    observers: readonly ObserverConfigRecord[],
    selectedObjectId: string | null = null
  ): RecentViewRecord {
    this.viewCounter++;
    const viewId = generateDeterministicRecentViewId(spaceId, this.viewCounter);

    const record: RecentViewRecord = Object.freeze({
      viewId,
      spaceId,
      view,
      dimension,
      observers: Object.freeze(observers.map((o) => Object.freeze({ ...o }))),
      selectedObjectId,
      timestamp: 0,
    });

    this.views.unshift(record);
    if (this.views.length > 25) {
      this.views.pop();
    }

    return record;
  }

  public listRecentViews(spaceId?: string): readonly RecentViewRecord[] {
    if (spaceId) {
      return Object.freeze(this.views.filter((v) => v.spaceId === spaceId));
    }
    return Object.freeze([...this.views]);
  }

  public clear(): void {
    this.views = [];
  }
}
