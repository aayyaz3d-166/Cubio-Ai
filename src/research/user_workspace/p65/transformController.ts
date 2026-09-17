/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Transform Controller
 *
 * Provides validated, finite 3D transformations (position, rotation, scale) for model objects.
 */

import { ModelObject3D, ModelScene3D } from './types';
import { deterministicHash } from './determinism';

export class TransformController {
  public static validateVector3(v: unknown): v is [number, number, number] {
    if (!Array.isArray(v) || v.length !== 3) return false;
    return v.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n));
  }

  public static validateScale(s: unknown): s is [number, number, number] {
    if (!this.validateVector3(s)) return false;
    return s.every((val) => val > 0 && val <= 100);
  }

  public static moveObject(
    scene: ModelScene3D,
    modelObjectId: string,
    newPosition: [number, number, number]
  ): ModelScene3D {
    if (!this.validateVector3(newPosition)) {
      throw new Error(`Invalid position vector: [${newPosition}]`);
    }

    const updated = scene.objects.map((o) => {
      if (o.modelObjectId !== modelObjectId) return o;
      return {
        ...o,
        transform: {
          ...o.transform,
          position: Object.freeze([...newPosition] as [number, number, number]),
        },
        mutationCount: o.mutationCount + 1,
      };
    });

    return this.recomputeScene(scene, updated);
  }

  public static rotateObject(
    scene: ModelScene3D,
    modelObjectId: string,
    newRotation: [number, number, number]
  ): ModelScene3D {
    if (!this.validateVector3(newRotation)) {
      throw new Error(`Invalid rotation vector: [${newRotation}]`);
    }

    const updated = scene.objects.map((o) => {
      if (o.modelObjectId !== modelObjectId) return o;
      return {
        ...o,
        transform: {
          ...o.transform,
          rotation: Object.freeze([...newRotation] as [number, number, number]),
        },
        mutationCount: o.mutationCount + 1,
      };
    });

    return this.recomputeScene(scene, updated);
  }

  public static scaleObject(
    scene: ModelScene3D,
    modelObjectId: string,
    newScale: [number, number, number]
  ): ModelScene3D {
    if (!this.validateScale(newScale)) {
      throw new Error(`Invalid scale vector: [${newScale}] (must be finite and > 0)`);
    }

    const updated = scene.objects.map((o) => {
      if (o.modelObjectId !== modelObjectId) return o;
      return {
        ...o,
        transform: {
          ...o.transform,
          scale: Object.freeze([...newScale] as [number, number, number]),
        },
        mutationCount: o.mutationCount + 1,
      };
    });

    return this.recomputeScene(scene, updated);
  }

  private static recomputeScene(scene: ModelScene3D, objects: ModelObject3D[]): ModelScene3D {
    const modelHashContent = JSON.stringify(
      objects.map((o) => [
        o.modelObjectId,
        o.transform.position,
        o.transform.rotation,
        o.transform.scale,
        o.geometry.geometryChecksum,
        o.visible,
      ])
    );
    const modelChecksum = deterministicHash(modelHashContent);
    const sceneChecksum = deterministicHash(JSON.stringify([scene.sourceRealityChecksum, modelChecksum]));

    return Object.freeze({
      ...scene,
      objects: Object.freeze(objects),
      modelChecksum,
      sceneChecksum,
    });
  }
}
