/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Observational Discovery Engine
 *
 * Provides organized discovery feeds for authorized workspace states,
 * recovery checkpoints, versions, saved states, shared spaces, and 3D assets.
 */

import {
  SearchIndex,
  SearchPermissionContext,
  DiscoveryState,
} from './types';
import { WorkspaceSearchEngine } from './searchEngine';

export class WorkspaceDiscoveryEngine {
  public static discover(
    index: SearchIndex,
    context: SearchPermissionContext
  ): DiscoveryState {
    const allResults = WorkspaceSearchEngine.search(
      index,
      { scope: 'ALL' },
      context
    );

    const recentResults = [...allResults]
      .sort((a, b) => ((b.metadata as any)?.createdAt ?? 0) - ((a.metadata as any)?.createdAt ?? 0))
      .slice(0, 10);

    const savedStates = allResults.filter((r) => r.resultType === 'SAVED_STATE');
    const versions = allResults.filter((r) => r.resultType === 'VERSION');
    const checkpoints = allResults.filter((r) => r.resultType === 'CHECKPOINT');
    const sharedSpaces = allResults.filter((r) => r.accessLevel === 'SHARED');
    const assets = allResults.filter((r) => r.resultType === 'MODEL' || r.resultType === 'GEOMETRY');

    return Object.freeze({
      recentResults: Object.freeze(recentResults),
      savedStates: Object.freeze(savedStates),
      versions: Object.freeze(versions),
      checkpoints: Object.freeze(checkpoints),
      sharedSpaces: Object.freeze(sharedSpaces),
      assets: Object.freeze(assets),
      totalDiscoverableCount: allResults.length,
    });
  }
}
