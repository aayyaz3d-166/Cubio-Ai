/**
 * CUBiO AI — PMA Task 394 & 395: Phase 26 Integration Architecture & Safety Gate Specification
 * 
 * Formal design specification for connecting Phase 25 procedural infrastructure to Main CUBiO Core.
 * Governs strict READ-ONLY VDB access, isolation boundaries, permitted data flow, prohibited mutations,
 * and fail-closed security invariants.
 */

export interface VdbReadOnlyBridgeContract {
  readonly sourceDatabasePath: string;
  readonly accessMode: "READ_ONLY_STRICT";
  readonly allowedQueries: string[];
  readonly prohibitedMutations: string[];
  readonly maxQueryBatchSize: number;
  readonly maxExecutionTimeoutMs: number;
  readonly maxHeapOverheadMB: number;
}

export interface Phase26DataFlowBoundary {
  readonly upstreamAuthority: "CUBiO Canonical VDB (data/cubio_studio.db)";
  readonly spatialAuthority: "Address369 Specification (src/core/address369.ts)";
  readonly intermediateBridge: "Phase26VdbReadOnlyAdapter";
  readonly downstreamConsumer: "InfinityLM Procedural Possibility Engine";
  readonly flowDirection: "ONE_WAY_READ_ONLY";
  readonly writeBackPermitted: false;
}

export interface FailClosedSecurityTrap {
  readonly isActuationBlocked: boolean;
  readonly trapOnWriteAttempt: boolean;
  readonly trapOnSchemaMutation: boolean;
  readonly trapOnOutOfBoundsCellId: boolean;
  readonly errorType: "FAIL_CLOSED_VIOLATION";
}

export class Phase26IntegrationArchitectureSpec {
  public static readonly BRIDGE_CONTRACT: VdbReadOnlyBridgeContract = {
    sourceDatabasePath: "data/cubio_studio.db",
    accessMode: "READ_ONLY_STRICT",
    allowedQueries: [
      "SELECT id, type, classification, dimension, cluster_id, status, source, record_json FROM studio_records WHERE id = ?",
      "SELECT id, type, classification, dimension, status, source, record_json FROM studio_records LIMIT ?",
      "SELECT count(*) as total FROM studio_records"
    ],
    prohibitedMutations: [
      "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "VACUUM", "PRAGMA writable_schema"
    ],
    maxQueryBatchSize: 100,
    maxExecutionTimeoutMs: 1000,
    maxHeapOverheadMB: 50,
  };

  public static readonly DATA_FLOW: Phase26DataFlowBoundary = {
    upstreamAuthority: "CUBiO Canonical VDB (data/cubio_studio.db)",
    spatialAuthority: "Address369 Specification (src/core/address369.ts)",
    intermediateBridge: "Phase26VdbReadOnlyAdapter",
    downstreamConsumer: "InfinityLM Procedural Possibility Engine",
    flowDirection: "ONE_WAY_READ_ONLY",
    writeBackPermitted: false,
  };

  public static readonly SECURITY_POLICY: FailClosedSecurityTrap = {
    isActuationBlocked: true,
    trapOnWriteAttempt: true,
    trapOnSchemaMutation: true,
    trapOnOutOfBoundsCellId: true,
    errorType: "FAIL_CLOSED_VIOLATION",
  };

  /** Validates an attempted SQL query against read-only safety rules */
  public static validateQuerySafety(sql: string): { isPermitted: boolean; violationReason?: string } {
    const upper = sql.trim().toUpperCase();
    for (const prohibited of this.BRIDGE_CONTRACT.prohibitedMutations) {
      if (upper.includes(prohibited)) {
        return {
          isPermitted: false,
          violationReason: `PROHIBITED_MUTATION: Query contains forbidden verb "${prohibited}"`,
        };
      }
    }
    if (!upper.startsWith("SELECT")) {
      return {
        isPermitted: false,
        violationReason: "PROHIBITED_OPERATION: Only SELECT queries are permitted in Phase 26 Bridge",
      };
    }
    return { isPermitted: true };
  }

  /** Validates spatial cell bounds (0 <= cellId <= 342) */
  public static validateCellBounds(cellId: number): boolean {
    return Number.isInteger(cellId) && cellId >= 0 && cellId <= 342;
  }
}
