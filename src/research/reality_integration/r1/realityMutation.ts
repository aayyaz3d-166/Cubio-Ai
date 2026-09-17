/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Mutation & Downstream Propagation Engine
 *
 * Controls legitimate X1 -> X2 Reality mutations and deterministic propagation.
 */

import {
  ObservableRealityState,
  ModelRepresentation,
  GeometryRepresentation,
  DownstreamWorkspaceState,
  RealityMutation,
} from './types';
import { RealityIdentityEngine } from './realityIdentity';
import { RealityModelAdapter } from './realityModelAdapter';
import { RealityGeometryAdapter } from './realityGeometryAdapter';
import { computeWorkspaceChecksum, deterministicHash } from './determinism';
import { RealityCausalityAuditor } from './causality';

export interface RealityMutationCascadeResult {
  readonly mutation: RealityMutation;
  readonly newRealityState: ObservableRealityState;
  readonly newModel: ModelRepresentation;
  readonly newGeometry: GeometryRepresentation;
  readonly newWorkspace: DownstreamWorkspaceState;
}

export class RealityMutationEngine {
  public static mutateAndPropagate(
    currentState: ObservableRealityState,
    newCoordinates: readonly [number, number, number],
    newDimensions: readonly [number, number, number] = currentState.dimensions,
    reason = 'CONTROLLED_REALITY_MUTATION',
    sequence = 1,
    auditor?: RealityCausalityAuditor
  ): RealityMutationCascadeResult {
    const newRealityState = RealityIdentityEngine.createAuthoritativeRealityState(
      'MUTATED',
      newCoordinates,
      newDimensions,
      currentState.certainty,
      currentState.stateId,
      sequence
    );

    const mutationId = `MUT_${deterministicHash(currentState.stateId + '->' + newRealityState.stateId)}`;
    const mutation: RealityMutation = Object.freeze({
      mutationId,
      sourceStateId: currentState.stateId,
      targetStateId: newRealityState.stateId,
      newCoordinates: Object.freeze([...newCoordinates] as [number, number, number]),
      newDimensions: Object.freeze([...newDimensions] as [number, number, number]),
      causalReason: reason,
      timestamp: 0,
    });

    const newModel = RealityModelAdapter.adaptRealityToModel(newRealityState);
    const newGeometry = RealityGeometryAdapter.adaptModelToGeometry(newModel, 'OBSERVED');

    const wsSpaceId = `WS_SPC_${newRealityState.stateId}`;
    const wsChecksum = computeWorkspaceChecksum(
      wsSpaceId,
      newGeometry.geometryId,
      newCoordinates,
      newDimensions
    );

    const newWorkspace: DownstreamWorkspaceState = Object.freeze({
      workspaceSpaceId: wsSpaceId,
      sourceRealityId: newRealityState.realityIdentity.realityId,
      sourceModelId: newModel.modelId,
      sourceGeometryId: newGeometry.geometryId,
      coordinates: Object.freeze([...newCoordinates] as [number, number, number]),
      dimensions: Object.freeze([...newDimensions] as [number, number, number]),
      workspaceChecksum: wsChecksum,
      timestamp: 0,
    });

    if (auditor) {
      auditor.logEvent(
        'REALITY',
        'WORKSPACE',
        'REALITY_MUTATION_PROPAGATION',
        currentState.checksum,
        newRealityState.checksum,
        'MDL_OLD',
        newModel.modelChecksum,
        'GEO_OLD',
        newGeometry.geometryChecksum,
        'WS_OLD',
        newWorkspace.workspaceChecksum
      );
    }

    return Object.freeze({
      mutation,
      newRealityState,
      newModel,
      newGeometry,
      newWorkspace,
    });
  }
}
