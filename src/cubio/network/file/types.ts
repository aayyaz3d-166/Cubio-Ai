/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-13: CubiO File / Object Network (Types & Models)
 *
 * Formal specification for sovereign file/object metadata, hierarchical namespaces,
 * multi-versioning, ACL access control, replaceable storage backends, and lifecycle states.
 *
 * ARCHITECTURAL INVARIANT:
 * - Files are bound to sovereign owner CUB-XXXXXXXX identities (NET-01).
 * - Physical storage backend is abstracted and replaceable (via IStorageBackend).
 * - Access control combines NET-03 RBAC with granular per-file ACL entries.
 * - Integrity is verified on every retrieval against cryptographic CAS block hashes.
 */

export type FileVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export type FileStatus = 'ACTIVE' | 'TRASHED' | 'ARCHIVED' | 'PURGED';

export type FilePermission = 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';

export interface FileAclEntry {
  readonly recipientInput: string; // CUB-XXXXXXXX or @omail.com/@cubio.com
  readonly resolvedCubId: string; // Authoritative CUB-XXXXXXXX
  readonly permissions: readonly FilePermission[];
  readonly grantedAt: number;
  readonly grantedBy: string; // Granter CUB-XXXXXXXX
}

export interface FileVersion {
  readonly versionId: string; // VER_...
  readonly versionNumber: number; // 1, 2, 3...
  readonly casBlockHash: string; // BLK_...
  readonly storageObjectId: string; // OBJ_...
  readonly sizeBytes: number;
  readonly checksum: string; // SHA-256 / deterministic hash
  readonly mimeType: string;
  readonly createdAt: number;
  readonly createdBy: string; // CUB-XXXXXXXX
  readonly changeNote?: string;
}

export interface FileRecord {
  readonly fileId: string; // FILE_...
  readonly namespace: string; // e.g. "default", "spaces", "models"
  readonly path: string; // e.g. "/scenes/lobby.json"
  readonly filename: string; // e.g. "lobby.json"
  readonly ownerCubId: string; // Sovereign owner CUB-XXXXXXXX
  readonly visibility: FileVisibility;
  readonly status: FileStatus;
  readonly currentVersion: FileVersion;
  readonly versions: readonly FileVersion[];
  readonly acl: readonly FileAclEntry[];
  readonly coordinateUri: string; // CNC coordinate: CUBIO://NETWORK/0/01/00004/STORAGE
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly trashedAt?: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface IStorageBackend {
  putContent(
    content: string | Uint8Array,
    mimeType?: string,
    ownerCubId?: string
  ): Promise<{ casHash: string; sizeBytes: number; storageObjectId: string }>;
  getContent(casHashOrObjectId: string): Promise<string | Uint8Array | undefined>;
  verifyIntegrity(casHash: string): Promise<boolean>;
}

export interface UploadFileInput {
  readonly namespace?: string; // default: "default"
  readonly path: string; // e.g. "/models/avatar.glb"
  readonly content: string | Uint8Array;
  readonly mimeType?: string;
  readonly visibility?: FileVisibility; // default: "PRIVATE"
  readonly changeNote?: string;
  readonly metadata?: Record<string, any>;
}

export interface GetFileResult {
  readonly file: Readonly<FileRecord>;
  readonly version: Readonly<FileVersion>;
  readonly content: string | Uint8Array;
  readonly verifiedIntegrity: boolean;
}

export interface ShareFileInput {
  readonly fileId: string;
  readonly recipientCubIdOrAddress: string;
  readonly permissions?: readonly FilePermission[]; // default: ['READ']
}

export interface RollbackVersionInput {
  readonly fileId: string;
  readonly targetVersionNumber: number;
  readonly note?: string;
}

export interface ListFilesQuery {
  readonly namespace?: string;
  readonly status?: FileStatus;
  readonly visibility?: FileVisibility;
  readonly pathPrefix?: string;
  readonly includeShared?: boolean;
}
