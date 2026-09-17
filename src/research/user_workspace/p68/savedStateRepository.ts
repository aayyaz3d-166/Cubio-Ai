/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Saved State Repository
 *
 * Safe repository for immutable Saved States within Spaces.
 */

import { SavedStateRecord } from './types';

export class SavedStateRepository {
  private states: Map<string, SavedStateRecord> = new Map();

  public create(state: SavedStateRecord): void {
    if (this.states.has(state.stateId)) {
      throw new Error(`Saved state with ID ${state.stateId} already exists.`);
    }
    this.states.set(state.stateId, state);
  }

  public get(stateId: string): SavedStateRecord | undefined {
    return this.states.get(stateId);
  }

  public listBySpace(spaceId: string): readonly SavedStateRecord[] {
    return Object.freeze(Array.from(this.states.values()).filter((s) => s.spaceId === spaceId));
  }

  public delete(stateId: string): boolean {
    return this.states.delete(stateId);
  }

  public clear(): void {
    this.states.clear();
  }
}
