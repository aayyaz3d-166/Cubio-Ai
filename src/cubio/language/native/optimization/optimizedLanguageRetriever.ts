/**
 * CUBiO AI — Phase 6: Task 90 — Native Language Intelligence Optimization
 * src/cubio/language/native/optimization/optimizedLanguageRetriever.ts
 *
 * Inverted Posting Index & Sparse Bitset Accelerator for Long-Context Memory Retrieval.
 * Preserves CUBiO's store-once, reference-everywhere, load-on-demand architecture,
 * converting linear document scans into sub-millisecond posting intersections.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { NativeSparseMemoryStore } from '../../../memory/native/sparseMemoryStore';
import { NativeMemoryRecord } from '../../../memory/native/types';
import { BoundedLanguageCache } from './boundedLanguageCache';
import { OptimizedTokenProcessor } from './optimizedTokenProcessor';

export interface IndexedMemoryItem {
  readonly objectId: string;
  readonly tenantId: string;
  readonly cellId: number;
  readonly epistemicStatus: EpistemicStatus;
  readonly stateVersion: number;
  readonly tokenIds: readonly number[];
  readonly checksum: string;
  readonly rawText?: string;
}

export interface RetrievalResult {
  readonly objectId: string;
  readonly tenantId: string;
  readonly cellId: number;
  readonly epistemicStatus: EpistemicStatus;
  readonly relevanceScore: number;
  readonly matchedTokens: readonly number[];
  readonly rawPayload?: string;
}

export class OptimizedLanguageRetriever {
  private readonly _tenantId: string;
  private readonly _tokenProcessor: OptimizedTokenProcessor;
  private readonly _store?: NativeSparseMemoryStore;

  /** Inverted index: tenantId -> tokenId -> Set of objectIds */
  private readonly _postings: Map<string, Map<number, Set<string>>> = new Map();
  /** Item metadata: tenantId -> objectId -> IndexedMemoryItem */
  private readonly _items: Map<string, Map<string, IndexedMemoryItem>> = new Map();
  /** Query cache */
  private readonly _queryCache: BoundedLanguageCache<readonly RetrievalResult[]>;
  /** Materialized payload cache (load-on-demand) */
  private readonly _payloadCache: BoundedLanguageCache<string>;

  constructor(
    tokenProcessor?: OptimizedTokenProcessor,
    store?: NativeSparseMemoryStore,
    cacheCapacity = 256,
    tenantId: string = DEFAULT_TENANT_ID
  ) {
    this._tenantId = tenantId.trim() || DEFAULT_TENANT_ID;
    this._tokenProcessor = tokenProcessor ?? new OptimizedTokenProcessor();
    this._store = store;

    this._queryCache = new BoundedLanguageCache<readonly RetrievalResult[]>({
      maxCapacity: cacheCapacity,
      evictionPolicy: 'LRU',
    });

    this._payloadCache = new BoundedLanguageCache<string>({
      maxCapacity: cacheCapacity,
      evictionPolicy: 'LRU',
    });
  }

  public get queryCache(): BoundedLanguageCache<readonly RetrievalResult[]> {
    return this._queryCache;
  }

  public get payloadCache(): BoundedLanguageCache<string> {
    return this._payloadCache;
  }

  /**
   * Indexes a memory item into the sovereign sparse inverted index.
   */
  public indexItem(item: {
    objectId: string;
    tenantId?: string;
    text: string;
    cellId: number;
    epistemicStatus?: EpistemicStatus;
    stateVersion?: number;
  }): void {
    const tid = item.tenantId?.trim() || this._tenantId;
    const epistemic = item.epistemicStatus || 'CANONICAL_FACT';
    const version = item.stateVersion ?? 1;

    // Tokenize
    const seq = this._tokenProcessor.tokenize(item.text, {
      tenantId: tid,
      epistemicStatus: epistemic,
    });
    const tokenIds = Array.from(new Set(seq.tokens.map((t) => t.id)));

    const checksum = crypto
      .createHash('sha256')
      .update(`${tid}:${item.objectId}:${item.cellId}:${tokenIds.join(',')}:${epistemic}`)
      .digest('hex');

    const indexed: IndexedMemoryItem = {
      objectId: item.objectId,
      tenantId: tid,
      cellId: item.cellId,
      epistemicStatus: epistemic,
      stateVersion: version,
      tokenIds,
      checksum,
      rawText: item.text,
    };

    // Store in item registry
    let tItems = this._items.get(tid);
    if (!tItems) {
      tItems = new Map();
      this._items.set(tid, tItems);
    }
    tItems.set(item.objectId, indexed);

    // Update postings map
    let tPostings = this._postings.get(tid);
    if (!tPostings) {
      tPostings = new Map();
      this._postings.set(tid, tPostings);
    }

    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      let postingList = tPostings.get(tokenId);
      if (!postingList) {
        postingList = new Set();
        tPostings.set(tokenId, postingList);
      }
      postingList.add(item.objectId);
    }

    // Invalidate cached queries for this tenant
    this._queryCache.clear(tid);
  }

  /**
   * Fast sparse needle retrieval using posting set intersections.
   */
  public query(
    queryString: string,
    options: {
      tenantId?: string;
      limit?: number;
      minScore?: number;
      loadPayload?: boolean;
    } = {}
  ): readonly RetrievalResult[] {
    const tid = options.tenantId?.trim() || this._tenantId;
    const limit = options.limit ?? 10;
    const minScore = options.minScore ?? 0.1;
    const loadPayload = options.loadPayload ?? false;

    // Check query cache
    const cacheKey = `Q:${minScore}:${limit}:${loadPayload}:${queryString}`;
    const cached = this._queryCache.get(tid, cacheKey);
    if (cached) {
      return cached;
    }

    const tItems = this._items.get(tid);
    const tPostings = this._postings.get(tid);

    if (!tItems || !tPostings || tItems.size === 0) {
      return Object.freeze([]);
    }

    // Tokenize query
    const qSeq = this._tokenProcessor.tokenize(queryString, { tenantId: tid });
    const qTokenIds = Array.from(new Set(qSeq.tokens.map((t) => t.id)));

    if (qTokenIds.length === 0) {
      return Object.freeze([]);
    }

    // Accumulate match counts per candidate objectId
    const matchCounts = new Map<string, { count: number; matchedTokens: number[] }>();

    for (let i = 0; i < qTokenIds.length; i++) {
      const tidToken = qTokenIds[i];
      const candidates = tPostings.get(tidToken);
      if (candidates) {
        const candidateArr = Array.from(candidates);
        for (let j = 0; j < candidateArr.length; j++) {
          const oid = candidateArr[j];
          let rec = matchCounts.get(oid);
          if (!rec) {
            rec = { count: 0, matchedTokens: [] };
            matchCounts.set(oid, rec);
          }
          rec.count++;
          rec.matchedTokens.push(tidToken);
        }
      }
    }

    // Score and rank candidates
    const scored: RetrievalResult[] = [];
    const matchEntries = Array.from(matchCounts.entries());

    for (let i = 0; i < matchEntries.length; i++) {
      const [oid, matchInfo] = matchEntries[i];
      const item = tItems.get(oid);
      if (!item) continue;

      const relevanceScore = Number(
        (matchInfo.count / Math.max(qTokenIds.length, item.tokenIds.length)).toFixed(4)
      );

      if (relevanceScore >= minScore) {
        let rawPayload: string | undefined = undefined;

        if (loadPayload) {
          rawPayload = this._payloadCache.get(tid, oid, item.stateVersion);
          if (!rawPayload) {
            rawPayload = item.rawText ?? `Payload for ${oid}`;
            this._payloadCache.set(tid, oid, rawPayload, item.stateVersion);
          }
        }

        scored.push({
          objectId: item.objectId,
          tenantId: tid,
          cellId: item.cellId,
          epistemicStatus: item.epistemicStatus,
          relevanceScore,
          matchedTokens: Object.freeze(matchInfo.matchedTokens),
          rawPayload,
        });
      }
    }

    // Sort deterministically: highest score first, break ties by objectId
    scored.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.objectId.localeCompare(b.objectId);
    });

    const results = Object.freeze(scored.slice(0, limit));

    // Cache query results
    this._queryCache.set(tid, cacheKey, results);

    return results;
  }

  /**
   * Total items indexed for a given tenant.
   */
  public getIndexedCount(tenantId?: string): number {
    const tid = tenantId?.trim() || this._tenantId;
    return this._items.get(tid)?.size ?? 0;
  }

  /**
   * Clears indices and caches.
   */
  public clear(tenantId?: string): void {
    if (!tenantId) {
      this._postings.clear();
      this._items.clear();
      this._queryCache.clear();
      this._payloadCache.clear();
      return;
    }

    this._postings.delete(tenantId);
    this._items.delete(tenantId);
    this._queryCache.clear(tenantId);
    this._payloadCache.clear(tenantId);
  }
}
