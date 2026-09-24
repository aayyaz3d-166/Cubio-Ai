/**
 * CUBiO AI — Task 163: Native Attention & Context Scaling
 * src/cubio/model/native_attention_context/contextWindowManager.ts
 *
 * Context window assembler with prioritized retention, selective eviction,
 * and LRU bounded caching.
 *
 * Prioritization Policy:
 * 1. Pinned chunks (System prompt, active query) are NEVER evicted.
 * 2. High-relevance spatial/episodic chunks are prioritized.
 * 3. Low-relevance or stale middle chunks are evicted first when exceeding profile capacity.
 */

import * as crypto from 'crypto';
import {
  ContextScaleProfile,
  ContextWindowChunk,
  ContextAssemblyResult,
  IS_ACTUATION_BLOCKED,
} from './types';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';

export class ContextWindowManager {
  private static windowCache: Map<string, ContextAssemblyResult> = new Map();
  private static readonly MAX_CACHED_WINDOWS = 4;

  /**
   * Clears cache for test isolation.
   */
  public static clearCache(): void {
    this.windowCache.clear();
  }

  /**
   * Assembles a context window within a specific profile capacity.
   */
  public static assembleContextWindow(
    profile: ContextScaleProfile,
    systemPrompt: string,
    userPrompt: string,
    retrievedChunks: readonly ContextWindowChunk[],
    tenantId: string = 'root'
  ): ContextAssemblyResult {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const maxCapacityTokens = profile;

    // 1. Estimate tokens for system and user prompt
    const sysTokens = Math.max(1, Math.ceil(systemPrompt.length / 4));
    const userTokens = Math.max(1, Math.ceil(userPrompt.length / 4));

    const pinnedSystemChunk: ContextWindowChunk = {
      chunkId: 'CHUNK-SYS-PROMPT',
      sourceObjectId: 'URN:CUBIO:SYSTEM:PROMPT',
      text: systemPrompt,
      tokenCount: sysTokens,
      relevanceScore: 1.0,
      isPinned: true,
      createdAt: '2026-09-13T00:00:00.000Z',
    };

    const pinnedUserChunk: ContextWindowChunk = {
      chunkId: 'CHUNK-USER-QUERY',
      sourceObjectId: 'URN:CUBIO:USER:QUERY',
      text: userPrompt,
      tokenCount: userTokens,
      relevanceScore: 1.0,
      isPinned: true,
      createdAt: '2026-09-13T00:00:00.000Z',
    };

    let allocatedTokens = sysTokens + userTokens;
    let truncationApplied = false;
    let evictedChunkCount = 0;

    // 2. Selectively add retrieved chunks in order of descending relevance
    const selectedRetrieved: ContextWindowChunk[] = [];
    const sortedRetrieved = [...retrievedChunks].sort((a, b) => b.relevanceScore - a.relevanceScore);

    for (const chunk of sortedRetrieved) {
      if (allocatedTokens + chunk.tokenCount <= maxCapacityTokens) {
        selectedRetrieved.push(chunk);
        allocatedTokens += chunk.tokenCount;
      } else {
        // Evict chunk due to capacity limit
        evictedChunkCount++;
        truncationApplied = true;
      }
    }

    // 3. Assemble final ordered chunk list: System -> Memory Chunks -> User Query
    const assembledChunks: ContextWindowChunk[] = [
      pinnedSystemChunk,
      ...selectedRetrieved,
      pinnedUserChunk,
    ];

    // Combine text
    const promptText = assembledChunks.map((c) => c.text).join('\n\n');

    // Deterministic state payload
    const payload = {
      profile,
      maxCapacityTokens,
      tenantId,
      assembledChunkIds: assembledChunks.map((c) => c.chunkId),
      totalTokens: allocatedTokens,
      evictedChunkCount,
    };

    const canonicalChecksum = calculateCanonicalChecksum(payload);
    const contextHash = crypto.createHash('sha256').update(canonicalStringify(payload), 'utf8').digest('hex');

    const result: ContextAssemblyResult = Object.freeze({
      profile,
      maxCapacityTokens,
      assembledChunks: Object.freeze(assembledChunks),
      totalTokens: allocatedTokens,
      promptText,
      truncationApplied,
      evictedChunkCount,
      contextHash,
      canonicalChecksum,
    });

    // Cache management
    this.addToCache(`${tenantId}:${profile}:${contextHash.slice(0, 16)}`, result);

    return result;
  }

  /**
   * Returns current cache size.
   */
  public static getCacheSize(): number {
    return this.windowCache.size;
  }

  private static addToCache(key: string, result: ContextAssemblyResult): void {
    if (this.windowCache.has(key)) {
      this.windowCache.delete(key);
    } else if (this.windowCache.size >= this.MAX_CACHED_WINDOWS) {
      const oldestKey = this.windowCache.keys().next().value;
      if (oldestKey) this.windowCache.delete(oldestKey);
    }
    this.windowCache.set(key, result);
  }
}
