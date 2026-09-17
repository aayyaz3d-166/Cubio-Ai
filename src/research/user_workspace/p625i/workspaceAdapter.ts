/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Studio Live Workspace Adapter
 *
 * Connects the Phase 6 research engines to the Studio UI with transactional safety,
 * persistence, event auditing, and validation guarantees.
 */

import {
  LiveWorkspaceState,
  LiveSpaceState,
  LiveSavedState,
  WorkspaceUserContext,
  WorkspaceActivationReport,
  WorkspaceIntegrationValidationReport,
} from './types';
import { WorkspaceStore } from './workspaceStore';
import { WorkspaceEventLogger, deterministicHash } from './workspaceEvents';
import { WorkspacePersistenceAdapter } from './workspacePersistence';
import { WorkspaceIntegrationValidator } from './workspaceIntegrationValidator';

export class WorkspaceAdapter {
  private store: WorkspaceStore;
  private logger: WorkspaceEventLogger;
  private persistence: WorkspacePersistenceAdapter;
  private context: WorkspaceUserContext;

  constructor(context: WorkspaceUserContext, initialState?: LiveWorkspaceState) {
    this.context = context;
    this.logger = new WorkspaceEventLogger();
    this.persistence = new WorkspacePersistenceAdapter();

    const loaded = initialState ?? this.persistence.loadWorkspace(context.workspaceId);
    this.store = new WorkspaceStore(context, loaded ?? undefined);
  }

  public getState(): LiveWorkspaceState {
    return this.store.getState();
  }

  public getContext(): WorkspaceUserContext {
    return this.context;
  }

  public createSpace(name: string, initialCoords: [number, number, number] = [5, 3, 6]): LiveSpaceState | null {
    const space = this.store.createSpace(name, initialCoords);
    if (!space) return null;
    this.logger.logEvent('SPACE_CREATED', this.context.userId, `Created space ${name}`, space.spaceId);
    this.persistence.saveWorkspace(this.store.getState());
    return space;
  }

  public openSpace(spaceId: string): LiveSpaceState | null {
    const space = this.store.openSpace(spaceId);
    if (space) {
      this.logger.logEvent('SPACE_OPENED', this.context.userId, `Opened space ${space.name}`, spaceId);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return space;
  }

  public switchSpace(spaceId: string): LiveSpaceState | null {
    const space = this.store.openSpace(spaceId);
    if (space) {
      this.logger.logEvent('SPACE_SWITCHED', this.context.userId, `Switched to space ${space.name}`, spaceId);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return space;
  }

  public renameSpace(spaceId: string, newName: string): boolean {
    const success = this.store.renameSpace(spaceId, newName);
    if (success) {
      this.logger.logEvent('SPACE_RENAMED', this.context.userId, `Renamed space to ${newName}`, spaceId);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return success;
  }

  public deleteSpace(spaceId: string): boolean {
    const success = this.store.deleteSpace(spaceId);
    if (success) {
      this.logger.logEvent('SPACE_DELETED', this.context.userId, `Deleted space ${spaceId}`, spaceId);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return success;
  }

  public modifyState(params: {
    coordinates?: [number, number, number];
    dimensions?: [number, number, number];
    observer?: string;
    objectIds?: string[];
    cameraPosition?: [number, number, number];
    cameraTarget?: [number, number, number];
  }): boolean {
    const success = this.store.modifyCurrentState(params);
    if (success) {
      this.logger.logEvent('STATE_CHANGED', this.context.userId, 'Modified workspace state', this.store.getState().activeSpaceId ?? undefined);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return success;
  }

  public saveCurrentState(stateName: string): LiveSavedState | null {
    const stateRecord = this.store.saveCurrentState(stateName);
    if (stateRecord) {
      this.logger.logEvent('STATE_SAVED', this.context.userId, `Saved state ${stateName}`, stateRecord.spaceId);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return stateRecord;
  }

  public loadSavedState(stateId: string): boolean {
    const success = this.store.loadSavedState(stateId);
    if (success) {
      this.logger.logEvent('SAVED_STATE_OPENED', this.context.userId, `Loaded saved state ${stateId}`);
      this.persistence.saveWorkspace(this.store.getState());
    }
    return success;
  }

  public resetCurrentState(): boolean {
    const success = this.store.resetCurrentState();
    if (success) {
      this.logger.logEvent('STATE_RESET', this.context.userId, 'Reset current state to initial parameters');
      this.persistence.saveWorkspace(this.store.getState());
    }
    return success;
  }

  public setSelectedObject(objectId: string | null): void {
    this.store.setSelectedObject(objectId);
  }

  public addExperiment(experimentId: string, spaceId: string, name: string): void {
    this.store.addExperiment(experimentId, spaceId, name);
    this.logger.logEvent('EXPERIMENT_OPENED', this.context.userId, `Added experiment ${name}`, spaceId);
    this.persistence.saveWorkspace(this.store.getState());
  }

  public validateIntegration(): WorkspaceIntegrationValidationReport {
    return WorkspaceIntegrationValidator.validate(this.store.getState(), this.context);
  }

  public getActivationReport(): WorkspaceActivationReport {
    const state = this.store.getState();
    const activationId = `ACT_P625I_${deterministicHash(state.workspaceId)}`;
    const validation = this.validateIntegration();

    const raw = JSON.stringify([
      activationId,
      state.workspaceId,
      this.context.userRole,
      state.spaces.length,
      state.currentChecksum,
    ]);
    const activationChecksum = deterministicHash(raw);

    return Object.freeze({
      activationId,
      workspaceId: state.workspaceId,
      userRole: this.context.userRole,
      totalSpaces: state.spaces.filter((s) => !s.isDeleted).length,
      totalExperiments: state.experiments.length,
      totalSavedStates: state.savedStates.length,
      totalRecentViews: state.recentViews.length,
      activeSpaceId: state.activeSpaceId,
      isLiveActivated: validation.isValid,
      realityInvariant: true,
      activationChecksum,
    });
  }
}
