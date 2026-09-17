/**
 * 3D Memory Studio — Funnel 57
 * Centralized Geometry Registry with Reference Counting
 */

import * as THREE from 'three';
import { GeometryType, RegisteredGeometry } from '../types';

export class GeometryRegistry {
  private registryMap: Map<string, RegisteredGeometry> = new Map();

  public register(
    id: string,
    type: GeometryType,
    geometry: THREE.BufferGeometry
  ): RegisteredGeometry {
    if (this.registryMap.has(id)) {
      throw new Error(`Geometry with ID '${id}' is already registered.`);
    }

    const posAttr = geometry.getAttribute('position');
    const vertexCount = posAttr ? posAttr.count : 0;
    const indexCount = geometry.index ? geometry.index.count : 0;
    // 32 bytes per vertex estimate (pos, normal, uv)
    const memoryEstimateBytes = vertexCount * 32 + indexCount * 4;

    const record: RegisteredGeometry = {
      id,
      type,
      geometry,
      vertexCount,
      indexCount,
      referenceCount: 1,
      memoryEstimateBytes,
      isDisposed: false,
    };

    this.registryMap.set(id, record);
    return record;
  }

  public get(id: string): RegisteredGeometry | undefined {
    return this.registryMap.get(id);
  }

  public has(id: string): boolean {
    return this.registryMap.has(id);
  }

  public retain(id: string): number {
    const record = this.registryMap.get(id);
    if (!record || record.isDisposed) {
      throw new Error(`Cannot retain non-existent or disposed geometry '${id}'.`);
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
        record.geometry.dispose();
      } catch {
        // Safe disposal swallow
      }
      this.registryMap.delete(id);
      return true;
    }
    return false;
  }

  public getAll(): readonly RegisteredGeometry[] {
    return Array.from(this.registryMap.values());
  }

  public get count(): number {
    return this.registryMap.size;
  }

  public get totalVertices(): number {
    let sum = 0;
    for (const record of this.registryMap.values()) {
      sum += record.vertexCount;
    }
    return sum;
  }

  public get totalMemoryBytes(): number {
    let sum = 0;
    for (const record of this.registryMap.values()) {
      sum += record.memoryEstimateBytes;
    }
    return sum;
  }

  public disposeAll(): void {
    for (const record of this.registryMap.values()) {
      if (!record.isDisposed) {
        record.isDisposed = true;
        try {
          record.geometry.dispose();
        } catch {
          // Safe disposal
        }
      }
    }
    this.registryMap.clear();
  }
}
