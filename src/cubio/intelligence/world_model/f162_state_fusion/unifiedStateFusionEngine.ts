/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F162: Unified State Fusion Engine
 *
 * Merges Knowledge Graph, Spatial State, Causal Model, and Temporal State
 * into a single unified high-dimensional world state vector.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  ContinuousSpatialState,
  CausalInterventionForecast,
  MultiRelationalSpatialGraph,
  TemporalTrajectorySnapshot,
  UnifiedWorldStateVector,
} from '../types';

export class UnifiedStateFusionEngine {
  public fuseWorldState(
    graph: MultiRelationalSpatialGraph,
    spatial: ContinuousSpatialState,
    causal: CausalInterventionForecast,
    temporal: TemporalTrajectorySnapshot
  ): UnifiedWorldStateVector {
    const stateVectorId = `FUSED_STATE_${Date.now()}`;
    const unifiedStateChecksum = deterministicHash(
      `${stateVectorId}:${graph.spatialGraphChecksum}:${spatial.stateId}:${causal.interventionId}:${temporal.trajectoryId}`
    );

    return Object.freeze({
      stateVectorId,
      activeEntitiesCount: graph.entities.length,
      fusedKnowledgeGraphId: graph.graphId,
      fusedSpatialStateId: spatial.stateId,
      fusedCausalModelId: causal.interventionId,
      fusedTemporalStateId: temporal.trajectoryId,
      unifiedStateChecksum,
    });
  }
}
