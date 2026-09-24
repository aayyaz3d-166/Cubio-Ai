/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-06: CubiO Storage / Data (Types & Models)
 *
 * Formal specification for sovereign content-addressable storage (CAS),
 * storage objects, buckets, access control, quotas, and CNC storage integration.
 *
 * ARCHITECTURAL INVARIANT:
 * - Storage objects strictly belong to sovereign CUB-XXXXXXXX identities (NET-01).
 * - All storage operations route across canonical NET-00 CNC coordinates (CUBIO://NETWORK/<dim>/<zone>/<node>/STORAGE).
 * - Read/Write access is enforced via NET-03 authorization and object-level ACLs.
 * - Quotas are governed by NET-04 account tiers.
 * - Private credentials and secrets are NEVER exposed in storage metadata.
 */

export type StorageVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export type EncryptionAlgorithm = 'NONE' | 'AES-GCM-256' | 'CHACHA20-POLY1305';

/**
 * Low-level Content-Addressable Storage (CAS) Block
 */
export interface DataBlock {
  readonly blockHash: string; // BLK_... (Content hash)
  readonly data: Uint8Array | string;
  readonly sizeBytes: number;
  readonly mimeType?: string;
  readonly createdAt: number;
}

/**
 * Access Control Specification for Storage Objects
 */
export interface StorageAccessControl {
  readonly visibility: StorageVisibility;
  readonly allowedCubIds: readonly string[]; // Sovereign CUB-XXXXXXXX IDs granted access
  readonly readOnly?: boolean;
}

/**
 * Sovereign Storage Object Record
 */
export interface StorageObject {
  readonly objectId: string; // OBJ_...
  readonly name: string;
  readonly path: string; // e.g. "/models/avatar.3dm" or "avatar.3dm"
  readonly bucketId?: string; // Optional parent bucket
  readonly ownerCubId: string; // Sovereign CUB-XXXXXXXX from NET-01
  readonly blockHashes: readonly string[]; // Ordered CAS block references
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly encryptionAlgorithm: EncryptionAlgorithm;
  readonly accessControl: StorageAccessControl;
  readonly coordinateUri: string; // Destination NET-00 Coordinate
  readonly version: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

/**
 * Sovereign Storage Bucket (Virtual Container)
 */
export interface StorageBucket {
  readonly bucketId: string; // BKT_...
  readonly name: string;
  readonly ownerCubId: string; // Sovereign CUB-XXXXXXXX
  readonly quotaBytes: number;
  readonly usedBytes: number;
  readonly objectCount: number;
  readonly coordinateUri: string; // NET-00 Canonical URI
  readonly isEncrypted: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Aggregated Storage Metrics per Sovereign Identity
 */
export interface StorageMetrics {
  readonly cubId: string;
  readonly tier: string;
  readonly quotaBytes: number;
  readonly usedBytes: number;
  readonly availableBytes: number;
  readonly usagePercent: number;
  readonly objectCount: number;
  readonly bucketCount: number;
}

/**
 * Input for putting / writing a storage object
 */
export interface PutObjectInput {
  readonly name: string;
  readonly path?: string;
  readonly bucketId?: string;
  readonly data: Uint8Array | string;
  readonly mimeType?: string;
  readonly encryptionAlgorithm?: EncryptionAlgorithm;
  readonly visibility?: StorageVisibility;
  readonly allowedCubIds?: readonly string[];
  readonly coordinateUri?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Result of retrieving a storage object
 */
export interface GetObjectResult {
  readonly object: StorageObject;
  readonly data: Uint8Array | string;
  readonly reconstructedFromBlocks: number;
  readonly verifiedIntegrity: boolean;
}

/**
 * Input for creating a storage bucket
 */
export interface CreateBucketInput {
  readonly name: string;
  readonly quotaBytes?: number;
  readonly isEncrypted?: boolean;
  readonly coordinateUri?: string;
}

/**
 * Input for sharing a storage object
 */
export interface ShareObjectInput {
  readonly objectId: string;
  readonly targetCubIdOrAddress: string; // Supports CUB-ID or @omail.com / @cubio.com
  readonly readOnly?: boolean;
}
