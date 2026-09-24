/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/longContextIndex.ts
 *
 * Lightweight, sovereign reference index for long-context memory blocks.
 * Stores metadata and canonical references without retaining bulk text in RAM.
 *
 * INVARIANTS:
 * - Strict multi-tenant isolation on all lookups.
 * - Monotonic OCC version tracking.
 * - Bitwise SHA-256 checksum validation.
 * - Spatial coordinate alignment (0..342 HCP cells).
 */

import * as crypto from 'crypto';
import {
  LongContextIndexEntry,
  LongContextQuery,
  LongContextTenantViolationError,
  LongContextOCCConflictError,
  LongContextIntegrityError,
} from './types';

export class LongContextIndex {
  // Primary index keyed by chunkId
  private readonly entriesByChunkId = new Map<string, LongContextIndexEntry>();
  // Grouped by tenantId -> objectId -> chunkId
  private readonly tenantObjectMap = new Map<string, Map<string, Set<string>>>();
  // Spatial index: tenantId -> spatialCellId -> Set<chunkId>
  private readonly spatialIndex = new Map<string, Map<number, Set<string>>>();

  /**
   * Registers a new canonical context block in the index.
   * Computes SHA-256 checksum from content and generates summary.
   */
  public registerBlock(params: {
    chunkId: string;
    objectId: string;
    tenantId: string;
    tokenStart: number;
    tokenEnd: number;
    tokenCount: number;
    content: string;
    expectedVersion?: number;
    spatialCellId?: number;
    epistemicStatus?: string;
    isPinned?: boolean;
  }): LongContextIndexEntry {
    const {
      chunkId,
      objectId,
      tenantId,
      tokenStart,
      tokenEnd,
      tokenCount,
      content,
      expectedVersion,
      spatialCellId,
      epistemicStatus = 'OBSERVATION',
      isPinned = false,
    } = params;

    // Validate spatial cell if provided
    if (spatialCellId !== undefined && (spatialCellId < 0 || spatialCellId > 342)) {
      throw new LongContextIntegrityError(`Spatial cell ID ${spatialCellId} out of bounds [0..342].`);
    }

    // OCC Check
    const existing = this.entriesByChunkId.get(chunkId);
    let stateVersion = 1;
    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new LongContextTenantViolationError(tenantId, existing.tenantId);
      }
      if (expectedVersion !== undefined && expectedVersion !== existing.stateVersion) {
        throw new LongContextOCCConflictError(objectId, expectedVersion, existing.stateVersion);
      }
      stateVersion = existing.stateVersion + 1;
    } else if (expectedVersion !== undefined && expectedVersion !== 0) {
      throw new LongContextOCCConflictError(objectId, expectedVersion, 0);
    }

    // Compute checksum
    const checksum = crypto.createHash('sha256').update(content).digest('hex');

    // Create bounded summary (max 64 characters)
    const summaryClean = content.replace(/\s+/g, ' ').trim();
    const contentSummary = summaryClean.length > 64 ? summaryClean.slice(0, 61) + '...' : summaryClean;

    const entry: LongContextIndexEntry = Object.freeze({
      chunkId,
      objectId,
      tenantId,
      tokenStart,
      tokenEnd,
      tokenCount,
      stateVersion,
      checksum,
      spatialCellId,
      epistemicStatus,
      isPinned,
      contentSummary,
      byteLength: Buffer.byteLength(content, 'utf8'),
      createdAt: new Date().toISOString(),
    });

    // Save to primary map
    this.entriesByChunkId.set(chunkId, entry);

    // Update tenant map
    if (!this.tenantObjectMap.has(tenantId)) {
      this.tenantObjectMap.set(tenantId, new Map());
    }
    const objMap = this.tenantObjectMap.get(tenantId)!;
    if (!objMap.has(objectId)) {
      objMap.set(objectId, new Set());
    }
    objMap.get(objectId)!.add(chunkId);

    // Update spatial index
    if (spatialCellId !== undefined) {
      if (!this.spatialIndex.has(tenantId)) {
        this.spatialIndex.set(tenantId, new Map());
      }
      const cellMap = this.spatialIndex.get(tenantId)!;
      if (!cellMap.has(spatialCellId)) {
        cellMap.set(spatialCellId, new Set());
      }
      cellMap.get(spatialCellId)!.add(chunkId);
    }

    return entry;
  }

  /**
   * Retrieves an index entry by chunkId, enforcing tenant isolation.
   */
  public getEntry(chunkId: string, callerTenantId: string): LongContextIndexEntry | null {
    const entry = this.entriesByChunkId.get(chunkId);
    if (!entry) return null;
    if (entry.tenantId !== callerTenantId) {
      throw new LongContextTenantViolationError(callerTenantId, entry.tenantId);
    }
    return entry;
  }

  /**
   * Queries index entries by tenant, range, spatial cell, and keywords.
   */
  public queryEntries(query: LongContextQuery): readonly LongContextIndexEntry[] {
    const { tenantId, tokenRange, spatialCellId, epistemicStatus, maxBlocks = 64, includePinned = true } = query;

    const results: LongContextIndexEntry[] = [];
    const objMap = this.tenantObjectMap.get(tenantId);
    if (!objMap) return results;

    for (const chunkIds of objMap.values()) {
      for (const cid of chunkIds) {
        const entry = this.entriesByChunkId.get(cid);
        if (!entry) continue;

        // Tenant Isolation Check
        if (entry.tenantId !== tenantId) {
          throw new LongContextTenantViolationError(tenantId, entry.tenantId);
        }

        // Token Range Check
        if (tokenRange) {
          const [rangeStart, rangeEnd] = tokenRange;
          if (entry.tokenEnd < rangeStart || entry.tokenStart > rangeEnd) {
            continue;
          }
        }

        // Spatial Cell Check
        if (spatialCellId !== undefined && entry.spatialCellId !== spatialCellId) {
          continue;
        }

        // Epistemic Status Check
        if (epistemicStatus && entry.epistemicStatus !== epistemicStatus) {
          continue;
        }

        // Pinned filter
        if (!includePinned && entry.isPinned) {
          continue;
        }

        results.push(entry);
        if (results.length >= maxBlocks) {
          break;
        }
      }
      if (results.length >= maxBlocks) break;
    }

    return results;
  }

  /**
   * Retrieves all pinned (anchor) entries for a tenant.
   */
  public getPinnedEntries(tenantId: string): readonly LongContextIndexEntry[] {
    const pinned: LongContextIndexEntry[] = [];
    const objMap = this.tenantObjectMap.get(tenantId);
    if (!objMap) return pinned;

    for (const chunkIds of objMap.values()) {
      for (const cid of chunkIds) {
        const entry = this.entriesByChunkId.get(cid);
        if (entry && entry.isPinned && entry.tenantId === tenantId) {
          pinned.push(entry);
        }
      }
    }
    return pinned;
  }

  /**
   * Returns total number of indexed blocks for a tenant.
   */
  public getBlockCount(tenantId: string): number {
    const objMap = this.tenantObjectMap.get(tenantId);
    if (!objMap) return 0;
    let count = 0;
    for (const chunkIds of objMap.values()) {
      count += chunkIds.size;
    }
    return count;
  }

  /**
   * Returns total number of indexed tokens for a tenant.
   */
  public getTotalTokens(tenantId: string): number {
    const objMap = this.tenantObjectMap.get(tenantId);
    if (!objMap) return 0;
    let total = 0;
    for (const chunkIds of objMap.values()) {
      for (const cid of chunkIds) {
        const entry = this.entriesByChunkId.get(cid);
        if (entry) total += entry.tokenCount;
      }
    }
    return total;
  }

  /**
   * Returns all entries for snapshot export.
   */
  public getAllEntries(tenantId: string): readonly LongContextIndexEntry[] {
    const entries: LongContextIndexEntry[] = [];
    const objMap = this.tenantObjectMap.get(tenantId);
    if (!objMap) return entries;
    for (const chunkIds of objMap.values()) {
      for (const cid of chunkIds) {
        const entry = this.entriesByChunkId.get(cid);
        if (entry && entry.tenantId === tenantId) {
          entries.push(entry);
        }
      }
    }
    return entries;
  }

  /**
   * Clears the index.
   */
  public clear(): void {
    this.entriesByChunkId.clear();
    this.tenantObjectMap.clear();
    this.spatialIndex.clear();
  }
}
