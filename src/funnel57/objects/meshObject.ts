/**
 * 3D Memory Studio — Funnel 57
 * Base Mesh Object Wrapper
 */

import * as THREE from 'three';
import { IMeshObject } from '../types';
import { ISceneObject } from '../../funnel56/types';

export abstract class BaseMeshObject implements IMeshObject {
  public readonly id: string;
  public readonly threeObject: THREE.Object3D;
  public readonly sourceSceneObject?: ISceneObject;
  protected isDisposed = false;

  constructor(id: string, threeObject: THREE.Object3D, sourceSceneObject?: ISceneObject) {
    this.id = id;
    this.threeObject = threeObject;
    this.sourceSceneObject = sourceSceneObject;
  }

  public get visible(): boolean {
    return this.threeObject.visible;
  }

  public set visible(val: boolean) {
    this.threeObject.visible = val;
  }

  public update(_deltaMs: number, _timeMs: number): void {
    // Base per-frame update
  }

  public syncFromSceneObject(sceneObj: ISceneObject): void {
    const [wx, wy, wz] = sceneObj.worldTransform.position;
    const [rx, ry, rz] = sceneObj.worldTransform.rotation;
    const [sx, sy, sz] = sceneObj.worldTransform.scale;

    this.threeObject.position.set(wx, wy, wz);
    this.threeObject.rotation.set(rx, ry, rz);
    this.threeObject.scale.set(sx, sy, sz);
    this.threeObject.visible = sceneObj.visible && sceneObj.enabled;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
  }
}
