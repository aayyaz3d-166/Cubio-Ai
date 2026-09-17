/**
 * 3D Memory Studio — Funnel 56
 * Base Scene Object Implementation
 */

import {
  ISceneObject,
  SceneObjectType,
  SceneLayerId,
  Transform3D,
  WorldTransform3D,
  SceneObjectMetadata,
} from '../types';
import { createDefaultTransform, createDefaultWorldTransform, computeWorldTransform } from '../transform/transform';
import { DimensionalInformationState } from '../../funnel49/types';

export abstract class BaseSceneObject implements ISceneObject {
  public readonly id: string;
  public readonly type: SceneObjectType;
  public parentId: string | null = null;
  private childList: ISceneObject[] = [];
  public visible = true;
  public enabled = true;
  public layerId: SceneLayerId;
  public transform: Transform3D;
  public worldTransform: WorldTransform3D;
  public opacity = 1.0;
  public metadata: SceneObjectMetadata = {};

  public readonly classification?: 'GREEN' | 'RED';
  public readonly stateId?: string;
  public readonly recordId?: string;
  public readonly checksum?: string;
  public readonly sourceState?: DimensionalInformationState;

  protected isDisposed = false;

  constructor(
    id: string,
    type: SceneObjectType,
    layerId: SceneLayerId,
    initialTransform?: Partial<Transform3D>
  ) {
    this.id = id;
    this.type = type;
    this.layerId = layerId;
    this.transform = createDefaultTransform(
      initialTransform?.position,
      initialTransform?.rotation,
      initialTransform?.scale
    );
    this.worldTransform = createDefaultWorldTransform();
  }

  public get children(): readonly ISceneObject[] {
    return this.childList;
  }

  public addChild(child: ISceneObject): void {
    if (this.isDisposed) return;
    child.parentId = this.id;
    this.childList.push(child);
  }

  public removeChild(childId: string): boolean {
    const index = this.childList.findIndex((c) => c.id === childId);
    if (index !== -1) {
      const child = this.childList[index];
      child.parentId = null;
      child.dispose();
      this.childList.splice(index, 1);
      return true;
    }
    return false;
  }

  public getChild(childId: string): ISceneObject | undefined {
    return this.childList.find((c) => c.id === childId);
  }

  public update(
    deltaMs: number,
    timeMs: number,
    parentWorldTransform?: WorldTransform3D
  ): void {
    if (!this.enabled || this.isDisposed) return;

    this.worldTransform = computeWorldTransform(this.transform, parentWorldTransform);

    for (const child of this.childList) {
      child.update(deltaMs, timeMs, this.worldTransform);
    }
  }

  public render(context: unknown): void {
    if (!this.visible || !this.enabled || this.isDisposed) return;
    this.onRender(context);
    for (const child of this.childList) {
      child.render(context);
    }
  }

  protected abstract onRender(context: unknown): void;

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const child of this.childList) {
      child.dispose();
    }
    this.childList = [];
  }

  public get disposed(): boolean {
    return this.isDisposed;
  }
}
