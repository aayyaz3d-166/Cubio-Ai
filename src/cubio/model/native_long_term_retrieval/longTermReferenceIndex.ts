/**
 * CUBiO AI — Task 176: Long-Term VDB Memory Retrieval
 * src/cubio/model/native_long_term_retrieval/longTermReferenceIndex.ts
 *
 * Lightweight Inverted Reference Index:
 * Indexes CanonicalMemoryReference descriptors across multiple facets:
 * - Inverted Term / Keyword index (for multi-token semantic retrieval)
 * - 3D HCP Spatial Lattice Cell index (0..342)
 * - Domain namespace index
 *
 * STRICT INVARIANTS:
 * - Stores ZERO raw body text in RAM (~120 bytes per indexed entry).
 * - Complete multi-tenant partition isolation.
 */

import { CanonicalMemoryReference } from '../native_memory_integration/types.js';
import { IndexStats, LongTermRetrievalTenantViolationError } from './types.js';

export class LongTermReferenceIndex {
  // tenantId -> objectId -> CanonicalMemoryReference
  private readonly referencesByTenant = new Map<string, Map<string, CanonicalMemoryReference>>();

  // tenantId -> term -> Set<objectId>
  private readonly termInvertedIndex = new Map<string, Map<string, Set<string>>>();

  // tenantId -> spatialCellId -> Set<objectId>
  private readonly spatialCellIndex = new Map<string, Map<number, Set<string>>>();

  // tenantId -> domain -> Set<objectId>
  private readonly domainIndex = new Map<string, Map<string, Set<string>>>();

  private getTenantRefMap(tenantId: string): Map<string, CanonicalMemoryReference> {
    if (!this.referencesByTenant.has(tenantId)) {
      this.referencesByTenant.set(tenantId, new Map());
    }
    return this.referencesByTenant.get(tenantId)!;
  }

  private getTenantTermIndex(tenantId: string): Map<string, Set<string>> {
    if (!this.termInvertedIndex.has(tenantId)) {
      this.termInvertedIndex.set(tenantId, new Map());
    }
    return this.termInvertedIndex.get(tenantId)!;
  }

  private getTenantSpatialIndex(tenantId: string): Map<number, Set<string>> {
    if (!this.spatialCellIndex.has(tenantId)) {
      this.spatialCellIndex.set(tenantId, new Map());
    }
    return this.spatialCellIndex.get(tenantId)!;
  }

  private getTenantDomainIndex(tenantId: string): Map<string, Set<string>> {
    if (!this.domainIndex.has(tenantId)) {
      this.domainIndex.set(tenantId, new Map());
    }
    return this.domainIndex.get(tenantId)!;
  }

  /**
   * Extracts clean search terms from a string.
   */
  public static tokenizeTerms(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().replace(/^[\.\-]+|[\.\-]+$/g, ''))
      .filter(t => t.length > 1);
  }

  /**
   * Indexes a canonical reference in memory.
   */
  public indexReference(reference: CanonicalMemoryReference, callerTenantId: string): void {
    if (reference.tenantId !== callerTenantId) {
      throw new LongTermRetrievalTenantViolationError(callerTenantId, reference.tenantId);
    }

    const refMap = this.getTenantRefMap(callerTenantId);
    refMap.set(reference.objectId, Object.freeze({ ...reference }));

    // 1. Index terms from summary and objectId
    const terms = new Set(LongTermReferenceIndex.tokenizeTerms(`${reference.summary} ${reference.objectId} ${reference.domain}`));
    const termMap = this.getTenantTermIndex(callerTenantId);
    for (const term of terms) {
      if (!termMap.has(term)) {
        termMap.set(term, new Set());
      }
      termMap.get(term)!.add(reference.objectId);
    }

    // 2. Index 3D HCP spatial cell
    if (reference.spatialCellId !== undefined) {
      const spatialMap = this.getTenantSpatialIndex(callerTenantId);
      if (!spatialMap.has(reference.spatialCellId)) {
        spatialMap.set(reference.spatialCellId, new Set());
      }
      spatialMap.get(reference.spatialCellId)!.add(reference.objectId);
    }

    // 3. Index domain
    if (reference.domain) {
      const domainMap = this.getTenantDomainIndex(callerTenantId);
      const dKey = reference.domain.toLowerCase();
      if (!domainMap.has(dKey)) {
        domainMap.set(dKey, new Set());
      }
      domainMap.get(dKey)!.add(reference.objectId);
    }
  }

  /**
   * Retrieves a single canonical reference by objectId.
   */
  public getReference(objectId: string, callerTenantId: string): CanonicalMemoryReference | null {
    const refMap = this.getTenantRefMap(callerTenantId);
    return refMap.get(objectId) ?? null;
  }

  /**
   * Finds candidate object IDs matching query criteria via set operations.
   */
  public findCandidateObjectIds(params: {
    callerTenantId: string;
    terms?: readonly string[];
    spatialCellId?: number;
    domain?: string;
  }): Set<string> {
    const { callerTenantId, terms, spatialCellId, domain } = params;

    let candidates: Set<string> | null = null;

    // Filter by terms (Union of matching sets)
    if (terms && terms.length > 0) {
      const termMap = this.getTenantTermIndex(callerTenantId);
      const termMatches = new Set<string>();
      for (const t of terms) {
        const matching = termMap.get(t.toLowerCase());
        if (matching) {
          for (const id of matching) termMatches.add(id);
        }
      }
      candidates = termMatches;
    }

    // Intersect with spatial cell filter
    if (spatialCellId !== undefined) {
      const spatialMap = this.getTenantSpatialIndex(callerTenantId);
      const spatialMatches = spatialMap.get(spatialCellId) ?? new Set<string>();
      if (candidates === null) {
        candidates = new Set(spatialMatches);
      } else {
        const intersected = new Set<string>();
        for (const id of candidates) {
          if (spatialMatches.has(id)) intersected.add(id);
        }
        candidates = intersected;
      }
    }

    // Intersect with domain filter
    if (domain) {
      const domainMap = this.getTenantDomainIndex(callerTenantId);
      const domainMatches = domainMap.get(domain.toLowerCase()) ?? new Set<string>();
      if (candidates === null) {
        candidates = new Set(domainMatches);
      } else {
        const intersected = new Set<string>();
        for (const id of candidates) {
          if (domainMatches.has(id)) intersected.add(id);
        }
        candidates = intersected;
      }
    }

    // If no filters were specified, return all object IDs for this tenant
    if (candidates === null) {
      const refMap = this.getTenantRefMap(callerTenantId);
      candidates = new Set(refMap.keys());
    }

    return candidates;
  }

  /**
   * Returns statistics about index size and memory usage for a tenant.
   */
  public getStats(callerTenantId: string): IndexStats {
    const refMap = this.getTenantRefMap(callerTenantId);
    const termMap = this.getTenantTermIndex(callerTenantId);
    const spatialMap = this.getTenantSpatialIndex(callerTenantId);

    // Approximate memory: ~120 bytes per reference + 32 bytes per index entry
    const refBytes = refMap.size * 120;
    const termBytes = termMap.size * 48;
    const spatialBytes = spatialMap.size * 32;

    return Object.freeze({
      tenantId: callerTenantId,
      totalIndexedReferences: refMap.size,
      indexedTermsCount: termMap.size,
      indexedSpatialCellsCount: spatialMap.size,
      indexMemoryBytes: refBytes + termBytes + spatialBytes,
    });
  }

  /**
   * Clears the index for a tenant or globally.
   */
  public clear(callerTenantId?: string): void {
    if (callerTenantId) {
      this.referencesByTenant.delete(callerTenantId);
      this.termInvertedIndex.delete(callerTenantId);
      this.spatialCellIndex.delete(callerTenantId);
      this.domainIndex.delete(callerTenantId);
    } else {
      this.referencesByTenant.clear();
      this.termInvertedIndex.clear();
      this.spatialCellIndex.clear();
      this.domainIndex.clear();
    }
  }
}
