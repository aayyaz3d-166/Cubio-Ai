/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Checksum Manifold
 *
 * Deterministic composition and tracking of Reality, Model, Geometry, Observer, View, and Space checksums.
 */

import { PersonalSpace, ObserverConfigRecord, ViewStateRecord } from '../p68/types';
import { ChecksumManifold } from './types';
import { deterministicHash } from './determinism';

export class ChecksumManifoldEngine {
  public static computeObserverChecksum(observers: readonly ObserverConfigRecord[]): string {
    const raw = JSON.stringify(
      observers.map((o) => [o.observerId, o.position, o.target, o.fov, o.certainty])
    );
    return deterministicHash(raw);
  }

  public static computeViewChecksum(view: ViewStateRecord): string {
    const raw = JSON.stringify([view.cameraPosition, view.cameraTarget, view.zoom, view.viewportMode]);
    return deterministicHash(raw);
  }

  public static computeManifold(space: PersonalSpace, exportId = 'LOCAL'): ChecksumManifold {
    const realityChecksum = space.reality.realityChecksum;
    const modelChecksum = space.modelScene.modelChecksum;
    const geometryChecksum = space.geometryScene.sceneChecksum;
    const observerChecksum = this.computeObserverChecksum(space.observers);
    const viewChecksum = this.computeViewChecksum(space.view);
    const spaceChecksum = space.spaceChecksum;

    const exportChecksum = deterministicHash(
      JSON.stringify([
        exportId,
        realityChecksum,
        modelChecksum,
        geometryChecksum,
        observerChecksum,
        viewChecksum,
        spaceChecksum,
      ])
    );

    return Object.freeze({
      realityChecksum,
      modelChecksum,
      geometryChecksum,
      observerChecksum,
      viewChecksum,
      spaceChecksum,
      exportChecksum,
    });
  }
}
