/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-06: Storage Repository Interfaces
 *
 * Decouples storage persistence from in-memory test stores and future distributed disk/cloud CAS.
 */

import {
  DataBlock,
  StorageObject,
  StorageBucket,
} from '../types';

export interface IStorageRepository {
  // CAS Blocks
  saveBlock(block: DataBlock): Promise<void>;
  getBlock(blockHash: string): Promise<DataBlock | undefined>;
  hasBlock(blockHash: string): Promise<boolean>;
  deleteBlock(blockHash: string): Promise<boolean>;

  // Storage Objects
  saveObject(object: StorageObject): Promise<void>;
  getObject(objectId: string): Promise<StorageObject | undefined>;
  getObjectByPath(ownerCubId: string, path: string): Promise<StorageObject | undefined>;
  getObjectsByOwner(ownerCubId: string, bucketId?: string): Promise<readonly StorageObject[]>;
  deleteObject(objectId: string): Promise<boolean>;

  // Storage Buckets
  saveBucket(bucket: StorageBucket): Promise<void>;
  getBucket(bucketId: string): Promise<StorageBucket | undefined>;
  getBucketByName(ownerCubId: string, name: string): Promise<StorageBucket | undefined>;
  getBucketsByOwner(ownerCubId: string): Promise<readonly StorageBucket[]>;
  deleteBucket(bucketId: string): Promise<boolean>;

  // Metrics
  getStorageUsage(ownerCubId: string): Promise<{ totalBytes: number; objectCount: number; bucketCount: number }>;
}
