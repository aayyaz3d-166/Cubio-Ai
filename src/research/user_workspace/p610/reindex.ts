/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Reindex Engine
 *
 * Deterministically rebuilds workspace index from authoritative repositories without mutating Reality.
 */

import { SpaceManager } from '../p68/spaceManager';
import { SavedStateManager } from '../p68/savedStateManager';
import { ExperimentManager } from '../p68/experimentManager';
import { RecentViewsEngine } from '../p68/recentViews';
import { IndexRecord, WorkspaceIndexState, ReindexResult } from './types';
import { IndexBuilder } from './indexBuilder';
import { deterministicHash } from './determinism';

export class ReindexEngine {
  public static reindexWorkspace(
    userId: string,
    spaceManager: SpaceManager,
    savedStateManager?: SavedStateManager,
    experimentManager?: ExperimentManager,
    recentViewsEngine?: RecentViewsEngine
  ): { indexState: WorkspaceIndexState; result: ReindexResult } {
    const records: IndexRecord[] = [];

    // Index Spaces (owned by this user)
    const spaces = spaceManager
      .getRepository()
      .list()
      .filter((s) => s.metadata.ownerUserId === userId);

    for (const space of spaces) {
      records.push(IndexBuilder.buildSpaceRecord(space));

      // Index Saved States for this space
      if (savedStateManager) {
        const states = savedStateManager.listSavedStates(space.spaceId);
        for (const st of states) {
          records.push(IndexBuilder.buildSavedStateRecord(st, userId));
        }
      }

      // Index Experiments for this space
      if (experimentManager) {
        const experiments = experimentManager.listExperiments(space.spaceId);
        for (const exp of experiments) {
          records.push(IndexBuilder.buildExperimentRecord(exp, userId));
        }
      }

      // Index Recent Views
      if (recentViewsEngine) {
        const views = recentViewsEngine.listRecentViews(space.spaceId);
        for (const rv of views) {
          records.push(IndexBuilder.buildRecentViewRecord(rv, userId));
        }
      }
    }

    // Stable sort by recordId
    records.sort((a, b) => a.recordId.localeCompare(b.recordId));

    const raw = JSON.stringify([
      userId,
      '6.10.0',
      records.map((r) => [r.recordId, r.checksumRef, r.status]),
    ]);
    const indexChecksum = deterministicHash(raw);

    const indexState: WorkspaceIndexState = Object.freeze({
      userId,
      schemaVersion: '6.10.0',
      records: Object.freeze(records),
      indexChecksum,
      lastReindexedAt: 0,
    });

    const result: ReindexResult = Object.freeze({
      success: true,
      totalIndexed: records.length,
      removedOrphans: 0,
      updatedStale: 0,
      indexChecksum,
      reindexedAt: 0,
    });

    return { indexState, result };
  }
}
