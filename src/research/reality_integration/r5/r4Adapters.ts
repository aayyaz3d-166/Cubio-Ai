/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: R4 Integration Adapter
 *
 * Read-only interface with R4 RealityObject and ObjectCollections.
 */

import { RealityObject, RealityObjectCollection } from '../r4/types';
import { SpatialNode } from './types';

export class R4SpatialAdapter {
  public static convertObjectToSpatialNode(obj: RealityObject): SpatialNode {
    return Object.freeze({
      objectId: obj.identity.objectId,
      realityStateId: obj.identity.targetRealityStateId,
      coordinates: obj.coordinates ? Object.freeze([...obj.coordinates] as [number, number, number]) : undefined,
      dimensions: obj.dimensions ? Object.freeze([...obj.dimensions] as [number, number, number]) : undefined,
      objectChecksum: obj.objectChecksum,
    });
  }

  public static convertCollectionToSpatialNodes(collection: RealityObjectCollection): readonly SpatialNode[] {
    return Object.freeze(collection.objects.map((obj) => R4SpatialAdapter.convertObjectToSpatialNode(obj)));
  }
}
