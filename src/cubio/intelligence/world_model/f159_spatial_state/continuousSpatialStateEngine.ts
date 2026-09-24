import { ContinuousSpatialState, MultiFacetedEntity } from '../types';

export class ContinuousSpatialStateEngine {
  public computeSpatialState(entity: MultiFacetedEntity): ContinuousSpatialState {
    const stateId = 'SPATIAL_STATE_' + entity.entityId;

    return Object.freeze({
      stateId,
      entityId: entity.entityId,
      position: [0, 0, 0] as [number, number, number],
      orientationQuaternion: [0, 0, 0, 1] as [number, number, number, number],
      linearVelocity: [0, 0, 0] as [number, number, number],
      angularVelocity: [0, 0, 0] as [number, number, number],
      boundingRadius: 4.5,
    });
  }
}
