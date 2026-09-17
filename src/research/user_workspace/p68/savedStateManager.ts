/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Saved State Manager
 *
 * Implements immutable state creation and non-destructive state restoration.
 */

import { PersonalSpace, SavedStateRecord } from './types';
import { SavedStateRepository } from './savedStateRepository';
import { SpaceManager } from './spaceManager';
import {
  generateDeterministicSavedStateId,
  deterministicHash,
} from './determinism';

export class SavedStateManager {
  private repository: SavedStateRepository;
  private stateCounter = 0;

  constructor(repository = new SavedStateRepository()) {
    this.repository = repository;
  }

  public getRepository(): SavedStateRepository {
    return this.repository;
  }

  public createSavedState(space: PersonalSpace, label: string): SavedStateRecord {
    this.stateCounter++;
    const stateId = generateDeterministicSavedStateId(space.spaceId, this.stateCounter);
    const stateChecksum = space.spaceChecksum;

    const record: SavedStateRecord = Object.freeze({
      stateId,
      spaceId: space.spaceId,
      label,
      reality: Object.freeze({
        ...space.reality,
        objects: Object.freeze(space.reality.objects.map((o) => Object.freeze({ ...o }))),
      }),
      modelScene: space.modelScene,
      geometryScene: space.geometryScene,
      featureGraph: space.featureGraph,
      observers: Object.freeze(space.observers.map((o) => Object.freeze({ ...o }))),
      dimension: space.dimension,
      view: space.view,
      schemaVersion: '6.8.0',
      stateChecksum,
      createdAt: 0,
    });

    this.repository.create(record);
    return record;
  }

  public restoreSavedState(currentSpace: PersonalSpace, stateId: string): PersonalSpace {
    const saved = this.repository.get(stateId);
    if (!saved) {
      throw new Error(`Saved state ${stateId} not found.`);
    }

    const baseData = {
      ...currentSpace,
      reality: Object.freeze({
        ...saved.reality,
        objects: Object.freeze(saved.reality.objects.map((o) => Object.freeze({ ...o }))),
      }),
      modelScene: saved.modelScene,
      geometryScene: saved.geometryScene,
      featureGraph: saved.featureGraph,
      observers: Object.freeze(saved.observers.map((o) => Object.freeze({ ...o }))),
      dimension: saved.dimension,
      view: saved.view,
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    return Object.freeze({
      ...baseData,
      spaceChecksum,
    });
  }

  public listSavedStates(spaceId: string): readonly SavedStateRecord[] {
    return this.repository.listBySpace(spaceId);
  }

  public deleteSavedState(stateId: string): boolean {
    return this.repository.delete(stateId);
  }
}
