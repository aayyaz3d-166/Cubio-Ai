/**
 * CUBiO AI — PMA Task 402: Real VDB Grounded State Generation Engine
 * 
 * Enables Phase 25/26 state generation using validated real VDB references
 * through the approved read-only projection layer.
 * 
 * Key Architectural Constraints:
 * 1. Dual-Path Architecture: Real VDB-grounded generation operates alongside synthetic/procedural generation without replacing it.
 * 2. Explicit Provenance: Every generated state cleanly distinguishes its grounding origin:
 *    - GROUNDING_ORIGIN: "REAL_VDB_GROUNDED" vs "SYNTHETIC_PROCEDURAL".
 * 3. Immutable Sovereignty: Zero write-backs to canonical SQLite VDB or Core assets.
 * 4. Determinism: Identical inputs deterministically yield bit-for-bit identical state identities and hashes.
 */

import { Phase26VdbReadOnlyAdapter } from './vdbReadOnlyAdapter';
import { VdbToPhase25ProjectionEngine } from './vdbToPhase25ProjectionEngine';
import { ProjectedPhase25State } from './vdbToPhase25ProjectionSpec';
import { CompactStateAddressingEngine, PackedStateAddressFields } from './compactStateAddressing';
import { SpatialCoordXYZ } from './types';
import { ReconstructedStateNode } from './onDemandReconstruction';

export type StateGroundingOrigin = "REAL_VDB_GROUNDED" | "SYNTHETIC_PROCEDURAL";

export interface Phase25GroundedState {
  readonly stateId: string;
  readonly origin: StateGroundingOrigin;
  readonly isGroundedInVdb: boolean;
  
  // VDB Provenance (populated only if REAL_VDB_GROUNDED)
  readonly vdbProvenance?: {
    readonly sourceRecordId: string;
    readonly continuousPosition: readonly [number, number, number];
    readonly classification: string;
    readonly discreteGridCoord: { x: number; y: number; z: number };
    readonly cellId: number;
    readonly address369: number;
    readonly status: string;
  };

  // Phase 25 Procedural Identity
  readonly proceduralAddress: string;
  readonly packedFields: PackedStateAddressFields;
  readonly reconstructedNode: ReconstructedStateNode;
  readonly normalizedSpatialCoord: SpatialCoordXYZ;
  readonly generatedTimestamp: number;
}

export class VdbGroundedStateGenerator {
  private adapter: Phase26VdbReadOnlyAdapter;
  private projectionEngine: VdbToPhase25ProjectionEngine;

  constructor(adapter?: Phase26VdbReadOnlyAdapter) {
    this.adapter = adapter || new Phase26VdbReadOnlyAdapter();
    this.projectionEngine = new VdbToPhase25ProjectionEngine(this.adapter);
  }

  /**
   * Generates a Phase 25 state grounded in a real VDB record.
   * On-demand read-only projection -> compact address -> deterministic AST reconstruction.
   */
  public generateFromVdbRecord(recordId: string): Phase25GroundedState {
    const projResult = this.projectionEngine.projectById(recordId);
    if (!projResult.success || !projResult.projectedState) {
      throw new Error(`FAIL_CLOSED_VDB_GROUNDING: Record "${recordId}" cannot be grounded: ${projResult.error}`);
    }

    const projected: ProjectedPhase25State = projResult.projectedState;
    const resolved = CompactStateAddressingEngine.resolveAddress(projected.proceduralAddress);

    if (resolved.status !== "RESOLVED" || !resolved.reconstructedNode) {
      throw new Error(`FAIL_CLOSED_VDB_GROUNDING: Procedural address resolution failed: ${resolved.errorMessage}`);
    }

    const node = resolved.reconstructedNode;

    return {
      stateId: `phase25:vdb:${projected.sourceId}`,
      origin: "REAL_VDB_GROUNDED",
      isGroundedInVdb: true,
      vdbProvenance: {
        sourceRecordId: projected.sourceId,
        continuousPosition: projected.continuousPosition,
        classification: projected.classificationTier,
        discreteGridCoord: projected.discreteGridCoord,
        cellId: projected.cellId,
        address369: projected.address369,
        status: projected.stateStatus,
      },
      proceduralAddress: projected.proceduralAddress,
      packedFields: projected.packedFields,
      reconstructedNode: node,
      normalizedSpatialCoord: node.coord,
      generatedTimestamp: Date.now(),
    };
  }

  /**
   * Generates a purely synthetic/procedural Phase 25 state (unlinked to physical VDB).
   * Preserves procedural independence.
   */
  public generateSyntheticProceduralState(
    baseIndex: number,
    polarity: '+' | '-' = '+',
    scaleLevel: 1 | 2 | 3 = 1
  ): Phase25GroundedState {
    if (baseIndex < 1 || baseIndex > 100) {
      throw new Error(`FAIL_CLOSED_SYNTHETIC: Base index ${baseIndex} must be within [1..100]`);
    }

    const cvaAddress = CompactStateAddressingEngine.encodeAddress(baseIndex, polarity, scaleLevel);
    const resolved = CompactStateAddressingEngine.resolveAddress(cvaAddress);

    if (resolved.status !== "RESOLVED" || !resolved.reconstructedNode || !resolved.decoded) {
      throw new Error(`FAIL_CLOSED_SYNTHETIC: Resolution failed for procedural address: ${cvaAddress}`);
    }

    const node = resolved.reconstructedNode;

    return {
      stateId: `phase25:synthetic:base_${baseIndex}_${polarity}_${scaleLevel}`,
      origin: "SYNTHETIC_PROCEDURAL",
      isGroundedInVdb: false,
      proceduralAddress: cvaAddress,
      packedFields: resolved.decoded.fields,
      reconstructedNode: node,
      normalizedSpatialCoord: node.coord,
      generatedTimestamp: Date.now(),
    };
  }

  /**
   * Generates all real VDB grounded states currently validated in canonical database (42 STATES).
   */
  public generateAllGroundedStates(): {
    states: Phase25GroundedState[];
    totalGenerated: number;
    failures: Array<{ recordId: string; error: string }>;
    durationMs: number;
  } {
    const t0 = performance.now();
    const batch = this.projectionEngine.projectAllSpatialStates();
    const states: Phase25GroundedState[] = [];
    const failures: Array<{ recordId: string; error: string }> = [];

    for (const proj of batch.projectedStates) {
      try {
        const resolved = CompactStateAddressingEngine.resolveAddress(proj.proceduralAddress);
        if (resolved.status === "RESOLVED" && resolved.reconstructedNode) {
          states.push({
            stateId: `phase25:vdb:${proj.sourceId}`,
            origin: "REAL_VDB_GROUNDED",
            isGroundedInVdb: true,
            vdbProvenance: {
              sourceRecordId: proj.sourceId,
              continuousPosition: proj.continuousPosition,
              classification: proj.classificationTier,
              discreteGridCoord: proj.discreteGridCoord,
              cellId: proj.cellId,
              address369: proj.address369,
              status: proj.stateStatus,
            },
            proceduralAddress: proj.proceduralAddress,
            packedFields: proj.packedFields,
            reconstructedNode: resolved.reconstructedNode,
            normalizedSpatialCoord: resolved.reconstructedNode.coord,
            generatedTimestamp: Date.now(),
          });
        } else {
          failures.push({ recordId: proj.sourceId, error: resolved.errorMessage || "Resolution failure" });
        }
      } catch (err: any) {
        failures.push({ recordId: proj.sourceId, error: err.message });
      }
    }

    return {
      states,
      totalGenerated: states.length,
      failures,
      durationMs: Math.round((performance.now() - t0) * 1000) / 1000,
    };
  }
}
