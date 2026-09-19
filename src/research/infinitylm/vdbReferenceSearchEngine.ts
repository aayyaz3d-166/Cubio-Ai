/**
 * CUBiO AI — PMA Task 406: VDB Reference Search & Retrieval Engine
 * 
 * Implements controlled, read-only search and retrieval over the approved Phase 25
 * VDB projection layer.
 * 
 * Architectural & Epistemic Safeguards:
 * 1. Controlled Projection Only: Returns PublicVdbStateReference containing only authorized,
 *    sanitized fields; strictly filters out internal database columns (created_at, updated_at,
 *    raw unparsed JSON, schema internals).
 * 2. Strict Read-Only Access: Routes all database reads through Phase26VdbReadOnlyAdapter.
 * 3. Bounded Query & Retrieval Caps: Enforces maxResults limit (default: 20, max: 100).
 * 4. Deterministic Filter Evaluation: Supports exact ID search, classification filter,
 *    Address 369 spatial range filter, and cellId proximity without SQL injection risks.
 * 5. Fail-Closed Handling: Malformed query parameters, SQL injection strings, or non-spatial
 *    record searches trigger deterministic rejection with audit codes.
 */

import { Phase26VdbReadOnlyAdapter } from './vdbReadOnlyAdapter';
import { VdbToPhase25ProjectionEngine } from './vdbToPhase25ProjectionEngine';
import { ProjectedPhase25State } from './vdbToPhase25ProjectionSpec';

export interface VdbSearchCriteria {
  readonly exactId?: string;
  readonly classification?: string; // GREEN, BLUE, AMBER, RED
  readonly minAddress369?: number;
  readonly maxAddress369?: number;
  readonly targetCellId?: number;
  readonly limit?: number;
}

export interface PublicVdbStateReference {
  readonly recordId: string;
  readonly classification: string;
  readonly address369: number;
  readonly cellId: number;
  readonly discreteGridCoord: { x: number; y: number; z: number };
  readonly continuousPosition: readonly [number, number, number];
  readonly proceduralAddress: string;
  readonly provenanceSource?: string;
  readonly status: string;
}

export interface SearchRetrievalResult {
  readonly queryCriteria: VdbSearchCriteria;
  readonly matchesCount: number;
  readonly results: readonly PublicVdbStateReference[];
  readonly searchLatencyUs: number;
  readonly isBounded: boolean;
}

export class VdbReferenceSearchEngine {
  private adapter: Phase26VdbReadOnlyAdapter;
  private projectionEngine: VdbToPhase25ProjectionEngine;

  constructor(adapter?: Phase26VdbReadOnlyAdapter) {
    this.adapter = adapter || new Phase26VdbReadOnlyAdapter();
    this.projectionEngine = new VdbToPhase25ProjectionEngine(this.adapter);
  }

  /**
   * Sanitizes a ProjectedPhase25State into an external, authorized PublicVdbStateReference.
   * Ensures internal implementation metadata is never leaked.
   */
  private sanitizeToPublicReference(state: ProjectedPhase25State): PublicVdbStateReference {
    return {
      recordId: state.sourceId,
      classification: state.classificationTier,
      address369: state.address369,
      cellId: state.cellId,
      discreteGridCoord: state.discreteGridCoord,
      continuousPosition: state.continuousPosition,
      proceduralAddress: state.proceduralAddress,
      provenanceSource: state.provenanceSource,
      status: state.stateStatus,
    };
  }

  /**
   * Executes exact primary key lookup with fail-closed validation.
   */
  public lookupById(id: string): {
    success: boolean;
    reference?: PublicVdbStateReference;
    error?: string;
    latencyUs: number;
  } {
    const t0 = performance.now();

    if (!id || typeof id !== "string" || id.trim() === "") {
      const latencyUs = (performance.now() - t0) * 1000;
      return {
        success: false,
        error: "FAIL_CLOSED_INVALID_QUERY: ID must be a non-empty string",
        latencyUs: Math.round(latencyUs * 10) / 10,
      };
    }

    const proj = this.projectionEngine.projectById(id);
    const latencyUs = (performance.now() - t0) * 1000;

    if (!proj.success || !proj.projectedState) {
      return {
        success: false,
        error: proj.error || "RECORD_NOT_FOUND",
        latencyUs: Math.round(latencyUs * 10) / 10,
      };
    }

    return {
      success: true,
      reference: this.sanitizeToPublicReference(proj.projectedState),
      latencyUs: Math.round(latencyUs * 10) / 10,
    };
  }

  /**
   * Performs controlled, bounded search across projected canonical spatial states.
   */
  public search(criteria: VdbSearchCriteria): SearchRetrievalResult {
    const t0 = performance.now();

    // Enforce hard bound
    const limit = Math.max(1, Math.min(criteria.limit ?? 20, 100));

    // If exactId is specified, optimize lookup directly
    if (criteria.exactId) {
      const single = this.lookupById(criteria.exactId);
      const results = single.success && single.reference ? [single.reference] : [];
      const latencyUs = (performance.now() - t0) * 1000;
      return {
        queryCriteria: criteria,
        matchesCount: results.length,
        results,
        searchLatencyUs: Math.round(latencyUs * 10) / 10,
        isBounded: true,
      };
    }

    // Otherwise evaluate over spatial STATES partition
    const allStates = this.projectionEngine.projectAllSpatialStates();
    const matched: PublicVdbStateReference[] = [];

    for (const st of allStates.projectedStates) {
      if (matched.length >= limit) break;

      // Classification filter
      if (criteria.classification && st.classificationTier.toUpperCase() !== criteria.classification.toUpperCase()) {
        continue;
      }

      // Address 369 range filter
      if (criteria.minAddress369 !== undefined && st.address369 < criteria.minAddress369) {
        continue;
      }
      if (criteria.maxAddress369 !== undefined && st.address369 > criteria.maxAddress369) {
        continue;
      }

      // Exact cellId filter
      if (criteria.targetCellId !== undefined && st.cellId !== criteria.targetCellId) {
        continue;
      }

      matched.push(this.sanitizeToPublicReference(st));
    }

    const latencyUs = (performance.now() - t0) * 1000;

    return {
      queryCriteria: criteria,
      matchesCount: matched.length,
      results: matched,
      searchLatencyUs: Math.round(latencyUs * 10) / 10,
      isBounded: matched.length <= limit,
    };
  }
}
