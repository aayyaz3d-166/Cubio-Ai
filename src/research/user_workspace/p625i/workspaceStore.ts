/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Central Deterministic Workspace Store
 *
 * Manages runtime state transitions, prevents cross-space state leakage,
 * and maintains cryptographic determinism across all operations.
 */

import {
  LiveWorkspaceState,
  LiveSpaceState,
  LiveExperimentState,
  LiveSavedState,
  LiveRecentView,
  WorkspaceUserContext,
} from './types';
import {
  deterministicHash,
  generateDeterministicSpaceId,
  generateDeterministicStateId,
  generateDeterministicViewId,
} from './workspaceEvents';

export class WorkspaceStore {
  private state: LiveWorkspaceState;
  private userContext: WorkspaceUserContext;

  constructor(userContext: WorkspaceUserContext, initialState?: LiveWorkspaceState) {
    this.userContext = userContext;
    this.state = initialState ?? Object.freeze({
      workspaceId: userContext.workspaceId,
      activeSpaceId: null,
      spaces: Object.freeze([]),
      experiments: Object.freeze([]),
      savedStates: Object.freeze([]),
      recentViews: Object.freeze([]),
      selectedObjectId: null,
      isDirty: false,
      currentChecksum: deterministicHash(`INIT_${userContext.workspaceId}`),
    });
  }

  public getState(): LiveWorkspaceState {
    return this.state;
  }

  public getUserContext(): WorkspaceUserContext {
    return this.userContext;
  }

  public getActiveSpaceId(): string | null {
    return this.state.activeSpaceId;
  }

  public getActiveSpace(): LiveSpaceState | null {
    if (!this.state.activeSpaceId) return null;
    return this.state.spaces.find((s) => s.spaceId === this.state.activeSpaceId && !s.isDeleted) ?? null;
  }

  public static computeSpaceChecksum(space: {
    spaceId: string;
    name: string;
    currentCoordinates: readonly [number, number, number];
    currentDimensions: readonly [number, number, number];
    currentObserver: string;
    objectIds: readonly string[];
  }): string {
    const raw = JSON.stringify([
      space.spaceId,
      space.name,
      space.currentCoordinates,
      space.currentDimensions,
      space.currentObserver,
      space.objectIds,
    ]);
    return deterministicHash(raw);
  }

  public createSpace(name: string, initialCoords: [number, number, number] = [5, 3, 6]): LiveSpaceState | null {
    if (!this.userContext.isAuthenticated || this.userContext.userRole === 'NO_ACCESS' || this.userContext.userRole === 'OBSERVER') {
      return null;
    }
    const spaceSequence = this.state.spaces.length;
    const spaceId = generateDeterministicSpaceId(this.userContext.userId, name, spaceSequence);
    const lineageId = `LIN_${spaceId}`;
    const realityChecksum = 'CS_REALITY_CANONICAL_01';

    const initialCoordinates: [number, number, number] = [initialCoords[0], initialCoords[1], initialCoords[2]];
    const initialDimensions: [number, number, number] = [10, 10, 10];

    const checksum = WorkspaceStore.computeSpaceChecksum({
      spaceId,
      name,
      currentCoordinates: initialCoordinates,
      currentDimensions: initialDimensions,
      currentObserver: 'OBS_DEFAULT',
      objectIds: [],
    });

    const newSpace: LiveSpaceState = Object.freeze({
      spaceId,
      name,
      ownerId: this.userContext.userId,
      lineageId,
      checksum,
      realityChecksum,
      createdAt: 0,
      updatedAt: 0,
      initialCoordinates: Object.freeze(initialCoordinates),
      currentCoordinates: Object.freeze(initialCoordinates),
      initialDimensions: Object.freeze(initialDimensions),
      currentDimensions: Object.freeze(initialDimensions),
      initialObserver: 'OBS_DEFAULT',
      currentObserver: 'OBS_DEFAULT',
      objectIds: Object.freeze([]),
      cameraPosition: Object.freeze([0, 5, 10]) as [number, number, number],
      cameraTarget: Object.freeze([0, 0, 0]) as [number, number, number],
    });

    const nextSpaces = [...this.state.spaces, newSpace];
    this.updateState({
      spaces: Object.freeze(nextSpaces),
      activeSpaceId: spaceId,
      isDirty: false,
    });

    this.recordRecentView(spaceId, name);
    return newSpace;
  }

  public openSpace(spaceId: string): LiveSpaceState | null {
    const space = this.state.spaces.find((s) => s.spaceId === spaceId && !s.isDeleted);
    if (!space) return null;

    this.updateState({
      activeSpaceId: spaceId,
      selectedObjectId: null,
      isDirty: false,
    });

    this.recordRecentView(spaceId, space.name);
    return space;
  }

  public renameSpace(spaceId: string, newName: string): boolean {
    const spaceIdx = this.state.spaces.findIndex((s) => s.spaceId === spaceId && !s.isDeleted);
    if (spaceIdx === -1) return false;

    const existing = this.state.spaces[spaceIdx];
    const raw = JSON.stringify([existing.spaceId, newName, existing.ownerId, existing.currentCoordinates]);
    const updatedChecksum = deterministicHash(raw);

    const updatedSpace: LiveSpaceState = Object.freeze({
      ...existing,
      name: newName,
      checksum: updatedChecksum,
      updatedAt: 0,
    });

    const nextSpaces = [...this.state.spaces];
    nextSpaces[spaceIdx] = updatedSpace;

    this.updateState({
      spaces: Object.freeze(nextSpaces),
    });

    return true;
  }

  public deleteSpace(spaceId: string): boolean {
    const spaceIdx = this.state.spaces.findIndex((s) => s.spaceId === spaceId);
    if (spaceIdx === -1) return false;

    const updatedSpace: LiveSpaceState = Object.freeze({
      ...this.state.spaces[spaceIdx],
      isDeleted: true,
    });

    const nextSpaces = [...this.state.spaces];
    nextSpaces[spaceIdx] = updatedSpace;

    const nextActiveId = this.state.activeSpaceId === spaceId
      ? nextSpaces.find((s) => !s.isDeleted)?.spaceId ?? null
      : this.state.activeSpaceId;

    this.updateState({
      spaces: Object.freeze(nextSpaces),
      activeSpaceId: nextActiveId,
    });

    return true;
  }

  public modifyCurrentState(params: {
    coordinates?: [number, number, number];
    dimensions?: [number, number, number];
    observer?: string;
    objectIds?: string[];
    cameraPosition?: [number, number, number];
    cameraTarget?: [number, number, number];
  }): boolean {
    if (!this.state.activeSpaceId) return false;

    const spaceIdx = this.state.spaces.findIndex((s) => s.spaceId === this.state.activeSpaceId);
    if (spaceIdx === -1) return false;

    const space = this.state.spaces[spaceIdx];
    const currentCoords = params.coordinates ?? space.currentCoordinates;
    const currentDims = params.dimensions ?? space.currentDimensions;
    const currentObs = params.observer ?? space.currentObserver;
    const currentObjs = params.objectIds ?? space.objectIds;

    const currentCoordinates: [number, number, number] = [currentCoords[0], currentCoords[1], currentCoords[2]];
    const currentDimensions: [number, number, number] = [currentDims[0], currentDims[1], currentDims[2]];

    const updatedChecksum = WorkspaceStore.computeSpaceChecksum({
      spaceId: space.spaceId,
      name: space.name,
      currentCoordinates,
      currentDimensions,
      currentObserver: currentObs,
      objectIds: currentObjs,
    });

    const updatedSpace: LiveSpaceState = Object.freeze({
      ...space,
      currentCoordinates: Object.freeze(currentCoordinates),
      currentDimensions: Object.freeze(currentDimensions),
      currentObserver: currentObs,
      objectIds: Object.freeze([...currentObjs]),
      cameraPosition: params.cameraPosition ? (Object.freeze([...params.cameraPosition]) as [number, number, number]) : space.cameraPosition,
      cameraTarget: params.cameraTarget ? (Object.freeze([...params.cameraTarget]) as [number, number, number]) : space.cameraTarget,
      checksum: updatedChecksum,
      updatedAt: 0,
    });

    const nextSpaces = [...this.state.spaces];
    nextSpaces[spaceIdx] = updatedSpace;

    this.updateState({
      spaces: Object.freeze(nextSpaces),
      isDirty: true,
    });

    return true;
  }

  public saveCurrentState(stateName: string): LiveSavedState | null {
    if (!this.state.activeSpaceId) return null;

    const space = this.state.spaces.find((s) => s.spaceId === this.state.activeSpaceId);
    if (!space) return null;

    const stateSequence = this.state.savedStates.length;
    const stateId = generateDeterministicStateId(space.spaceId, stateSequence);

    const snapshotData = Object.freeze({
      coordinates: space.currentCoordinates,
      dimensions: space.currentDimensions,
      observer: space.currentObserver,
      objectIds: space.objectIds,
      cameraPosition: space.cameraPosition,
      cameraTarget: space.cameraTarget,
    });

    const raw = JSON.stringify([stateId, space.spaceId, stateName, snapshotData]);
    const stateChecksum = deterministicHash(raw);

    const savedState: LiveSavedState = Object.freeze({
      stateId,
      spaceId: space.spaceId,
      name: stateName,
      ownerId: this.userContext.userId,
      stateChecksum,
      spaceChecksum: space.checksum,
      realityChecksum: space.realityChecksum,
      snapshotData,
      savedAt: 0,
    });

    const nextSavedStates = [...this.state.savedStates, savedState];
    this.updateState({
      savedStates: Object.freeze(nextSavedStates),
      isDirty: false,
    });

    return savedState;
  }

  public loadSavedState(stateId: string): boolean {
    const stateRecord = this.state.savedStates.find((s) => s.stateId === stateId);
    if (!stateRecord) return false;

    const spaceIdx = this.state.spaces.findIndex((s) => s.spaceId === stateRecord.spaceId);
    if (spaceIdx === -1) return false;

    const space = this.state.spaces[spaceIdx];
    const snap = stateRecord.snapshotData;

    const currentCoordinates: [number, number, number] = [snap.coordinates[0], snap.coordinates[1], snap.coordinates[2]];
    const currentDimensions: [number, number, number] = [snap.dimensions[0], snap.dimensions[1], snap.dimensions[2]];

    const updatedChecksum = WorkspaceStore.computeSpaceChecksum({
      spaceId: space.spaceId,
      name: space.name,
      currentCoordinates,
      currentDimensions,
      currentObserver: snap.observer,
      objectIds: snap.objectIds,
    });

    const updatedSpace: LiveSpaceState = Object.freeze({
      ...space,
      currentCoordinates: Object.freeze(currentCoordinates),
      currentDimensions: Object.freeze(currentDimensions),
      currentObserver: snap.observer,
      objectIds: Object.freeze([...snap.objectIds]),
      cameraPosition: snap.cameraPosition ?? space.cameraPosition,
      cameraTarget: snap.cameraTarget ?? space.cameraTarget,
      checksum: updatedChecksum,
      updatedAt: 0,
    });

    const nextSpaces = [...this.state.spaces];
    nextSpaces[spaceIdx] = updatedSpace;

    this.updateState({
      spaces: Object.freeze(nextSpaces),
      activeSpaceId: stateRecord.spaceId,
      isDirty: false,
    });

    return true;
  }

  public resetCurrentState(): boolean {
    if (!this.state.activeSpaceId) return false;

    const spaceIdx = this.state.spaces.findIndex((s) => s.spaceId === this.state.activeSpaceId);
    if (spaceIdx === -1) return false;

    const space = this.state.spaces[spaceIdx];
    const initialCoordinates: [number, number, number] = [space.initialCoordinates[0], space.initialCoordinates[1], space.initialCoordinates[2]];
    const initialDimensions: [number, number, number] = [space.initialDimensions[0], space.initialDimensions[1], space.initialDimensions[2]];

    const resetChecksum = WorkspaceStore.computeSpaceChecksum({
      spaceId: space.spaceId,
      name: space.name,
      currentCoordinates: initialCoordinates,
      currentDimensions: initialDimensions,
      currentObserver: space.initialObserver,
      objectIds: [],
    });

    const resetSpace: LiveSpaceState = Object.freeze({
      ...space,
      currentCoordinates: Object.freeze(initialCoordinates),
      currentDimensions: Object.freeze(initialDimensions),
      currentObserver: space.initialObserver,
      objectIds: Object.freeze([]),
      checksum: resetChecksum,
      updatedAt: 0,
    });

    const nextSpaces = [...this.state.spaces];
    nextSpaces[spaceIdx] = resetSpace;

    this.updateState({
      spaces: Object.freeze(nextSpaces),
      isDirty: false,
    });

    return true;
  }

  public setSelectedObject(objectId: string | null): void {
    this.updateState({ selectedObjectId: objectId });
  }

  public recordRecentView(spaceId: string, spaceName: string): void {
    const viewSeq = this.state.recentViews.length;
    const viewId = generateDeterministicViewId(spaceId, viewSeq);

    const newView: LiveRecentView = Object.freeze({
      viewId,
      spaceId,
      spaceName,
      ownerId: this.userContext.userId,
      viewedAt: 0,
    });

    // Limit to 10 recent views
    const filteredViews = this.state.recentViews.filter((v) => v.spaceId !== spaceId);
    const nextViews = [newView, ...filteredViews].slice(0, 10);

    this.updateState({ recentViews: Object.freeze(nextViews) });
  }

  public addExperiment(experimentId: string, spaceId: string, name: string): LiveExperimentState {
    const exp: LiveExperimentState = Object.freeze({
      experimentId,
      spaceId,
      name,
      ownerId: this.userContext.userId,
      lineageId: `LIN_${experimentId}`,
      checksum: deterministicHash(`EXP_${experimentId}_${spaceId}_${name}`),
      createdAt: 0,
    });

    const nextExps = [...this.state.experiments, exp];
    this.updateState({ experiments: Object.freeze(nextExps) });
    return exp;
  }

  private updateState(partial: Partial<LiveWorkspaceState>): void {
    const next: LiveWorkspaceState = {
      ...this.state,
      ...partial,
    };

    const raw = JSON.stringify([
      next.workspaceId,
      next.activeSpaceId ?? '',
      next.spaces.map((s) => [s.spaceId, s.checksum]),
      next.savedStates.map((st) => [st.stateId, st.stateChecksum]),
      next.selectedObjectId ?? '',
    ]);
    const currentChecksum = deterministicHash(raw);

    this.state = Object.freeze({
      ...next,
      currentChecksum,
    });
  }
}
