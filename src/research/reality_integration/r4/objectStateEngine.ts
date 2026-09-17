/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Object State & Versioning Engine
 *
 * Implements deterministic object state versioning and historical state preservation.
 */

import {
  RealityObjectState,
  RealityObject,
  RealityObjectCertainty,
  RealityObjectOrigin,
} from './types';
import {
  deterministicHash,
} from './determinism';

export class RealityObjectStateEngine {
  private objectStates: Map<string, RealityObjectState[]> = new Map();

  public recordObjectState(
    obj: RealityObject,
    coordinates?: readonly [number, number, number],
    dimensions?: readonly [number, number, number],
    certainty: RealityObjectCertainty = obj.certainty,
    origin: RealityObjectOrigin = obj.origin
  ): RealityObjectState {
    const history = this.objectStates.get(obj.identity.objectId) ?? [];
    const version = history.length + 1;
    const raw = JSON.stringify([obj.identity.objectId, version, coordinates, dimensions, certainty, origin]);
    const checksum = `CS_OBJSTATE_${deterministicHash(raw)}`;
    const stateId = `OST_${deterministicHash(raw)}`;

    const state: RealityObjectState = Object.freeze({
      stateId,
      objectId: obj.identity.objectId,
      version,
      coordinates: coordinates ? Object.freeze([...coordinates] as [number, number, number]) : undefined,
      dimensions: dimensions ? Object.freeze([...dimensions] as [number, number, number]) : undefined,
      certainty,
      origin,
      checksum,
      timestamp: 0,
    });

    history.push(state);
    this.objectStates.set(obj.identity.objectId, history);
    return state;
  }

  public getObjectHistory(objectId: string): readonly RealityObjectState[] {
    return Object.freeze([...(this.objectStates.get(objectId) ?? [])]);
  }
}
