/**
 * CUBiO AI — PMA Task 398: VDB to Phase 25 Projection Specification
 * 
 * Formal projection contract defining which canonical VDB fields may be projected
 * into Phase 25 state representations.
 * Strictly categorizes Authoritative Source Data, Derived Fields, Metadata, and Prohibited Fields.
 * Enforces deterministic, auditable, and reversible projection rules.
 */

import { Canonical369Bridge } from './canonical369Bridge';
import { StudioRecord } from '../../funnel71/types';
import { Coordinate3D } from '../../types/memory';
import { PackedStateAddressFields } from './compactStateAddressing';

export type FieldClassificationCategory =
  | "AUTHORITATIVE_SOURCE"
  | "DERIVED_SPATIAL"
  | "METADATA_AUDITABLE"
  | "PROHIBITED_INTERNAL";

export interface ProjectedPhase25State {
  // Authoritative Source Data
  readonly sourceId: string;
  readonly entityType: "STATES";
  readonly classificationTier: string;
  readonly spatialDimension: 3;
  readonly continuousPosition: readonly [number, number, number];

  // Derived Spatial Fields (via Address369)
  readonly discreteGridCoord: Coordinate3D;
  readonly cellId: number;
  readonly address369: number;
  readonly proceduralAddress: string;
  readonly packedFields: PackedStateAddressFields;

  // Auditable Context Metadata
  readonly clusterId?: string;
  readonly provenanceSource?: string;
  readonly stateStatus: string;
}

export class VdbToPhase25ProjectionSpec {
  public static readonly FIELD_CATEGORIES: Record<string, { category: FieldClassificationCategory; description: string }> = {
    id: { category: "AUTHORITATIVE_SOURCE", description: "Canonical primary entity identity string" },
    type: { category: "AUTHORITATIVE_SOURCE", description: "Entity discriminator (must be STATES)" },
    classification: { category: "AUTHORITATIVE_SOURCE", description: "Security and polarity tier (GREEN, BLUE, AMBER, RED)" },
    dimension: { category: "AUTHORITATIVE_SOURCE", description: "Spatial simulation dimension (must be 3)" },
    position: { category: "AUTHORITATIVE_SOURCE", description: "Continuous 3D spatial coordinate vector [x, y, z]" },
    cell_id: { category: "DERIVED_SPATIAL", description: "Linear cell index in [0..342] derived via Formula A" },
    address369: { category: "DERIVED_SPATIAL", description: "Canonical spatial address in [26..368]" },
    proceduralAddress: { category: "DERIVED_SPATIAL", description: "Packed 64-bit hexadecimal address (cva:0x...)" },
    cluster_id: { category: "METADATA_AUDITABLE", description: "Topological group clustering tag" },
    source: { category: "METADATA_AUDITABLE", description: "Simulation or ingestion provenance source" },
    status: { category: "METADATA_AUDITABLE", description: "Entity lifecycle status (ACTIVE)" },
    created_at: { category: "PROHIBITED_INTERNAL", description: "Physical database wall-clock creation timestamp" },
    updated_at: { category: "PROHIBITED_INTERNAL", description: "Physical database wall-clock update timestamp" },
    record_json: { category: "PROHIBITED_INTERNAL", description: "Raw unparsed database serialization string" },
  };

  /** Validates whether a raw StudioRecord meets the formal projection contract */
  public static validateRecordForProjection(record: StudioRecord): {
    valid: boolean;
    ruleViolations: string[];
  } {
    const ruleViolations: string[] = [];

    // VR-01: Must be STATES
    if (record.type !== "STATES") {
      ruleViolations.push(`VR-01: Type "${record.type}" is not STATES; non-spatial records prohibited from spatial projection`);
    }

    // VR-02: Must have 3-element position array of finite numbers
    if (!record.position || !Array.isArray(record.position) || record.position.length !== 3 ||
        !record.position.every(n => typeof n === "number" && Number.isFinite(n))) {
      ruleViolations.push("VR-02: Record position must be an array of exactly 3 finite numbers");
    }

    // VR-03: Dimension must be 3
    if (record.dimension !== 3) {
      ruleViolations.push(`VR-03: Dimension ${record.dimension} invalid; spatial projection requires dimension 3`);
    }

    // VR-04: ID must be a non-empty string
    if (!record.id || typeof record.id !== "string" || record.id.trim() === "") {
      ruleViolations.push("VR-04: Record ID must be a non-empty string");
    }

    return {
      valid: ruleViolations.length === 0,
      ruleViolations,
    };
  }

  /** Projects a valid StudioRecord into a formal ProjectedPhase25State */
  public static projectRecord(record: StudioRecord): ProjectedPhase25State {
    const check = this.validateRecordForProjection(record);
    if (!check.valid) {
      throw new Error(`PROJECTION_VALIDATION_ERROR: ${check.ruleViolations.join("; ")}`);
    }

    const pos = record.position!;
    const disc = Canonical369Bridge.discretizeContinuousPosition({
      x: pos[0],
      y: pos[1],
      z: pos[2],
    });

    const mapped = Canonical369Bridge.forwardMapSpatialToAddress(disc);

    // Prohibited fields (created_at, updated_at, record_json) are intentionally stripped
    return {
      sourceId: record.id,
      entityType: "STATES",
      classificationTier: record.classification,
      spatialDimension: 3,
      continuousPosition: [pos[0], pos[1], pos[2]],
      discreteGridCoord: disc,
      cellId: mapped.cellId,
      address369: mapped.address369,
      proceduralAddress: mapped.proceduralAddress,
      packedFields: mapped.fields,
      clusterId: record.clusterId,
      provenanceSource: record.source,
      stateStatus: record.status,
    };
  }

  /** Reconstructs spatial coordinate and address369 from a projected state (reversibility proof) */
  public static reverseProjectState(projected: ProjectedPhase25State): {
    reconstructedAddress369: number;
    reconstructedCellId: number;
    reconstructedCoord: Coordinate3D;
    isLossless: boolean;
  } {
    const rev = Canonical369Bridge.reverseMapAddressToSpatial(projected.address369);
    const isLossless = rev.cellId === projected.cellId &&
                       rev.discreteCoord.x === projected.discreteGridCoord.x &&
                       rev.discreteCoord.y === projected.discreteGridCoord.y &&
                       rev.discreteCoord.z === projected.discreteGridCoord.z;
    return {
      reconstructedAddress369: rev.address369,
      reconstructedCellId: rev.cellId,
      reconstructedCoord: rev.discreteCoord,
      isLossless,
    };
  }
}
