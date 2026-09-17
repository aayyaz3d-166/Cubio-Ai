/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Stale State Engine
 *
 * Detects synchronization state between constructed geometry and upstream Reality authority.
 * Invariant: Stale geometry cannot silently overwrite newly updated Reality states.
 */

import {
  GeometryStaleState,
  GeometryBindingState,
  WorkspaceGeometry,
} from './types';

export class R9StaleStateEngine {
  /**
   * Checks whether a geometry reference has become stale compared to current Reality checksum.
   */
  public static checkGeometryStaleState(
    geometry: WorkspaceGeometry,
    currentRealityChecksum: string
  ): GeometryStaleState {
    if (!geometry.realityReference) {
      return 'SYNCED'; // Purely constructed geometry without reality reference
    }

    if (geometry.realityReference.realityChecksum === currentRealityChecksum) {
      return 'SYNCED';
    }

    return 'STALE';
  }

  /**
   * Evaluates overall binding state across all geometries.
   */
  public static evaluateBindingState(
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    currentRealityChecksum: string,
    currentWorkspaceChecksum: string,
    currentGeometryChecksum: string
  ): GeometryBindingState {
    let hasStale = false;

    for (const geo of Object.values(geometries)) {
      if (this.checkGeometryStaleState(geo, currentRealityChecksum) === 'STALE') {
        hasStale = true;
        break;
      }
    }

    return Object.freeze({
      isBound: true,
      realityStateChecksum: currentRealityChecksum,
      workspaceChecksum: currentWorkspaceChecksum,
      geometryChecksum: currentGeometryChecksum,
      staleState: hasStale ? 'STALE' : 'SYNCED',
    });
  }

  /**
   * Resyncs a geometry's reality reference to the new authoritative reality state.
   */
  public static resyncGeometry(
    geometry: WorkspaceGeometry,
    newRealityChecksum: string,
    newRealityCoordinates?: readonly [number, number, number]
  ): WorkspaceGeometry {
    if (!geometry.realityReference) {
      return geometry;
    }

    const updatedRealityRef = Object.freeze({
      ...geometry.realityReference,
      realityChecksum: newRealityChecksum,
      realityCoordinates: newRealityCoordinates ?? geometry.realityReference.realityCoordinates,
    });

    return Object.freeze({
      ...geometry,
      realityReference: updatedRealityRef,
      lineage: Object.freeze({
        ...geometry.lineage,
        version: geometry.lineage.version + 1,
      }),
    });
  }
}
