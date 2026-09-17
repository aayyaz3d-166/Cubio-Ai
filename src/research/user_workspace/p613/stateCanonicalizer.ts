/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Workspace State Canonicalizer
 *
 * Enforces deterministic canonical representation of workspace state for stable hashing.
 */

import { PersonalSpace } from '../p68/types';
import { CanonicalWorkspaceState } from './types';
import { deterministicHash } from './determinism';

export class StateCanonicalizer {
  public static canonicalize(
    space: PersonalSpace,
    workspaceId = 'WS_DEFAULT_01',
    collaborationShareRef: string | null = null
  ): CanonicalWorkspaceState {
    // 1. Stable sorted objects
    const objects = [...space.reality.objects]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((obj) =>
        Object.freeze({
          id: obj.id,
          label: obj.label,
          position: Object.freeze([obj.position[0], obj.position[1], obj.position[2]]) as [number, number, number],
          category: obj.category,
          certainty: 'EXACT',
        })
      );

    // 2. Stable sorted observers
    const observers = [...space.observers]
      .sort((a, b) => a.observerId.localeCompare(b.observerId))
      .map((obs) =>
        Object.freeze({
          observerId: obs.observerId,
          position: Object.freeze([obs.position[0], obs.position[1], obs.position[2]]) as [number, number, number],
          target: Object.freeze([obs.target[0], obs.target[1], obs.target[2]]) as [number, number, number],
          fov: obs.fov,
          certainty: obs.certainty || 'EXACT',
        })
      );

    const activeObserverId = observers.length > 0 ? observers[0].observerId : null;

    const dimension = Object.freeze({
      dimensionType: space.dimension.dimensionType,
      activeDimensions: space.dimension.activeDimensions,
    });

    const modelChecksum = space.modelScene.modelChecksum;
    const geometryChecksum = space.geometryScene.sceneChecksum;

    const view = Object.freeze({
      cameraPosition: Object.freeze([
        space.view.cameraPosition[0],
        space.view.cameraPosition[1],
        space.view.cameraPosition[2],
      ]) as [number, number, number],
      targetPosition: Object.freeze([
        space.view.cameraTarget[0],
        space.view.cameraTarget[1],
        space.view.cameraTarget[2],
      ]) as [number, number, number],
      zoom: space.view.zoom,
      viewportMode: space.view.viewportMode,
    });

    const raw = JSON.stringify([
      workspaceId,
      space.spaceId,
      space.reality.realityChecksum,
      objects,
      observers,
      activeObserverId,
      dimension,
      modelChecksum,
      geometryChecksum,
      view,
      collaborationShareRef,
    ]);
    const stateChecksum = deterministicHash(raw);

    return Object.freeze({
      workspaceId,
      spaceId: space.spaceId,
      realityChecksum: space.reality.realityChecksum,
      objects: Object.freeze(objects),
      observers: Object.freeze(observers),
      activeObserverId,
      dimension,
      modelChecksum,
      geometryChecksum,
      view,
      collaborationShareRef,
      stateChecksum,
    });
  }
}
