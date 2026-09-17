/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Navigation Coordinator
 *
 * Facilitates non-mutating navigation from IndexRecords to Space/Experiment/SavedState targets.
 */

import { SpaceManager } from '../p68/spaceManager';
import { SavedStateManager } from '../p68/savedStateManager';
import { ExperimentManager } from '../p68/experimentManager';
import { RecentViewsEngine } from '../p68/recentViews';
import { IndexRecord } from './types';
import { PersonalSpace, SavedStateRecord, ExperimentRecord } from '../p68/types';

export class NavigationCoordinator {
  public static openSpace(
    spaceId: string,
    spaceManager: SpaceManager,
    recentViewsEngine?: RecentViewsEngine
  ): PersonalSpace {
    const space = spaceManager.openSpace(spaceId);
    if (recentViewsEngine) {
      recentViewsEngine.recordView(
        space.spaceId,
        space.view,
        space.dimension,
        space.observers,
        space.view.selectedObjectId
      );
    }
    return space;
  }

  public static openSavedState(
    stateId: string,
    spaceId: string,
    savedStateManager: SavedStateManager,
    spaceManager: SpaceManager
  ): PersonalSpace {
    const space = spaceManager.openSpace(spaceId);
    return savedStateManager.restoreSavedState(space, stateId);
  }

  public static openExperiment(
    experimentId: string,
    experimentManager: ExperimentManager
  ): ExperimentRecord {
    const exp = experimentManager.getExperiment(experimentId);
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found.`);
    }
    return exp;
  }
}
