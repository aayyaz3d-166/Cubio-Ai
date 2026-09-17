/**
 * 3D Memory Studio — Funnel 55
 * Scene Layer Abstraction
 */

import { SceneLayer, SceneLayerId, RenderableObject } from '../types';

export class MemorySceneLayer implements SceneLayer {
  public readonly id: SceneLayerId;
  public readonly name: string;
  public visible = true;
  public opacity = 1.0;
  private objectMap: Map<string, RenderableObject> = new Map();
  private isDisposed = false;

  constructor(id: SceneLayerId, name: string) {
    this.id = id;
    this.name = name;
  }

  public get objects(): readonly RenderableObject[] {
    return Array.from(this.objectMap.values());
  }

  public addObject(obj: RenderableObject): void {
    if (this.isDisposed) return;
    this.objectMap.set(obj.id, obj);
  }

  public removeObject(objId: string): void {
    const obj = this.objectMap.get(objId);
    if (obj) {
      obj.dispose();
      this.objectMap.delete(objId);
    }
  }

  public clear(): void {
    for (const obj of this.objectMap.values()) {
      obj.dispose();
    }
    this.objectMap.clear();
  }

  public update(deltaMs: number, timeMs: number): void {
    if (!this.visible || this.isDisposed) return;
    for (const obj of this.objectMap.values()) {
      if (obj.visible) {
        obj.update(deltaMs, timeMs);
      }
    }
  }

  public render(context: unknown): void {
    if (!this.visible || this.isDisposed) return;
    for (const obj of this.objectMap.values()) {
      if (obj.visible) {
        obj.render(context);
      }
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clear();
  }
}
