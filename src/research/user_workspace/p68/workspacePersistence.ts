/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Workspace Persistence Coordinator
 *
 * Coordinates Spaces, Experiments, Saved States, and Recent Views in an integrated workspace layer.
 */

import { PersonalWorkspaceState, PersonalSpace } from './types';
import { SpaceManager } from './spaceManager';
import { ExperimentManager } from './experimentManager';
import { SavedStateManager } from './savedStateManager';
import { RecentViewsEngine } from './recentViews';
import { deterministicHash } from './determinism';

export class WorkspacePersistenceCoordinator {
  public readonly spaceManager: SpaceManager;
  public readonly experimentManager: ExperimentManager;
  public readonly savedStateManager: SavedStateManager;
  public readonly recentViewsEngine: RecentViewsEngine;
  private userId: string;
  private activeSpaceId: string | null = null;

  constructor(userId = 'USR_RESEARCHER_01') {
    this.userId = userId;
    this.spaceManager = new SpaceManager();
    this.experimentManager = new ExperimentManager();
    this.savedStateManager = new SavedStateManager();
    this.recentViewsEngine = new RecentViewsEngine();
  }

  public getUserId(): string {
    return this.userId;
  }

  public getActiveSpaceId(): string | null {
    return this.activeSpaceId;
  }

  public setActiveSpaceId(spaceId: string): void {
    if (!this.spaceManager.getRepository().get(spaceId)) {
      throw new Error(`Cannot activate non-existent space ${spaceId}.`);
    }
    this.activeSpaceId = spaceId;
  }

  public getActiveSpace(): PersonalSpace | undefined {
    return this.activeSpaceId ? this.spaceManager.openSpace(this.activeSpaceId) : undefined;
  }

  public assembleWorkspaceState(): PersonalWorkspaceState {
    const spaces = this.spaceManager.getRepository().list();
    const experiments = this.experimentManager.listExperiments();
    const savedStates = this.savedStateManager.getRepository().listBySpace(this.activeSpaceId || '');
    const recentViews = this.recentViewsEngine.listRecentViews(this.activeSpaceId || undefined);

    const activeSpaceId = this.activeSpaceId || (spaces.length > 0 ? spaces[0].spaceId : '');

    const raw = JSON.stringify([
      this.userId,
      activeSpaceId,
      spaces.map((s) => s.spaceChecksum),
      experiments.map((e) => e.currentChecksum),
      savedStates.map((st) => st.stateChecksum),
    ]);
    const workspaceChecksum = deterministicHash(raw);

    return Object.freeze({
      userId: this.userId,
      activeSpaceId,
      spaces,
      experiments,
      savedStates,
      recentViews,
      workspaceChecksum,
    });
  }
}
