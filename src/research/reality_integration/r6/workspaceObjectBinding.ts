/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Object Binding
 *
 * Binds R4 RealityObject into deterministic downstream WorkspaceObjectBinding.
 * Preserves canonical coordinates, certainty, provenance, origin, and lineage.
 */

import { RealityObject } from '../r4/types';
import { WorkspaceObjectBinding } from './types';
import {
  generateDeterministicWorkspaceObjectId,
  computeWorkspaceObjectChecksum,
} from './determinism';

export class WorkspaceObjectBindingEngine {
  public static bindObject(obj: RealityObject): WorkspaceObjectBinding {
    const workspaceObjectId = generateDeterministicWorkspaceObjectId(obj.identity.objectId);

    const coords = obj.coordinates
      ? Object.freeze([...obj.coordinates] as [number, number, number])
      : undefined;

    const dims = obj.dimensions
      ? Object.freeze([...obj.dimensions] as [number, number, number])
      : undefined;

    const obsRefs = Object.freeze(
      obj.observationReferences.map((ref) => ref.observationId)
    );

    const bindingChecksum = computeWorkspaceObjectChecksum(
      workspaceObjectId,
      obj.identity.objectId,
      obj.identity.targetRealityStateId,
      obj.objectChecksum,
      coords,
      dims
    );

    return Object.freeze({
      workspaceObjectId,
      realityObjectId: obj.identity.objectId,
      realityStateId: obj.identity.targetRealityStateId,
      name: obj.name,
      geometryType: obj.objectType,
      coordinates: coords,
      dimensions: dims,
      certainty: obj.certainty,
      origin: obj.origin,
      observationReferences: obsRefs,
      lineage: Object.freeze({ ...obj.lineage }),
      sourceObjectChecksum: obj.objectChecksum,
      bindingChecksum,
    });
  }

  public static bindObjects(objects: readonly RealityObject[]): readonly WorkspaceObjectBinding[] {
    return Object.freeze(objects.map((obj) => WorkspaceObjectBindingEngine.bindObject(obj)));
  }
}
