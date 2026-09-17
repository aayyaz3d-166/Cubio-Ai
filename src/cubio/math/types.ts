/**
 * CUBiO AI — Task 17: Native Mathematical Representation Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/types.ts
 *
 * Master type declarations for sovereign deterministic mathematical primitives:
 * - Scalar (finite numeric real values)
 * - Integer (finite discrete integral values)
 * - Normalized (scalars bounded strictly to [0.0, 1.0])
 * - Vector (bounded, immutable numeric arrays)
 * - Coordinate (3D spatial/unit coordinates)
 * - Probability Distribution (discrete finite non-negative values summing to 1.0)
 * - Matrix Metadata (bounded dimension descriptors)
 * - Math State (named composite mapping of native mathematical values)
 *
 * ARCHITECTURAL LOCKS:
 * 1. ZERO external model dependencies (No Qwen, LLaMA, GPT, HuggingFace, ONNX).
 * 2. Pure immutable mathematical contracts (Readonly fields and readonly arrays).
 * 3. Finite numerical safety: NaN, +Infinity, and -Infinity are strictly prohibited.
 * 4. Deterministic canonical representation and SHA-256 checksum on all primitives.
 */

export type NativeMathType =
  | 'SCALAR'
  | 'INTEGER'
  | 'NORMALIZED'
  | 'VECTOR'
  | 'COORDINATE'
  | 'PROBABILITY_DISTRIBUTION'
  | 'MATRIX_METADATA'
  | 'MATH_STATE';

export type CoordinateDomain =
  | 'CANONICAL_SPATIAL_343' // Spatial lattice [0..6] on X, Y, Z
  | 'NORMALIZED_UNIT'       // Continuous unit space [0.0, 1.0] on X, Y, Z
  | 'BOUNDED_CARTESIAN';    // Configured finite Cartesian bounds

export interface CoordinateDomainBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/**
 * Common metadata present on every canonical native mathematical representation.
 */
export interface NativeMathBase {
  readonly mathType: NativeMathType;
  /** Deterministic canonical SHA-256 checksum */
  readonly checksum: string;
}

export interface NativeMathScalar extends NativeMathBase {
  readonly mathType: 'SCALAR';
  readonly value: number;
}

export interface NativeMathInteger extends NativeMathBase {
  readonly mathType: 'INTEGER';
  readonly value: number;
}

export interface NativeMathNormalized extends NativeMathBase {
  readonly mathType: 'NORMALIZED';
  /** Normalized value guaranteed in [0.0, 1.0] */
  readonly value: number;
  /** Optional pre-normalization raw magnitude */
  readonly rawValue?: number;
  /** Optional domain scale range applied (e.g. 999 or custom) */
  readonly scaleDomain?: number;
}

export interface NativeMathVector extends NativeMathBase {
  readonly mathType: 'VECTOR';
  /** Immutable bounded array of finite numbers */
  readonly values: readonly number[];
  /** Fixed dimensionality / length */
  readonly length: number;
}

export interface NativeMathCoordinate extends NativeMathBase {
  readonly mathType: 'COORDINATE';
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly domain: CoordinateDomain;
}

export interface NativeMathDistribution extends NativeMathBase {
  readonly mathType: 'PROBABILITY_DISTRIBUTION';
  /** Probability values p_i >= 0 */
  readonly probabilities: readonly number[];
  /** Exact numerical sum of probabilities */
  readonly sum: number;
  /** Numerical tolerance accepted during validation */
  readonly tolerance: number;
}

export interface NativeMathMatrixMeta extends NativeMathBase {
  readonly mathType: 'MATRIX_METADATA';
  readonly rows: number;
  readonly cols: number;
  readonly elementCount: number;
  readonly isSquare: boolean;
  readonly format?: string;
}

export interface NativeMathState extends NativeMathBase {
  readonly mathType: 'MATH_STATE';
  readonly stateId: string;
  readonly values: Readonly<Record<string, NativeMathValue>>;
}

/**
 * Discriminated union of all native mathematical primitive types.
 */
export type NativeMathValue =
  | NativeMathScalar
  | NativeMathInteger
  | NativeMathNormalized
  | NativeMathVector
  | NativeMathCoordinate
  | NativeMathDistribution
  | NativeMathMatrixMeta
  | NativeMathState;

export const MAX_VECTOR_LENGTH = 1024;
export const DEFAULT_PROBABILITY_TOLERANCE = 1e-6;
