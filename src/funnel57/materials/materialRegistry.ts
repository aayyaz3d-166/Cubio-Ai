/**
 * 3D Memory Studio — Funnel 57
 * Centralized Material Registry with Reference Counting
 */

import * as THREE from 'three';
import { MaterialVocabType, RegisteredMaterial } from '../types';

export class MaterialRegistry {
  private registryMap: Map<string, RegisteredMaterial> = new Map();

  public register(
    id: string,
    type: MaterialVocabType,
    material: THREE.Material
  ): RegisteredMaterial {
    if (this.registryMap.has(id)) {
      throw new Error(`Material with ID '${id}' is already registered.`);
    }

    const record: RegisteredMaterial = {
      id,
      type,
      material,
      referenceCount: 1,
      transparent: material.transparent,
      opacity: material.opacity,
      isDisposed: false,
    };

    this.registryMap.set(id, record);
    return record;
  }

  public get(id: string): RegisteredMaterial | undefined {
    return this.registryMap.get(id);
  }

  public has(id: string): boolean {
    return this.registryMap.has(id);
  }

  public retain(id: string): number {
    const record = this.registryMap.get(id);
    if (!record || record.isDisposed) {
      throw new Error(`Cannot retain non-existent or disposed material '${id}'.`);
    }
    record.referenceCount++;
    return record.referenceCount;
  }

  public release(id: string): number {
    const record = this.registryMap.get(id);
    if (!record) return 0;

    record.referenceCount = Math.max(0, record.referenceCount - 1);
    if (record.referenceCount === 0) {
      this.dispose(id);
      return 0;
    }
    return record.referenceCount;
  }

  public dispose(id: string): boolean {
    const record = this.registryMap.get(id);
    if (record && !record.isDisposed) {
      record.isDisposed = true;
      try {
        record.material.dispose();
      } catch {
        // Safe disposal
      }
      this.registryMap.delete(id);
      return true;
    }
    return false;
  }

  public getAll(): readonly RegisteredMaterial[] {
    return Array.from(this.registryMap.values());
  }

  public get count(): number {
    return this.registryMap.size;
  }

  public disposeAll(): void {
    for (const record of this.registryMap.values()) {
      if (!record.isDisposed) {
        record.isDisposed = true;
        try {
          record.material.dispose();
        } catch {
          // Safe disposal
        }
      }
    }
    this.registryMap.clear();
  }
}
