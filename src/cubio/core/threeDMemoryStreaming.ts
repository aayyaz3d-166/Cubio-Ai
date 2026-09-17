/**
 * CUBiO AI ? Task 12: .3dmemory Streaming / Checkpoint Engine
 * src/cubio/core/threeDMemoryStreaming.ts
 *
 * Implements the canonical .3dmemory V3 indexed checkpoint and streaming architecture:
 *
 *   VDB = PRIMARY PERSISTENT TRUTH
 *   .3dmemory = CHECKPOINT / BACKUP / TRANSPORT
 *
 * Architecture:
 *   VDB -> Checkpoint Builder -> .3dmemory (Indexed / Chunked) -> Partial Read / Streaming
 *       -> Virtual Working Cache (<= 256 LRU) -> On-Demand Processing -> Eviction
 *
 * Invariants & Principles:
 * 1. .3dmemory is NEVER a primary database.
 * 2. Reads support partial access (random-access seek by byte offset without loading the full file).
 * 3. Spatial lookups map cellId to address369 strictly via Formula A (address369 = 26 + cellId).
 * 4. Streaming supports incremental traversal of large snapshots with bounded memory buffers.
 * 5. Corrupted checksums fail closed immediately (CHECKPOINT_INTEGRITY_FAILURE).
 * 6. Outdated restores fail closed via OCC (STALE_CHECKPOINT).
 * 7. Cross-tenant restores fail closed (TENANT_MISMATCH_CONFLICT).
 * 8. Materialized cache is strictly bounded (max 256 items).
 * 9. Atomic file writing via temporary file + sync + atomic rename ensures crash safety.
 * 10. Hardware actuation remains permanently locked (IS_ACTUATION_BLOCKED = true).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  CanonicalIdentityKey,
  canonicalStringify,
  calculateCanonicalChecksum,
  validateCanonicalIdentity,
  isValidCellId,
} from './canonicalIdentity';
import {
  cellIdToAddress369,
  validateCellId,
  TOTAL_SPATIAL_CELLS,
} from '../../core/address369';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';

// ============================================================
// ERROR CODES & EXCEPTIONS
// ============================================================

export const STREAMING_CHECKPOINT_ERRORS = {
  CHECKPOINT_INTEGRITY_FAILURE: 'CHECKPOINT_INTEGRITY_FAILURE',
  STALE_CHECKPOINT: 'STALE_CHECKPOINT',
  TENANT_MISMATCH_CONFLICT: 'TENANT_MISMATCH_CONFLICT',
  ENTRY_NOT_FOUND: 'ENTRY_NOT_FOUND',
  INVALID_CELL_ID: 'INVALID_CELL_ID',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  ACTUATION_BLOCKED_ERROR: 'ACTUATION_BLOCKED_ERROR',
} as const;

export class CheckpointError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'CheckpointError';
  }
}

// ============================================================
// DATA CONTRACTS
// ============================================================

export interface CheckpointHeader {
  readonly magic: '3DMEMORY_CHECKPOINT_V3';
  readonly format: '3dmemory';
  readonly version: 3;
  readonly checkpointId: string;
  readonly createdAt: string;
  readonly tenantId: string;
  readonly entryCount: number;
  readonly indexOffset: number;
  readonly indexLength: number;
  readonly payloadOffset: number;
  readonly payloadLength: number;
  readonly headerChecksum: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CheckpointIndexEntry {
  readonly objectId: string;
  readonly tenantId: string;
  readonly domain: string;
  readonly stateVersion: number;
  readonly cellId?: number;
  readonly address369?: number;
  readonly payloadOffset: number;
  readonly payloadLength: number;
  readonly checksum: string;
}

export interface CheckpointRecord {
  readonly identity: CanonicalIdentityKey;
  readonly payload: unknown;
}

export interface RestoreResult {
  readonly success: boolean;
  readonly restoredObjectId: string;
  readonly restoredVersion: number;
  readonly status: 'RESTORED' | 'SKIPPED_IDENTICAL' | 'REJECTED';
  readonly error?: string;
}

// ============================================================
// BOUNDED LRU CACHE (MAX <= 256)
// ============================================================

export class BoundedWorkingCache<K, V> {
  private cache: Map<K, V> = new Map();
  public readonly maxCapacity: number;

  constructor(maxCapacity: number = 256) {
    this.maxCapacity = Math.max(1, Math.min(maxCapacity, 256));
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public has(key: K): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

// ============================================================
// 3DMEMORY CHECKPOINT ENGINE
// ============================================================

export class ThreeDMemoryCheckpointEngine {
  private workingCache: BoundedWorkingCache<string, CheckpointRecord>;

  constructor(cacheCapacity: number = 256) {
    if (!IS_ACTUATION_BLOCKED) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.ACTUATION_BLOCKED_ERROR,
        'Physical actuation must be strictly blocked'
      );
    }
    this.workingCache = new BoundedWorkingCache(cacheCapacity);
  }

  public clearCache(): void {
    this.workingCache.clear();
  }

  public getCacheSize(): number {
    return this.workingCache.size();
  }

  public createCheckpoint(
    filePath: string,
    records: readonly CheckpointRecord[],
    options: {
      tenantId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): { checkpointId: string; filePath: string; bytesWritten: number; entryCount: number } {
    const checkpointId = `CKPT-${crypto.randomBytes(8).toString('hex')}`;
    const tenantId = options.tenantId || records[0]?.identity.tenantId || 'root';

    const payloadChunks: Buffer[] = [];
    let currentPayloadOffset = 0;
    const indexEntries: CheckpointIndexEntry[] = [];

    for (const rec of records) {
      validateCanonicalIdentity(rec.identity);

      const jsonStr = canonicalStringify(rec.payload);
      const expectedChecksum = crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
      if (rec.identity.checksum !== expectedChecksum) {
        throw new CheckpointError(
          STREAMING_CHECKPOINT_ERRORS.CHECKPOINT_INTEGRITY_FAILURE,
          `Record ${rec.identity.objectId} checksum mismatch. Header=${rec.identity.checksum}, Computed=${expectedChecksum}`
        );
      }

      let address369: number | undefined;
      if (rec.identity.cellId !== undefined) {
        validateCellId(rec.identity.cellId);
        address369 = cellIdToAddress369(rec.identity.cellId);
      }

      const serializedPayload = Buffer.from(jsonStr, 'utf8');
      const payloadLength = serializedPayload.length;

      const indexEntry: CheckpointIndexEntry = {
        objectId: rec.identity.objectId,
        tenantId: rec.identity.tenantId,
        domain: rec.identity.domain,
        stateVersion: rec.identity.stateVersion,
        payloadOffset: currentPayloadOffset,
        payloadLength,
        checksum: rec.identity.checksum,
        ...(rec.identity.cellId !== undefined ? { cellId: rec.identity.cellId } : {}),
        ...(address369 !== undefined ? { address369 } : {}),
      };
      indexEntries.push(indexEntry);

      payloadChunks.push(serializedPayload);
      currentPayloadOffset += payloadLength;
    }

    const totalPayloadLength = currentPayloadOffset;
    const indexJson = canonicalStringify(indexEntries);
    const indexBuffer = Buffer.from(indexJson, 'utf8');

    const HEADER_RESERVED_SIZE = 1024;
    const indexStart = HEADER_RESERVED_SIZE;
    const payloadStart = indexStart + indexBuffer.length;

    const finalHeader: CheckpointHeader = {
      magic: '3DMEMORY_CHECKPOINT_V3',
      format: '3dmemory',
      version: 3,
      checkpointId,
      createdAt: new Date().toISOString(),
      tenantId,
      entryCount: records.length,
      indexOffset: indexStart,
      indexLength: indexBuffer.length,
      payloadOffset: payloadStart,
      payloadLength: totalPayloadLength,
      headerChecksum: crypto
        .createHash('sha256')
        .update(checkpointId + tenantId + records.length)
        .digest('hex'),
      metadata: options.metadata || {},
    };

    const headerRaw = JSON.stringify(finalHeader);
    if (Buffer.byteLength(headerRaw, 'utf8') >= HEADER_RESERVED_SIZE - 1) {
      throw new Error(`Checkpoint header exceeds reserved size of ${HEADER_RESERVED_SIZE} bytes`);
    }

    const headerBuffer = Buffer.alloc(HEADER_RESERVED_SIZE, 0x20);
    headerBuffer.write(headerRaw, 0, 'utf8');
    headerBuffer[HEADER_RESERVED_SIZE - 1] = 0x0a;

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempFilePath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
    const fd = fs.openSync(tempFilePath, 'w');
    let totalBytesWritten = 0;
    try {
      totalBytesWritten += fs.writeSync(fd, headerBuffer, 0, headerBuffer.length);
      totalBytesWritten += fs.writeSync(fd, indexBuffer, 0, indexBuffer.length);
      for (const chunk of payloadChunks) {
        totalBytesWritten += fs.writeSync(fd, chunk, 0, chunk.length);
      }
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    fs.renameSync(tempFilePath, filePath);

    return {
      checkpointId,
      filePath,
      bytesWritten: totalBytesWritten,
      entryCount: records.length,
    };
  }

  public readHeader(filePath: string): CheckpointHeader {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const fd = fs.openSync(filePath, 'r');
    try {
      const headerBuf = Buffer.alloc(1024);
      const bytesRead = fs.readSync(fd, headerBuf, 0, 1024, 0);
      if (bytesRead < 1024) {
        throw new CheckpointError(
          STREAMING_CHECKPOINT_ERRORS.UNSUPPORTED_FORMAT,
          'File too small to contain valid V3 checkpoint header'
        );
      }

      const headerText = headerBuf.toString('utf8').trim();
      const parsed = JSON.parse(headerText) as CheckpointHeader;
      if (parsed.magic !== '3DMEMORY_CHECKPOINT_V3' || parsed.version !== 3) {
        throw new CheckpointError(
          STREAMING_CHECKPOINT_ERRORS.UNSUPPORTED_FORMAT,
          `Invalid checkpoint magic or version: ${parsed.magic} v${parsed.version}`
        );
      }

      return parsed;
    } finally {
      fs.closeSync(fd);
    }
  }

  public readIndex(filePath: string): CheckpointIndexEntry[] {
    const header = this.readHeader(filePath);
    const fd = fs.openSync(filePath, 'r');
    try {
      const indexBuf = Buffer.alloc(header.indexLength);
      fs.readSync(fd, indexBuf, 0, header.indexLength, header.indexOffset);
      const indexText = indexBuf.toString('utf8');
      return JSON.parse(indexText) as CheckpointIndexEntry[];
    } finally {
      fs.closeSync(fd);
    }
  }

  public readEntry(filePath: string, objectId: string): CheckpointRecord {
    const cached = this.workingCache.get(objectId);
    if (cached) {
      return cached;
    }

    const header = this.readHeader(filePath);
    const index = this.readIndex(filePath);

    const entry = index.find((e) => e.objectId === objectId);
    if (!entry) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.ENTRY_NOT_FOUND,
        `Object ${objectId} not found in checkpoint ${filePath}`
      );
    }

    const record = this.readPayloadSlice(filePath, header, entry);
    this.workingCache.set(objectId, record);
    return record;
  }

  public readCell(filePath: string, cellId: number): CheckpointRecord {
    if (!isValidCellId(cellId)) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.INVALID_CELL_ID,
        `Cell ID ${cellId} is out of bounds [0..${TOTAL_SPATIAL_CELLS - 1}]`
      );
    }

    const header = this.readHeader(filePath);
    const index = this.readIndex(filePath);

    const entry = index.find((e) => e.cellId === cellId);
    if (!entry) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.ENTRY_NOT_FOUND,
        `Cell ${cellId} not found in checkpoint ${filePath}`
      );
    }

    const expectedAddress369 = cellIdToAddress369(cellId);
    if (entry.address369 !== expectedAddress369) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.CHECKPOINT_INTEGRITY_FAILURE,
        `Address369 mismatch for cell ${cellId}. Expected ${expectedAddress369}, got ${entry.address369}`
      );
    }

    return this.readEntry(filePath, entry.objectId);
  }

  public async streamEntries(
    filePath: string,
    onEntry: (record: CheckpointRecord, index: number, total: number) => Promise<void> | void
  ): Promise<number> {
    const header = this.readHeader(filePath);
    const index = this.readIndex(filePath);

    const fd = fs.openSync(filePath, 'r');
    try {
      let count = 0;
      for (let i = 0; i < index.length; i++) {
        const entry = index[i];
        const record = this.readPayloadSliceWithFd(fd, header, entry);

        this.workingCache.set(entry.objectId, record);

        await onEntry(record, i, index.length);
        count++;
      }
      return count;
    } finally {
      fs.closeSync(fd);
    }
  }

  public restoreEntry(
    checkpointRecord: CheckpointRecord,
    currentCanonical: CanonicalIdentityKey | null,
    targetTenantId: string = 'root'
  ): RestoreResult {
    if (checkpointRecord.identity.tenantId !== targetTenantId) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.TENANT_MISMATCH_CONFLICT,
        `Tenant mismatch: record has "${checkpointRecord.identity.tenantId}", target is "${targetTenantId}"`
      );
    }

    const computedChecksum = calculateCanonicalChecksum(checkpointRecord.payload);
    if (computedChecksum !== checkpointRecord.identity.checksum) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.CHECKPOINT_INTEGRITY_FAILURE,
        `Integrity failure: object ${checkpointRecord.identity.objectId} corrupted. Stored checksum=${checkpointRecord.identity.checksum}, actual=${computedChecksum}`
      );
    }

    if (currentCanonical) {
      if (currentCanonical.objectId !== checkpointRecord.identity.objectId) {
        throw new Error(
          `Cannot restore across mismatched objectIds: current=${currentCanonical.objectId}, record=${checkpointRecord.identity.objectId}`
        );
      }

      if (checkpointRecord.identity.stateVersion < currentCanonical.stateVersion) {
        throw new CheckpointError(
          STREAMING_CHECKPOINT_ERRORS.STALE_CHECKPOINT,
          `Stale checkpoint rejection: record version ${checkpointRecord.identity.stateVersion} is older than current version ${currentCanonical.stateVersion}`
        );
      }

      if (checkpointRecord.identity.stateVersion === currentCanonical.stateVersion) {
        return {
          success: true,
          restoredObjectId: checkpointRecord.identity.objectId,
          restoredVersion: checkpointRecord.identity.stateVersion,
          status: 'SKIPPED_IDENTICAL',
        };
      }
    }

    return {
      success: true,
      restoredObjectId: checkpointRecord.identity.objectId,
      restoredVersion: checkpointRecord.identity.stateVersion,
      status: 'RESTORED',
    };
  }

  private readPayloadSlice(
    filePath: string,
    header: CheckpointHeader,
    entry: CheckpointIndexEntry
  ): CheckpointRecord {
    const fd = fs.openSync(filePath, 'r');
    try {
      return this.readPayloadSliceWithFd(fd, header, entry);
    } finally {
      fs.closeSync(fd);
    }
  }

  private readPayloadSliceWithFd(
    fd: number,
    header: CheckpointHeader,
    entry: CheckpointIndexEntry
  ): CheckpointRecord {
    const absOffset = header.payloadOffset + entry.payloadOffset;
    const buf = Buffer.alloc(entry.payloadLength);
    const bytesRead = fs.readSync(fd, buf, 0, entry.payloadLength, absOffset);

    if (bytesRead !== entry.payloadLength) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.CHECKPOINT_INTEGRITY_FAILURE,
        `Unexpected end-of-file while reading payload for ${entry.objectId}`
      );
    }

    const payloadJson = buf.toString('utf8');
    const parsedPayload = JSON.parse(payloadJson);

    const computedChecksum = calculateCanonicalChecksum(parsedPayload);
    if (computedChecksum !== entry.checksum) {
      throw new CheckpointError(
        STREAMING_CHECKPOINT_ERRORS.CHECKPOINT_INTEGRITY_FAILURE,
        `Payload checksum mismatch for ${entry.objectId}: recorded ${entry.checksum}, computed ${computedChecksum}`
      );
    }

    const identity: CanonicalIdentityKey = {
      objectId: entry.objectId,
      tenantId: entry.tenantId,
      domain: entry.domain as any,
      stateVersion: entry.stateVersion,
      checksum: entry.checksum,
      ...(entry.cellId !== undefined ? { cellId: entry.cellId } : {}),
    };

    return {
      identity,
      payload: parsedPayload,
    };
  }
}
