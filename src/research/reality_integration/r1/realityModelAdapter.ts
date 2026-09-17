/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality -> Model Adapter
 *
 * Maps authoritative Reality state to downstream Model representation.
 * Downstream mutations NEVER alter Reality.
 */

import {
  ObservableRealityState,
  ModelRepresentation,
  RealityStateReference,
} from './types';
import {
  generateDeterministicModelId,
  computeModelChecksum,
  deterministicHash,
} from './determinism';

export class RealityModelAdapter {
  public static adaptRealityToModel(realityState: ObservableRealityState): ModelRepresentation {
    const modelId = generateDeterministicModelId(realityState.stateId);
    const modelChecksum = computeModelChecksum(
      modelId,
      realityState.realityIdentity.realityId,
      realityState.coordinates,
      realityState.dimensions,
      realityState.certainty
    );

    return Object.freeze({
      modelId,
      sourceRealityId: realityState.realityIdentity.realityId,
      sourceStateId: realityState.stateId,
      coordinates: Object.freeze([...realityState.coordinates] as [number, number, number]),
      dimensions: Object.freeze([...realityState.dimensions] as [number, number, number]),
      certainty: realityState.certainty,
      lineageId: `LIN_MDL_${modelId}`,
      modelChecksum,
      timestamp: 0,
    });
  }

  public static createModelReference(realityState: ObservableRealityState, model: ModelRepresentation): RealityStateReference {
    const raw = JSON.stringify([realityState.stateId, model.modelId, model.modelChecksum]);
    return Object.freeze({
      referenceId: `REF_MDL_${deterministicHash(raw)}`,
      targetRealityId: realityState.realityIdentity.realityId,
      targetStateId: realityState.stateId,
      domain: 'MODEL',
      representationId: model.modelId,
      referenceChecksum: model.modelChecksum,
    });
  }
}
