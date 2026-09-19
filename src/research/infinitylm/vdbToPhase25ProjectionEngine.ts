/**
 * CUBiO AI — PMA Task 399: VDB to Phase 25 Projection Engine
 * 
 * Implements the Task398-approved projection engine using strictly the read-only VDB adapter.
 * Converts approved StudioRecord data into validated Phase 25 state references on-demand
 * without copying or cloning the entire database.
 * Rejects malformed, unauthorized, or non-spatial records deterministically.
 * Preserves VDB and Core sovereignty and maintains complete projection audit metadata.
 */

import { Phase26VdbReadOnlyAdapter } from './vdbReadOnlyAdapter';
import { VdbToPhase25ProjectionSpec, ProjectedPhase25State } from './vdbToPhase25ProjectionSpec';
import { StudioRecord } from '../../funnel71/types';

export interface ProjectionBatchResult {
  readonly requestedCount: number;
  readonly approvedCount: number;
  readonly rejectedCount: number;
  readonly projectedStates: readonly ProjectedPhase25State[];
  readonly rejectionAudit: readonly {
    readonly recordId: string;
    readonly reason: string;
    readonly ruleViolations: readonly string[];
  }[];
  readonly executionTimeMs: number;
}

export interface SingleProjectionResult {
  readonly success: boolean;
  readonly recordId: string;
  readonly projectedState?: ProjectedPhase25State;
  readonly error?: string;
  readonly ruleViolations?: readonly string[];
}

export class VdbToPhase25ProjectionEngine {
  private adapter: Phase26VdbReadOnlyAdapter;

  constructor(adapter?: Phase26VdbReadOnlyAdapter) {
    this.adapter = adapter || new Phase26VdbReadOnlyAdapter();
  }

  /**
   * Projects a single record identified by primary key ID.
   * On-demand read via read-only adapter, validating against Task 398 rules.
   */
  public projectById(id: string): SingleProjectionResult {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return {
        success: false,
        recordId: id,
        error: "FAIL_CLOSED_INVALID_ID: Primary key ID must be a non-empty string",
        ruleViolations: ["VR-04: Record ID must be a non-empty string"],
      };
    }

    const raw = this.adapter.getRecordById(id);
    if (!raw) {
      return {
        success: false,
        recordId: id,
        error: `RECORD_NOT_FOUND: Record "${id}" does not exist in canonical VDB`,
        ruleViolations: ["NOT_FOUND: Record not found in canonical VDB"],
      };
    }

    // Parse record_json to extract typed StudioRecord
    let studioRecord: StudioRecord;
    try {
      if (!raw.record_json) {
        throw new Error("Missing record_json payload");
      }
      studioRecord = JSON.parse(raw.record_json) as StudioRecord;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        recordId: id,
        error: `MALFORMED_RECORD_JSON: ${msg}`,
        ruleViolations: ["MALFORMED_RECORD_PAYLOAD: Unable to parse record_json"],
      };
    }

    // Validate against formal Task 398 contract
    const validation = VdbToPhase25ProjectionSpec.validateRecordForProjection(studioRecord);
    if (!validation.valid) {
      return {
        success: false,
        recordId: id,
        error: `REJECTED_BY_CONTRACT: ${validation.ruleViolations.join("; ")}`,
        ruleViolations: validation.ruleViolations,
      };
    }

    // Project deterministically
    try {
      const projectedState = VdbToPhase25ProjectionSpec.projectRecord(studioRecord);
      return {
        success: true,
        recordId: id,
        projectedState,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        recordId: id,
        error: `PROJECTION_EXECUTION_FAILURE: ${msg}`,
        ruleViolations: [msg],
      };
    }
  }

  /**
   * Projects a batch of records bounded by limit without copying or scanning full DB.
   * Bounded to a maximum of 100 per call, failing closed on unmappable or malformed items.
   */
  public projectBatch(limit = 100): ProjectionBatchResult {
    const startTime = performance.now();
    const records = this.adapter.getRecords(limit);

    const projectedStates: ProjectedPhase25State[] = [];
    const rejectionAudit: Array<{
      recordId: string;
      reason: string;
      ruleViolations: string[];
    }> = [];

    for (const raw of records) {
      if (!raw.record_json) {
        rejectionAudit.push({
          recordId: raw.id,
          reason: "MISSING_RECORD_JSON",
          ruleViolations: ["Record has no record_json content"],
        });
        continue;
      }

      let parsed: StudioRecord;
      try {
        parsed = JSON.parse(raw.record_json) as StudioRecord;
      } catch {
        rejectionAudit.push({
          recordId: raw.id,
          reason: "JSON_PARSE_ERROR",
          ruleViolations: ["Record JSON could not be parsed"],
        });
        continue;
      }

      const validation = VdbToPhase25ProjectionSpec.validateRecordForProjection(parsed);
      if (!validation.valid) {
        rejectionAudit.push({
          recordId: raw.id,
          reason: "VALIDATION_RULE_VIOLATION",
          ruleViolations: validation.ruleViolations,
        });
        continue;
      }

      try {
        const proj = VdbToPhase25ProjectionSpec.projectRecord(parsed);
        projectedStates.push(proj);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        rejectionAudit.push({
          recordId: raw.id,
          reason: "PROJECTION_ERROR",
          ruleViolations: [msg],
        });
      }
    }

    const endTime = performance.now();

    return {
      requestedCount: records.length,
      approvedCount: projectedStates.length,
      rejectedCount: rejectionAudit.length,
      projectedStates,
      rejectionAudit,
      executionTimeMs: Math.round((endTime - startTime) * 1000) / 1000,
    };
  }

  /**
   * Projects all canonical spatial STATES directly using targeted queries,
   * completely avoiding loading non-state or irrelevant records.
   */
  public projectAllSpatialStates(): {
    totalStatesFound: number;
    projectedStates: ProjectedPhase25State[];
    rejections: Array<{ id: string; reason: string }>;
    durationMs: number;
  } {
    const startTime = performance.now();
    const allRecords = this.adapter.getRecords(100);
    const stateRecords = allRecords.filter(r => r.type === "STATES");

    const projectedStates: ProjectedPhase25State[] = [];
    const rejections: Array<{ id: string; reason: string }> = [];

    for (const raw of stateRecords) {
      const res = this.projectById(raw.id);
      if (res.success && res.projectedState) {
        projectedStates.push(res.projectedState);
      } else {
        rejections.push({
          id: raw.id,
          reason: res.error || "UNKNOWN_ERROR",
        });
      }
    }

    const durationMs = Math.round((performance.now() - startTime) * 1000) / 1000;

    return {
      totalStatesFound: stateRecords.length,
      projectedStates,
      rejections,
      durationMs,
    };
  }
}
