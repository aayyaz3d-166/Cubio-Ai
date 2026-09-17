/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Counterfactual Analysis Engine
 *
 * Simulates hypothetical spatial changes in an isolated sandbox clone
 * to determine relationship changes without mutating World Model or Reality.
 *
 * Invariant: Physical Reality remains untouched (realityMutation = 0).
 */

import { WorldModel, WorldEntity, WorldRelation, CounterfactualState } from './types';
import { F11WorldRelationEngine } from './worldRelationEngine';
import { deterministicHash } from './determinism';

export class F11CounterfactualEngine {
  public static simulatePositionChange(
    model: WorldModel,
    targetEntityId: string,
    hypotheticalPosition: readonly [number, number, number],
    description = ''
  ): CounterfactualState {
    const target = model.entities[targetEntityId];
    if (!target) {
      throw new Error(`Target entity '${targetEntityId}' not found in World Model.`);
    }

    // 1. Clone Entities and update target hypothetical position
    const clonedEntities: Record<string, WorldEntity> = { ...model.entities };
    clonedEntities[targetEntityId] = {
      ...target,
      origin: 'HYPOTHETICAL',
      certainty: 'HYPOTHETICAL',
      coordinates: Object.freeze([...hypotheticalPosition]),
      transform: target.transform
        ? {
            ...target.transform,
            translation: Object.freeze([...hypotheticalPosition]),
          }
        : undefined,
    };

    // 2. Recompute all relationships in hypothetical world
    const hypotheticalRelations = F11WorldRelationEngine.deriveDirectRelations(
      `HYPO_${model.modelId}`,
      clonedEntities
    );

    // 3. Diff original relations vs hypothetical relations
    const originalMap = new Map<string, WorldRelation>();
    for (const r of model.relations) {
      originalMap.set(`${r.sourceEntityId}:${r.targetEntityId}:${r.relationType}`, r);
    }

    const hypotheticalMap = new Map<string, WorldRelation>();
    for (const r of hypotheticalRelations) {
      hypotheticalMap.set(`${r.sourceEntityId}:${r.targetEntityId}:${r.relationType}`, r);
    }

    const addedRelations: WorldRelation[] = [];
    const removedRelations: WorldRelation[] = [];
    const changedRelations: { original: WorldRelation; updated: WorldRelation }[] = [];

    // Find added relations
    for (const [key, rel] of hypotheticalMap.entries()) {
      if (!originalMap.has(key)) {
        addedRelations.push(rel);
      }
    }

    // Find removed relations
    for (const [key, rel] of originalMap.entries()) {
      if (!hypotheticalMap.has(key)) {
        removedRelations.push(rel);
      }
    }

    const counterfactualId = `CF_${deterministicHash(model.modelId + targetEntityId + hypotheticalPosition.join(','))}`;

    return {
      counterfactualId,
      originalModelChecksum: model.modelChecksum,
      hypotheticalChangeDescription:
        description ||
        `Hypothetical move of ${target.name} to [${hypotheticalPosition.join(', ')}]`,
      originalRelations: Object.freeze([...model.relations]),
      hypotheticalRelations: Object.freeze([...hypotheticalRelations]),
      addedRelations: Object.freeze(addedRelations),
      removedRelations: Object.freeze(removedRelations),
      changedRelations: Object.freeze(changedRelations),
      realityUnchanged: true,
      realityMutation: 0,
    };
  }
}
