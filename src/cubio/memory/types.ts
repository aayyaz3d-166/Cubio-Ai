/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: CubiO Memory Engine Types
 *
 * Tiered, Index-Driven Spatial Memory Model:
 * Short-Term, Long-Term, Context, Relationships, History, Embeddings, State Memory.
 *
 * Lifecycle: Memory Index -> Required Memory -> Load -> Process -> Cache -> Release.
 * Invariant: Non-bloated, bounded cache, on-demand loading, and deterministic recall.
 */

import { CubiODimension } from '../types';

export type CubiOMemoryTier =
  | 'SHORT_TERM'
  | 'LONG_TERM'
  | 'CONTEXT'
  | 'RELATIONSHIPS'
  | 'HISTORY'
  | 'EMBEDDINGS'
  | 'STATE_MEMORY';

export interface MemoryIndexEntry {
  readonly memoryId: string;
  readonly key: string;
  readonly tier: CubiOMemoryTier;
  readonly dimension: CubiODimension;
  readonly sizeBytes: number;
  readonly resonanceIndex: number; // Harmonic priority [1..9]
  readonly tags: readonly string[];
  readonly cid: string; // Content-addressable identifier in store
  readonly payloadChecksum: string;
  readonly createdAt: number;
  readonly lastAccessedAt: number;
}

export interface MemoryBlock<T = any> {
  readonly indexEntry: MemoryIndexEntry;
  readonly payload: T;
  readonly isLoaded: boolean;
  readonly accessCount: number;
  readonly loadedAt: number;
}

export interface MemoryQueryFilter {
  readonly tier?: CubiOMemoryTier;
  readonly dimension?: CubiODimension;
  readonly keyPrefix?: string;
  readonly tags?: readonly string[];
  readonly minResonance?: number;
  readonly timeRange?: { start: number; end: number };
  readonly limit?: number;
}

export interface MemoryCacheStats {
  readonly totalIndexedCount: number;
  readonly activeLoadedInCache: number;
  readonly cacheHitCount: number;
  readonly cacheMissCount: number;
  readonly evictionCount: number;
  readonly activeCacheBytes: number;
  readonly maxCacheBytes: number;
  readonly maxCachedItems: number;
}

export type MemoryLifecycleAction =
  | 'INDEX_REGISTERED'
  | 'PAYLOAD_STORED'
  | 'PAYLOAD_LOADED'
  | 'PROCESSED'
  | 'CACHED'
  | 'RELEASED'
  | 'EVICTED';

export interface MemoryLifecycleEvent {
  readonly eventId: string;
  readonly memoryId: string;
  readonly key: string;
  readonly action: MemoryLifecycleAction;
  readonly timestamp: number;
  readonly details?: string;
}
