/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/longContextAssembler.ts
 *
 * Deterministic context assembler for multi-scale long-context profiles.
 * Assembles canonical blocks into coherent context windows with bounded capacity,
 * deterministic ordering, and bitwise SHA-256 digest generation.
 */

import * as crypto from 'crypto';
import {
  LongContextProfileId,
  LongContextAssemblyResult,
  LongContextIndexEntry,
  LongContextQuery,
  LongContextTenantViolationError,
} from './types';
import { getLongContextProfile } from './longContextProfiles';
import { LongContextIndex } from './longContextIndex';
import { LoadOnDemandCache, BlockContentLoader } from './loadOnDemandCache';

export class LongContextAssembler {
  /**
   * Assembles a context window deterministically for a target profile and query.
   */
  public static async assembleContext(params: {
    profileId: LongContextProfileId;
    tenantId: string;
    index: LongContextIndex;
    cache: LoadOnDemandCache;
    loader: BlockContentLoader;
    query?: Partial<LongContextQuery>;
  }): Promise<LongContextAssemblyResult> {
    const startTime = Date.now();
    const { profileId, tenantId, index, cache, loader, query } = params;

    const spec = getLongContextProfile(profileId);
    const maxCapacityTokens = spec.maxTokens;

    // 1. Collect Pinned Anchor Blocks First
    const pinnedEntries = index.getPinnedEntries(tenantId);

    // 2. Query Additional Matching Blocks
    const queriedEntries = index.queryEntries({
      tenantId,
      queryText: query?.queryText,
      tokenRange: query?.tokenRange,
      spatialCellId: query?.spatialCellId,
      epistemicStatus: query?.epistemicStatus,
      maxBlocks: spec.maxChunks,
      includePinned: false, // Don't duplicate pinned entries
    });

    // 3. Deduplicate and Sort Deterministically by tokenStart
    const candidateMap = new Map<string, LongContextIndexEntry>();
    for (const p of pinnedEntries) {
      if (p.tenantId !== tenantId) {
        throw new LongContextTenantViolationError(tenantId, p.tenantId);
      }
      candidateMap.set(p.chunkId, p);
    }
    for (const q of queriedEntries) {
      if (q.tenantId !== tenantId) {
        throw new LongContextTenantViolationError(tenantId, q.tenantId);
      }
      if (!candidateMap.has(q.chunkId)) {
        candidateMap.set(q.chunkId, q);
      }
    }

    // Sort: pinned entries first, then by tokenStart ascending, chunkId as tie breaker
    const sortedEntries = Array.from(candidateMap.values()).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.tokenStart !== b.tokenStart) return a.tokenStart - b.tokenStart;
      return a.chunkId.localeCompare(b.chunkId);
    });

    // 4. Fit within Profile Capacity
    const acceptedEntries: LongContextIndexEntry[] = [];
    let accumulatedTokens = 0;
    let isTruncated = false;

    for (const entry of sortedEntries) {
      if (accumulatedTokens + entry.tokenCount <= maxCapacityTokens) {
        acceptedEntries.push(entry);
        accumulatedTokens += entry.tokenCount;
      } else {
        isTruncated = true;
        break; // Reached bounded token capacity
      }
    }

    // 5. Load Block Content On Demand
    const contentParts: string[] = [];
    let residentLoadedCount = 0;

    for (const entry of acceptedEntries) {
      const isAlreadyResident = cache.isResident(entry.chunkId);
      const residentBlock = await cache.getOrLoad(entry, loader);
      if (!isAlreadyResident) {
        residentLoadedCount++;
      }

      contentParts.push(
        `[CANONICAL_BLOCK:${entry.chunkId} | OBJ:${entry.objectId} | V:${entry.stateVersion} | RANGE:${entry.tokenStart}..${entry.tokenEnd}]\n${residentBlock.content}`
      );
    }

    const assembledText = contentParts.join('\n\n');

    // 6. Compute Bitwise Context Hash
    const hasher = crypto.createHash('sha256');
    hasher.update(`PROFILE:${profileId}:TENANT:${tenantId}:CAPACITY:${maxCapacityTokens}:BLOCKS:${acceptedEntries.length}`);
    for (const entry of acceptedEntries) {
      hasher.update(`:${entry.chunkId}:${entry.stateVersion}:${entry.checksum}`);
    }
    hasher.update(assembledText);
    const contextHash = hasher.digest('hex');

    const executionTimeMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      profileId,
      maxCapacityTokens,
      totalTokensAssembled: accumulatedTokens,
      assembledBlocksCount: acceptedEntries.length,
      residentLoadedCount,
      assembledText,
      blockReferences: Object.freeze(acceptedEntries),
      contextHash,
      isTruncated,
      tenantId,
      executionTimeMs,
    });
  }

  /**
   * Synchronous context assembly helper.
   */
  public static assembleContextSync(params: {
    profileId: LongContextProfileId;
    tenantId: string;
    index: LongContextIndex;
    cache: LoadOnDemandCache;
    loader: (entry: LongContextIndexEntry) => string;
    query?: Partial<LongContextQuery>;
  }): LongContextAssemblyResult {
    const startTime = Date.now();
    const { profileId, tenantId, index, cache, loader, query } = params;

    const spec = getLongContextProfile(profileId);
    const maxCapacityTokens = spec.maxTokens;

    const pinnedEntries = index.getPinnedEntries(tenantId);
    const queriedEntries = index.queryEntries({
      tenantId,
      queryText: query?.queryText,
      tokenRange: query?.tokenRange,
      spatialCellId: query?.spatialCellId,
      epistemicStatus: query?.epistemicStatus,
      maxBlocks: spec.maxChunks,
      includePinned: false,
    });

    const candidateMap = new Map<string, LongContextIndexEntry>();
    for (const p of pinnedEntries) {
      if (p.tenantId !== tenantId) throw new LongContextTenantViolationError(tenantId, p.tenantId);
      candidateMap.set(p.chunkId, p);
    }
    for (const q of queriedEntries) {
      if (q.tenantId !== tenantId) throw new LongContextTenantViolationError(tenantId, q.tenantId);
      if (!candidateMap.has(q.chunkId)) candidateMap.set(q.chunkId, q);
    }

    const sortedEntries = Array.from(candidateMap.values()).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.tokenStart !== b.tokenStart) return a.tokenStart - b.tokenStart;
      return a.chunkId.localeCompare(b.chunkId);
    });

    const acceptedEntries: LongContextIndexEntry[] = [];
    let accumulatedTokens = 0;
    let isTruncated = false;

    for (const entry of sortedEntries) {
      if (accumulatedTokens + entry.tokenCount <= maxCapacityTokens) {
        acceptedEntries.push(entry);
        accumulatedTokens += entry.tokenCount;
      } else {
        isTruncated = true;
        break;
      }
    }

    const contentParts: string[] = [];
    let residentLoadedCount = 0;

    for (const entry of acceptedEntries) {
      const isAlreadyResident = cache.isResident(entry.chunkId);
      const residentBlock = cache.getOrLoadSync(entry, loader);
      if (!isAlreadyResident) residentLoadedCount++;

      contentParts.push(
        `[CANONICAL_BLOCK:${entry.chunkId} | OBJ:${entry.objectId} | V:${entry.stateVersion} | RANGE:${entry.tokenStart}..${entry.tokenEnd}]\n${residentBlock.content}`
      );
    }

    const assembledText = contentParts.join('\n\n');

    const hasher = crypto.createHash('sha256');
    hasher.update(`PROFILE:${profileId}:TENANT:${tenantId}:CAPACITY:${maxCapacityTokens}:BLOCKS:${acceptedEntries.length}`);
    for (const entry of acceptedEntries) {
      hasher.update(`:${entry.chunkId}:${entry.stateVersion}:${entry.checksum}`);
    }
    hasher.update(assembledText);
    const contextHash = hasher.digest('hex');

    const executionTimeMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      profileId,
      maxCapacityTokens,
      totalTokensAssembled: accumulatedTokens,
      assembledBlocksCount: acceptedEntries.length,
      residentLoadedCount,
      assembledText,
      blockReferences: Object.freeze(acceptedEntries),
      contextHash,
      isTruncated,
      tenantId,
      executionTimeMs,
    });
  }
}
