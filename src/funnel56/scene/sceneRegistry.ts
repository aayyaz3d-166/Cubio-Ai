/**
 * 3D Memory Studio — Funnel 56
 * Centralized Scene Registry
 *
 * Enforces ID uniqueness and tracks all registered scene objects.
 */

import { ISceneObject, SceneObjectType } from '../types';

export class SceneRegistry {
  private objectMap: Map<string, ISceneObject> = new Map();

  public register(obj: ISceneObject): void {
    if (this.objectMap.has(obj.id)) {
      throw new Error(`Scene object with ID '${obj.id}' is already registered in SceneRegistry.`);
    }
    this.objectMap.set(obj.id, obj);
  }

  public unregister(id: string): boolean {
    const obj = this.objectMap.get(id);
    if (obj) {
      this.objectMap.delete(id);
      return true;
    }
    return false;
  }

  public get(id: string): ISceneObject | undefined {
    return this.objectMap.get(id);
  }

  public has(id: string): boolean {
    return this.objectMap.has(id);
  }

  public getAll(): readonly ISceneObject[] {
    return Array.from(this.objectMap.values());
  }

  public getByType(type: SceneObjectType): readonly ISceneObject[] {
    return Array.from(this.objectMap.values()).filter((obj) => obj.type === type);
  }

  public get count(): number {
    return this.objectMap.size;
  }

  public clear(): void {
    this.objectMap.clear();
  }
}
