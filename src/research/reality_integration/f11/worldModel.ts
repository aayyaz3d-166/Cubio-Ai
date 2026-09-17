/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Model Factory
 *
 * Assembles and synchronizes the canonical WorldModel from entities, relations,
 * multi-hop inferences, constraints, and upstream checksums.
 */

import {
  WorldModel,
  WorldEntity,
  WorldRelation,
  Inference,
  SpatialConstraint,
  WorldModelSyncStatus,
} from './types';
import {
  computeWorldModelChecksum,
  computeGraphChecksum,
} from './determinism';
import { F11WorldRelationEngine } from './worldRelationEngine';
import { F11InferenceEngine } from './inferenceEngine';

export class F11WorldModelFactory {
  public static buildWorldModel(
    modelId: string,
    version: number,
    realityStateId: string,
    workspaceId: string,
    entities: Readonly<Record<string, WorldEntity>>,
    manualRelations: readonly WorldRelation[] = [],
    constraints: readonly SpatialConstraint[] = [],
    realityChecksum: string,
    workspaceChecksum: string,
    syncStatus: WorldModelSyncStatus = 'SYNCED'
  ): Readonly<WorldModel> {
    // 1. Derive all direct spatial relations
    const directRelations = F11WorldRelationEngine.deriveDirectRelations(modelId, entities);
    const allDirect = [...directRelations, ...manualRelations];

    // 2. Derive multi-hop inferences
    const inferences: readonly Inference[] = F11InferenceEngine.runInference(
      modelId,
      entities,
      allDirect
    );

    // 3. Compute Checksums
    const graphChecksum = computeGraphChecksum(allDirect);
    const modelChecksum = computeWorldModelChecksum(entities, allDirect, version);

    const model: WorldModel = {
      modelId,
      version,
      realityStateId,
      workspaceId,
      entities: Object.freeze({ ...entities }),
      relations: Object.freeze(allDirect),
      inferences: Object.freeze([...inferences]),
      constraints: Object.freeze([...constraints]),
      realityChecksum,
      workspaceChecksum,
      modelChecksum,
      graphChecksum,
      syncStatus,
      timestamp: Date.now(),
    };

    return Object.freeze(model);
  }
}
