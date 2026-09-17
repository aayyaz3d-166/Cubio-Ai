/**
 * 3D Memory Studio — Funnel 56
 * Transform Hierarchy System
 */

import { ISceneObject, WorldTransform3D } from '../types';
import { computeWorldTransform } from './transform';

export class TransformSystem {
  public static updateObjectTransform(
    obj: ISceneObject,
    parentWorldTransform?: WorldTransform3D
  ): void {
    obj.worldTransform = computeWorldTransform(obj.transform, parentWorldTransform);

    for (const child of obj.children) {
      this.updateObjectTransform(child, obj.worldTransform);
    }
  }
}
