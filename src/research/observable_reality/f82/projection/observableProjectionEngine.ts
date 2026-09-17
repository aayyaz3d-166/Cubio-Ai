/**
 * 3D Memory Studio — Funnel 82
 * Master Observable Projection Engine
 */

import {
  FullState,
  Observer,
  ObservationBoundary,
  ObservableRepresentation,
  ObservableObject,
  ObservationFrame,
  ObservationFrameObject,
  Coordinate3D,
} from '../types';
import { project4DPointTo3D } from './projectionRules';
import { computeRepresentationHash, computeObservableFrameHash } from './projectionHash';
import {
  isObjectAdmittedByBoundary,
  filterPropertiesByBoundary,
} from '../core/observationBoundary';

export class ObservableProjectionEngine {
  /**
   * Projects a FullState into an ObservableRepresentation according to Observer & Boundary.
   */
  public project(
    fullState: FullState,
    observer: Observer,
    boundaryOverride?: ObservationBoundary
  ): ObservableRepresentation {
    const boundary = boundaryOverride || observer.observationBoundary;
    const observableObjects: ObservableObject[] = [];

    for (const fullObj of fullState.objects) {
      if (observableObjects.length >= boundary.maximumObjects) {
        break;
      }

      // 1. Boundary filter check
      if (!isObjectAdmittedByBoundary(fullObj, boundary)) {
        continue;
      }

      // 2. Mathematical 4D -> 3D projection
      const { position, visible, apparentScale, opacity } = project4DPointTo3D(
        fullObj.coordinates,
        observer
      );

      if (!visible) {
        continue;
      }

      // 3. Filter properties (strictly exclude hidden fields)
      const filteredProps = filterPropertiesByBoundary(fullObj.internalMetadata, boundary);

      // Optional explicit debug W flag (only if boundary explicitly permits)
      const visibleProps = {
        ...filteredProps,
        ...(boundary.exposeWDimension ? { _debugExposedW: fullObj.coordinates[3] } : {}),
      };

      observableObjects.push(
        Object.freeze({
          objectId: fullObj.objectId,
          entityType: fullObj.entityType,
          projectedPosition: position,
          visibleProperties: Object.freeze(visibleProps),
          visibleGeometry: Object.freeze({
            shape: 'SPHERE',
            apparentScale,
            opacity,
          }),
          isVisible: true,
        })
      );
    }

    // Stable deterministic sorting
    const sortedObservable = Object.freeze(
      [...observableObjects].sort((a, b) => a.objectId.localeCompare(b.objectId))
    );

    const frameHash = computeRepresentationHash(
      fullState.stateId,
      fullState.stateHash,
      observer.observerId,
      observer.projectionType,
      sortedObservable
    );

    const representationId = `REP_${fullState.stateId}_OBS_${observer.observerId}_F${fullState.frameIndex}`;

    return Object.freeze({
      representationId,
      sourceStateId: fullState.stateId,
      sourceStateHash: fullState.stateHash,
      observerId: observer.observerId,
      projectionType: observer.projectionType,
      observableObjects: sortedObservable,
      underlyingDimension: fullState.dimension,
      observableDimension: observer.dimension,
      frameHash,
      determinismHash: frameHash,
      timestamp: fullState.timestamp,
      frameIndex: fullState.frameIndex,
    });
  }

  /**
   * Renders an ObservableRepresentation into an ObservationFrame.
   */
  public renderFrame(
    representation: ObservableRepresentation,
    observer: Observer
  ): ObservationFrame {
    const frameObjects: ObservationFrameObject[] = [];
    const positionsMap: Record<string, Coordinate3D> = {};
    let totalScale = 0;

    for (const obj of representation.observableObjects) {
      if (!obj.isVisible) continue;

      const frameObj: ObservationFrameObject = Object.freeze({
        id: obj.objectId,
        position: obj.projectedPosition,
        geometryRepresentation: `${obj.visibleGeometry.shape}_SCALE_${obj.visibleGeometry.apparentScale.toFixed(2)}`,
        visibleProperties: obj.visibleProperties,
        apparentScale: obj.visibleGeometry.apparentScale,
      });

      frameObjects.push(frameObj);
      positionsMap[obj.objectId] = obj.projectedPosition;
      totalScale += obj.visibleGeometry.apparentScale;
    }

    const sortedFrameObjects = Object.freeze(
      [...frameObjects].sort((a, b) => a.id.localeCompare(b.id))
    );

    const frameId = `FRAME_${representation.frameIndex}_OBS_${observer.observerId}`;
    const frameHash = computeObservableFrameHash(
      frameId,
      observer.observerId,
      representation.frameHash,
      representation.frameIndex,
      sortedFrameObjects
    );

    return Object.freeze({
      frameId,
      observerId: observer.observerId,
      sourceRepresentationHash: representation.frameHash,
      timestamp: representation.timestamp,
      frameIndex: representation.frameIndex,
      visibleObjects: sortedFrameObjects,
      projectedPositions: Object.freeze(positionsMap),
      visualState: Object.freeze({
        objectCount: sortedFrameObjects.length,
        activeProjection: representation.projectionType,
        totalVisibleScale: Number(totalScale.toFixed(4)),
      }),
      frameHash,
    });
  }
}
