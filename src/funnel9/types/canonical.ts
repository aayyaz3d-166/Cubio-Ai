/**
 * 3D Memory Studio - Funnel 9: Composite Canonicalization Types
 * 
 * Defines the immutable data contracts for canonical composite representations.
 * 
 * Invariants:
 * - Translation is the ONLY supported transform.
 * - Global origin is stripped during canonicalization.
 * - Relative 3D geometry is preserved relative to the deterministic canonical origin.
 * - Logical child ordering is strictly preserved.
 * - Negative relative offsets are valid.
 * - Readonly, pure, deterministic structures.
 */

export const FUNNEL9_TRANSFORM = 'TRANSLATION' as const;
export type Funnel9TransformType = typeof FUNNEL9_TRANSFORM;

/**
 * 3D Coordinate / Vector in integer grid units (Readonly)
 */
export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Relative 3D Offset from canonical origin (Readonly)
 */
export interface CanonicalOffset3D {
  readonly dx: number;
  readonly dy: number;
  readonly dz: number;
}

/**
 * Input Child Pattern specification prior to canonicalization
 */
export interface RawCompositeChildInput {
  /** Dictionary ID of the child pattern (Level 2) */
  readonly dictId: number;
  /** Spatial position: either absolute (x,y,z) or offset from composite origin */
  readonly position: Vector3D | CanonicalOffset3D;
  /** Logical child execution / presentation order (0, 1, 2, ...) */
  readonly order?: number;
  /** Transform type (Must be 'TRANSLATION') */
  readonly transform?: string;
  /** Optional transform metadata */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
  /** Optional sequence index */
  readonly sequenceIndex?: number;
}

/**
 * Input Composite specification prior to canonicalization
 */
export interface RawCompositeInput {
  /** Optional identifier (not used in canonical identity) */
  readonly compositeId?: number | string;
  /** Global composite origin (x, y, z) */
  readonly origin?: Vector3D;
  /** Ordered list of child records */
  readonly children: readonly RawCompositeChildInput[];
  /** Transform applied to composite (Must be 'TRANSLATION') */
  readonly transform?: string;
  /** Optional transform metadata */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
}

/**
 * Canonical Child Record (Readonly)
 * Contains the normalized relative position from canonical origin, dictionary ID, order, and transform.
 */
export interface CanonicalChildRecord {
  /** Child pattern dictionary ID */
  readonly dictId: number;
  /** Relative 3D offset from canonical origin */
  readonly offset: CanonicalOffset3D;
  /** Preserved logical order index (0-indexed) */
  readonly order: number;
  /** Transform type (Strictly 'TRANSLATION') */
  readonly transform: Funnel9TransformType;
  /** Transform metadata (sorted / immutable) */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
  /** Hierarchy Level (Level 2 Dictionary pattern) */
  readonly hierarchyLevel: 2;
}

/**
 * Canonical Composite Pattern (Readonly)
 * Completely free of global origin, fully normalized, containing exact relative geometry and ordering.
 */
export interface CanonicalComposite {
  /** Hierarchy level (Level 3 Composite) */
  readonly hierarchyLevel: 3;
  /** Total number of children */
  readonly childCount: number;
  /** Ordered array of canonical child records */
  readonly children: readonly CanonicalChildRecord[];
  /** Transform type (Strictly 'TRANSLATION') */
  readonly transform: Funnel9TransformType;
  /** Transform metadata */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
  /** Deterministic canonical signature string */
  readonly signature: string;
  /** Optional 32-bit hex fingerprint for accelerated hash table indexing */
  readonly fingerprint: string;
  /** Bounding box dimensions of the relative composite structure */
  readonly relativeBoundingBox: {
    readonly minDx: number;
    readonly maxDx: number;
    readonly minDy: number;
    readonly maxDy: number;
    readonly minDz: number;
    readonly maxDz: number;
    readonly spanX: number;
    readonly spanY: number;
    readonly spanZ: number;
  };
}

/**
 * Result of a canonicalization operation
 */
export interface CanonicalizationResult {
  readonly success: boolean;
  readonly canonical?: CanonicalComposite;
  readonly error?: string;
  readonly errorCode?:
    | 'EMPTY_CHILDREN'
    | 'UNSUPPORTED_TRANSFORM'
    | 'INVALID_COORDINATES'
    | 'INVALID_DICT_ID'
    | 'INVALID_ORDER';
}
