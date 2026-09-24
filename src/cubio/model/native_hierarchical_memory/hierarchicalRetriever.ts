/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/hierarchicalRetriever.ts
 *
 * Deterministic Hierarchical Context Retriever:
 * - Cascaded search across L1 Local -> L2 Session -> L3 Long-Term -> L4 Canonical VDB.
 * - Deterministic scoring combining semantic relevance, epistemic weight, recency, and hit count.
 * - Load-on-demand content materialization from Primary VDB with SHA-256 verification.
 * - Strict multi-tenant isolation and bitwise reproducible retrieval digests.
 */

import * as crypto from 'crypto';
import {
  MemoryLevel,
  HierarchicalReference,
  HierarchicalRetrievalResult,
  HierarchicalMemoryTenantViolationError,
  HierarchicalMemoryIntegrityError,
} from './types.js';
import { HierarchicalStore } from './hierarchicalStore.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export class HierarchicalRetriever {
  private readonly store: HierarchicalStore;
  private readonly memoryCoord: ModelMemoryCoordinator;

  private static readonly EPISTEMIC_WEIGHTS: Readonly<Record<string, number>> = Object.freeze({
    AXIOM: 1.0,
    FACT: 0.95,
    DERIVED: 0.85,
    THEORY: 0.70,
    OBSERVATION: 0.50,
    HYPOTHESIS: 0.30,
  });

  constructor(store: HierarchicalStore, memoryCoord: ModelMemoryCoordinator) {
    this.store = store;
    this.memoryCoord = memoryCoord;
  }

  /**
   * Computes deterministic text similarity score between query and text / summary.
   */
  public static computeTextSimilarity(query: string, text: string): number {
    if (!query || !text) return 0.0;
    const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const tTokens = new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
    if (qTokens.length === 0 || tTokens.size === 0) return 0.0;

    let matches = 0;
    for (const q of qTokens) {
      if (tTokens.has(q)) matches++;
    }
    return Math.min(1.0, matches / qTokens.length);
  }

  /**
   * Evaluates combined retrieval rank score for a reference.
   */
  public static computeRankScore(ref: HierarchicalReference, querySimilarity: number): number {
    const epistemicWeight = this.EPISTEMIC_WEIGHTS[ref.epistemicStatus.toUpperCase()] ?? 0.5;
    const accessWeight = Math.min(1.0, ref.accessCount / 10);
    const baseRelevance = (ref.relevanceScore + querySimilarity) / 2;

    // Combined score: 45% relevance, 25% epistemic authority, 15% access freq, 15% anchor pin
    const anchorBonus = ref.isPinnedAnchor ? 0.15 : 0.0;
    const score = baseRelevance * 0.45 + epistemicWeight * 0.25 + accessWeight * 0.15 + anchorBonus;
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Executes cascaded hierarchical retrieval across all memory levels.
   */
  public retrieve(params: {
    query: string;
    callerTenantId: string;
    maxTokens?: number;
    minScore?: number;
    materializeContent?: boolean;
    levelsToSearch?: readonly MemoryLevel[];
  }): HierarchicalRetrievalResult {
    const startTime = Date.now();
    const {
      query,
      callerTenantId,
      maxTokens = 2048,
      minScore = 0.20,
      materializeContent = false,
      levelsToSearch = ['L1_LOCAL', 'L2_SESSION', 'L3_LONG_TERM', 'L4_CANONICAL_VDB'],
    } = params;

    const candidateMatches: {
      reference: HierarchicalReference;
      retrievedFromLevel: MemoryLevel;
      matchedContent?: string;
      combinedScore: number;
    }[] = [];

    // Search levels in order
    for (const level of levelsToSearch) {
      if (level === 'L1_LOCAL') {
        const l1Entries = this.store.getAllL1Entries(callerTenantId);
        for (const entry of l1Entries) {
          if (entry.tenantId !== callerTenantId) {
            throw new HierarchicalMemoryTenantViolationError(callerTenantId, entry.tenantId);
          }
          const sim = HierarchicalRetriever.computeTextSimilarity(query, entry.content);
          const syntheticRef: HierarchicalReference = {
            referenceId: entry.referenceId,
            objectId: entry.objectId,
            level: 'L1_LOCAL',
            tenantId: entry.tenantId,
            tokenCount: entry.tokenCount,
            byteLength: Buffer.byteLength(entry.content, 'utf8'),
            checksum: entry.checksum,
            relevanceScore: sim,
            accessCount: 1,
            lastAccessedTimestamp: entry.loadedAtTimestamp,
            epistemicStatus: 'OBSERVATION',
            version: 1,
            isPinnedAnchor: entry.isPinnedAnchor,
            summary: entry.content.slice(0, 60),
            provenance: { taskId: 'L1_ACTIVE_CONTEXT', createdAt: entry.loadedAtTimestamp },
          };
          const score = HierarchicalRetriever.computeRankScore(syntheticRef, sim);
          if (score >= minScore) {
            candidateMatches.push({
              reference: syntheticRef,
              retrievedFromLevel: 'L1_LOCAL',
              matchedContent: materializeContent ? entry.content : undefined,
              combinedScore: score,
            });
          }
        }
      } else if (level === 'L2_SESSION' || level === 'L3_LONG_TERM') {
        const refs = this.store.getReferencesAtLevel(level, callerTenantId);
        for (const ref of refs) {
          if (ref.tenantId !== callerTenantId) {
            throw new HierarchicalMemoryTenantViolationError(callerTenantId, ref.tenantId);
          }
          const sim = HierarchicalRetriever.computeTextSimilarity(query, ref.summary);
          const score = HierarchicalRetriever.computeRankScore(ref, sim);
          if (score >= minScore) {
            let content: string | undefined = undefined;
            if (materializeContent) {
              content = this.materializeFromVDB(ref, callerTenantId);
            }
            candidateMatches.push({
              reference: ref,
              retrievedFromLevel: level,
              matchedContent: content,
              combinedScore: score,
            });
          }
        }
      } else if (level === 'L4_CANONICAL_VDB') {
        // Query authoritative Primary VDB
        const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
        const vdbRefs = this.memoryCoord.retrieveContextReferences({
          tenantId: callerTenantId,
          keywords,
          limit: 10,
        });

        for (const ref of vdbRefs) {
          if (ref.tenantId !== callerTenantId) {
            throw new HierarchicalMemoryTenantViolationError(callerTenantId, ref.tenantId);
          }
          const rec = this.memoryCoord.getRecord(ref.objectId, callerTenantId);
          if (!rec) continue;

          const sim = HierarchicalRetriever.computeTextSimilarity(query, rec.content);
          const syntheticRef: HierarchicalReference = {
            referenceId: `href_vdb_${rec.reference.objectId}`,
            objectId: rec.reference.objectId,
            level: 'L4_CANONICAL_VDB',
            tenantId: rec.reference.tenantId,
            tokenCount: Math.ceil(rec.content.length / 4),
            byteLength: Buffer.byteLength(rec.content, 'utf8'),
            checksum: rec.reference.checksum,
            relevanceScore: sim,
            accessCount: 1,
            lastAccessedTimestamp: rec.reference.timestamp,
            epistemicStatus: rec.epistemicStatus,
            version: rec.reference.stateVersion,
            spatialCellId: rec.reference.spatialCellId,
            isPinnedAnchor: rec.isCanonicalKnowledge,
            summary: rec.reference.summary || rec.content.slice(0, 60),
            provenance: {
              sourceDocId: rec.sourcePointer ?? 'VDB_PERSISTENT',
              taskId: 'VDB_CANONICAL_SEARCH',
              createdAt: rec.reference.timestamp,
            },
          };
          const score = HierarchicalRetriever.computeRankScore(syntheticRef, sim);
          if (score >= minScore) {
            candidateMatches.push({
              reference: syntheticRef,
              retrievedFromLevel: 'L4_CANONICAL_VDB',
              matchedContent: materializeContent ? rec.content : undefined,
              combinedScore: score,
            });
          }
        }
      }
    }

    // Sort deterministically: score descending, then referenceId ascending
    candidateMatches.sort((a, b) => {
      if (Math.abs(b.combinedScore - a.combinedScore) > 0.0001) {
        return b.combinedScore - a.combinedScore;
      }
      return a.reference.referenceId.localeCompare(b.reference.referenceId);
    });

    // Deduplicate by objectId (keep highest scoring level match)
    const seenObjects = new Set<string>();
    const uniqueMatches: typeof candidateMatches = [];
    let accumulatedTokens = 0;

    for (const match of candidateMatches) {
      if (seenObjects.has(match.reference.objectId)) continue;
      if (accumulatedTokens + match.reference.tokenCount > maxTokens) continue;

      seenObjects.add(match.reference.objectId);
      uniqueMatches.push(match);
      accumulatedTokens += match.reference.tokenCount;
    }

    // Compute deterministic retrieval digest
    const hasher = crypto.createHash('sha256');
    hasher.update(`RETRIEVAL:${callerTenantId}:${query}:${uniqueMatches.length}:${accumulatedTokens}`);
    for (const m of uniqueMatches) {
      hasher.update(`:${m.reference.referenceId}:${m.reference.checksum}:${m.combinedScore.toFixed(4)}`);
    }
    const retrievalDigest = hasher.digest('hex');
    const queryLatencyMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      query,
      tenantId: callerTenantId,
      matches: Object.freeze(uniqueMatches),
      totalRetrievedTokens: accumulatedTokens,
      queryLatencyMs,
      retrievalDigest,
    });
  }

  /**
   * Materializes full text from authoritative Primary VDB with SHA-256 verification.
   */
  public materializeFromVDB(ref: HierarchicalReference, callerTenantId: string): string {
    if (ref.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, ref.tenantId);
    }

    const record = this.memoryCoord.getRecord(ref.objectId, callerTenantId);
    if (!record) {
      throw new HierarchicalMemoryIntegrityError(
        ref.referenceId,
        `VDB record "${ref.objectId}" not found for on-demand materialization.`
      );
    }

    // Anti-Tamper Check: Compute SHA-256 and compare against reference
    const computedHash = crypto.createHash('sha256').update(record.content).digest('hex');
    if (computedHash !== ref.checksum) {
      throw new HierarchicalMemoryIntegrityError(
        ref.referenceId,
        `Checksum mismatch during materialization. Reference: ${ref.checksum}, VDB content: ${computedHash}. Tampering detected.`
      );
    }

    return record.content;
  }
}
