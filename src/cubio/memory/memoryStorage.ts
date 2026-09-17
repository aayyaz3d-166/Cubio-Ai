/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Content-Addressable Virtual Memory Store
 *
 * Backing storage layer holding raw payloads uncoupled from RAM cache.
 * Implements deterministic Content-Addressable Storage (CAS).
 */

import { deterministicHash } from '../state/determinism';

export class CubiOMemoryStore {
  private store: Map<string, string> = new Map(); // cid -> serialized JSON payload

  public put(payload: any): { cid: string; sizeBytes: number; checksum: string } {
    const serialized = JSON.stringify(payload);
    const checksum = deterministicHash(serialized);
    const cid = `QmCubiOMem_${checksum.slice(2, 18)}`;
    const sizeBytes = new Blob ? new Blob([serialized]).size : serialized.length * 2;

    this.store.set(cid, serialized);
    return { cid, sizeBytes, checksum };
  }

  public get<T = any>(cid: string): T | null {
    const serialized = this.store.get(cid);
    if (!serialized) return null;
    try {
      return JSON.parse(serialized) as T;
    } catch {
      return null;
    }
  }

  public has(cid: string): boolean {
    return this.store.has(cid);
  }

  public delete(cid: string): boolean {
    return this.store.delete(cid);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}
