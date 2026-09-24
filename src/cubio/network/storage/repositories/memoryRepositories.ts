/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-06: In-Memory Storage Repository
 *
 * Implements thread-safe in-memory stores for content-addressable blocks,
 * storage objects, and buckets.
 */

import {
  DataBlock,
  StorageObject,
  StorageBucket,
} from '../types';
import { IStorageRepository } from './types';

export class MemoryStorageRepository implements IStorageRepository {
  private blocks: Map<string, DataBlock> = new Map(); // blockHash -> DataBlock (Deduplicated CAS)
  private objects: Map<string, StorageObject> = new Map(); // objectId -> StorageObject
  private buckets: Map<string, StorageBucket> = new Map(); // bucketId -> StorageBucket

  // --- CAS BLOCKS ---

  public async saveBlock(block: DataBlock): Promise<void> {
    if (!this.blocks.has(block.blockHash)) {
      this.blocks.set(block.blockHash, Object.freeze({ ...block }));
    }
  }

  public async getBlock(blockHash: string): Promise<DataBlock | undefined> {
    return this.blocks.get(blockHash);
  }

  public async hasBlock(blockHash: string): Promise<boolean> {
    return this.blocks.has(blockHash);
  }

  public async deleteBlock(blockHash: string): Promise<boolean> {
    return this.blocks.delete(blockHash);
  }

  // --- STORAGE OBJECTS ---

  public async saveObject(object: StorageObject): Promise<void> {
    this.objects.set(object.objectId, Object.freeze({ ...object }));
  }

  public async getObject(objectId: string): Promise<StorageObject | undefined> {
    return this.objects.get(objectId);
  }

  public async getObjectByPath(ownerCubId: string, path: string): Promise<StorageObject | undefined> {
    const cleanPath = path.trim().toLowerCase();
    for (const obj of this.objects.values()) {
      if (obj.ownerCubId === ownerCubId && obj.path.toLowerCase() === cleanPath) {
        return obj;
      }
    }
    return undefined;
  }

  public async getObjectsByOwner(ownerCubId: string, bucketId?: string): Promise<readonly StorageObject[]> {
    const results: StorageObject[] = [];
    for (const obj of this.objects.values()) {
      if (obj.ownerCubId === ownerCubId) {
        if (!bucketId || obj.bucketId === bucketId) {
          results.push(obj);
        }
      }
    }
    return Object.freeze(results);
  }

  public async deleteObject(objectId: string): Promise<boolean> {
    return this.objects.delete(objectId);
  }

  // --- STORAGE BUCKETS ---

  public async saveBucket(bucket: StorageBucket): Promise<void> {
    this.buckets.set(bucket.bucketId, Object.freeze({ ...bucket }));
  }

  public async getBucket(bucketId: string): Promise<StorageBucket | undefined> {
    return this.buckets.get(bucketId);
  }

  public async getBucketByName(ownerCubId: string, name: string): Promise<StorageBucket | undefined> {
    const cleanName = name.trim().toLowerCase();
    for (const bkt of this.buckets.values()) {
      if (bkt.ownerCubId === ownerCubId && bkt.name.toLowerCase() === cleanName) {
        return bkt;
      }
    }
    return undefined;
  }

  public async getBucketsByOwner(ownerCubId: string): Promise<readonly StorageBucket[]> {
    const results: StorageBucket[] = [];
    for (const bkt of this.buckets.values()) {
      if (bkt.ownerCubId === ownerCubId) {
        results.push(bkt);
      }
    }
    return Object.freeze(results);
  }

  public async deleteBucket(bucketId: string): Promise<boolean> {
    return this.buckets.delete(bucketId);
  }

  // --- USAGE METRICS ---

  public async getStorageUsage(
    ownerCubId: string
  ): Promise<{ totalBytes: number; objectCount: number; bucketCount: number }> {
    let totalBytes = 0;
    let objectCount = 0;
    let bucketCount = 0;

    for (const obj of this.objects.values()) {
      if (obj.ownerCubId === ownerCubId) {
        totalBytes += obj.sizeBytes;
        objectCount++;
      }
    }

    for (const bkt of this.buckets.values()) {
      if (bkt.ownerCubId === ownerCubId) {
        bucketCount++;
      }
    }

    return { totalBytes, objectCount, bucketCount };
  }
}
