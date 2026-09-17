/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Geometry Mutation Bridge
 *
 * Coordinates real geometric mutations (e.g. +X, +Y, +Z nudges, coordinate updates, reset).
 * Recomputes P6.6 mesh vertices, bounding boxes, object checksums, and scene checksums deterministically.
 */

import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
} from './types';
import {
  computeObjectChecksum,
  computeSceneChecksum,
} from './determinism';
import { AdvancedGeometryObject, AdvancedMesh3D } from '../p66/types';

export class GeometryMutationBridge {
  public static nudgeObjectCoordinates(
    scene: WorkspaceBoundGeometryScene,
    objectId: string,
    axis: 'X' | 'Y' | 'Z',
    delta: number
  ): {
    updatedScene: WorkspaceBoundGeometryScene;
    mutatedObject: WorkspaceBoundGeometryObject;
  } {
    const targetIndex = scene.objects.findIndex((o) => o.objectId === objectId);
    if (targetIndex < 0) {
      throw new Error(`Target object ${objectId} not found in scene ${scene.sceneId}`);
    }

    const currentObj = scene.objects[targetIndex];
    const [cx, cy, cz] = currentObj.coordinates;
    const [dx, dy, dz] =
      axis === 'X'
        ? [delta, 0, 0]
        : axis === 'Y'
        ? [0, delta, 0]
        : [0, 0, delta];

    const newCoordinates: [number, number, number] = [
      Number((cx + dx).toFixed(4)),
      Number((cy + dy).toFixed(4)),
      Number((cz + dz).toFixed(4)),
    ];

    return GeometryMutationBridge.updateObjectCoordinates(scene, objectId, newCoordinates);
  }

  public static updateObjectCoordinates(
    scene: WorkspaceBoundGeometryScene,
    objectId: string,
    newCoordinates: readonly [number, number, number]
  ): {
    updatedScene: WorkspaceBoundGeometryScene;
    mutatedObject: WorkspaceBoundGeometryObject;
  } {
    const targetIndex = scene.objects.findIndex((o) => o.objectId === objectId);
    if (targetIndex < 0) {
      throw new Error(`Target object ${objectId} not found in scene ${scene.sceneId}`);
    }

    const currentObj = scene.objects[targetIndex];
    const [oldX, oldY, oldZ] = currentObj.coordinates;
    const [newX, newY, newZ] = newCoordinates;
    const shiftX = newX - oldX;
    const shiftY = newY - oldY;
    const shiftZ = newZ - oldZ;

    // Shift mesh vertices
    const oldMesh = currentObj.p66Object.mesh;
    const updatedVertices = oldMesh.vertices.map((v) => [
      Number((v[0] + shiftX).toFixed(4)),
      Number((v[1] + shiftY).toFixed(4)),
      Number((v[2] + shiftZ).toFixed(4)),
    ] as const);

    const oldMin = currentObj.bounds.min;
    const oldMax = currentObj.bounds.max;
    const newBounds = {
      min: [
        Number((oldMin[0] + shiftX).toFixed(4)),
        Number((oldMin[1] + shiftY).toFixed(4)),
        Number((oldMin[2] + shiftZ).toFixed(4)),
      ] as const,
      max: [
        Number((oldMax[0] + shiftX).toFixed(4)),
        Number((oldMax[1] + shiftY).toFixed(4)),
        Number((oldMax[2] + shiftZ).toFixed(4)),
      ] as const,
    };

    const newChecksum = computeObjectChecksum({
      objectId: currentObj.objectId,
      name: currentObj.name,
      geometryType: currentObj.geometryType,
      coordinates: newCoordinates,
      dimensions: currentObj.dimensions,
      bounds: newBounds,
    });

    const updatedMesh: AdvancedMesh3D = Object.freeze({
      ...oldMesh,
      vertices: Object.freeze(updatedVertices),
      bounds: Object.freeze({
        min: newBounds.min,
        max: newBounds.max,
        dimensions: oldMesh.bounds.dimensions,
      }),
      checksum: newChecksum,
    });

    const updatedP66Obj: AdvancedGeometryObject = Object.freeze({
      ...currentObj.p66Object,
      mesh: updatedMesh,
      geometryChecksum: newChecksum,
    });

    const mutatedObject: WorkspaceBoundGeometryObject = Object.freeze({
      ...currentObj,
      coordinates: newCoordinates,
      bounds: newBounds,
      p66Object: updatedP66Obj,
      geometryChecksum: newChecksum,
    });

    const updatedObjects = [...scene.objects];
    updatedObjects[targetIndex] = mutatedObject;

    const newSceneChecksum = computeSceneChecksum(scene.sceneId, scene.spaceId, updatedObjects);

    const updatedScene: WorkspaceBoundGeometryScene = Object.freeze({
      ...scene,
      objects: Object.freeze(updatedObjects),
      sceneChecksum: newSceneChecksum,
      updatedAt: Date.now(),
    });

    return {
      updatedScene,
      mutatedObject,
    };
  }
}
