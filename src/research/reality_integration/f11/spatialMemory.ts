/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Memory Engine
 *
 * Tracks entity positions, relationship histories, entity lifecycles, and delta transitions
 * across World Model versions without mutating historical reality state.
 */

import { WorldEntity, WorldRelation, WorldModel } from './types';

export interface EntitySpatialHistory {
  readonly entityId: string;
  readonly name: string;
  readonly previousPosition?: readonly [number, number, number];
  readonly currentPosition?: readonly [number, number, number];
  readonly positionHistory: readonly (readonly [number, number, number])[];
  readonly firstObservedVersion: number;
  readonly lastObservedVersion: number;
}

export class F11SpatialMemory {
  private entityHistories: Map<string, EntitySpatialHistory> = new Map();
  private modelVersions: WorldModel[] = [];

  public recordModelVersion(model: WorldModel): void {
    this.modelVersions.push(model);

    for (const entity of Object.values(model.entities)) {
      const pos = entity.coordinates || entity.transform?.translation;
      const existing = this.entityHistories.get(entity.entityId);

      if (existing) {
        const history = pos ? [...existing.positionHistory, pos] : existing.positionHistory;
        this.entityHistories.set(entity.entityId, {
          ...existing,
          previousPosition: existing.currentPosition,
          currentPosition: pos,
          positionHistory: Object.freeze(history),
          lastObservedVersion: model.version,
        });
      } else {
        this.entityHistories.set(entity.entityId, {
          entityId: entity.entityId,
          name: entity.name,
          previousPosition: undefined,
          currentPosition: pos,
          positionHistory: pos ? Object.freeze([pos]) : Object.freeze([]),
          firstObservedVersion: model.version,
          lastObservedVersion: model.version,
        });
      }
    }
  }

  public getEntityHistory(entityId: string): EntitySpatialHistory | null {
    return this.entityHistories.get(entityId) || null;
  }

  public getAllHistories(): readonly EntitySpatialHistory[] {
    return Object.freeze([...this.entityHistories.values()]);
  }

  public getVersionsCount(): number {
    return this.modelVersions.length;
  }

  public getModelVersion(version: number): WorldModel | null {
    return this.modelVersions.find((m) => m.version === version) || null;
  }

  public reset(): void {
    this.entityHistories.clear();
    this.modelVersions = [];
  }
}
