/**
 * 3D Memory Studio — Funnel 55
 * Centralized GPU Resource Registry
 *
 * Tracks and deterministically disposes of GPU buffers, textures, geometries, and materials.
 */

import { DisposableResource } from '../types';

export class RendererResourceRegistry {
  private resources: Map<string, DisposableResource> = new Map();
  private isDisposed = false;

  public registerResource(
    id: string,
    type: DisposableResource['type'],
    disposeFn: () => void
  ): DisposableResource {
    if (this.isDisposed) {
      throw new Error(`Cannot register resource '${id}' on a disposed registry.`);
    }

    // If an existing resource is present with this ID, dispose it first to avoid memory leaks
    const existing = this.resources.get(id);
    if (existing && !existing.isDisposed) {
      existing.dispose();
    }

    let disposed = false;
    const resource: DisposableResource = {
      id,
      type,
      dispose: () => {
        if (!disposed) {
          disposed = true;
          try {
            disposeFn();
          } catch {
            // Safe swallow on resource disposal
          }
          this.resources.delete(id);
        }
      },
      get isDisposed() {
        return disposed;
      },
    };

    this.resources.set(id, resource);
    return resource;
  }

  public releaseResource(id: string): boolean {
    const resource = this.resources.get(id);
    if (resource) {
      resource.dispose();
      return true;
    }
    return false;
  }

  public getActiveCount(): number {
    return this.resources.size;
  }

  public getAllResources(): readonly DisposableResource[] {
    return Array.from(this.resources.values());
  }

  public disposeAll(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    for (const resource of this.resources.values()) {
      if (!resource.isDisposed) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}
