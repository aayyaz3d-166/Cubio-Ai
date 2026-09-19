/**
 * CUBiO AI — PMA Task 346: InfinityLM Research Architecture
 * src/research/infinitylm/types.ts
 *
 * Formal contracts and type definitions for the InfinityLM research layer.
 * Positioned strictly above CUBiO Core with zero modification to frozen core components.
 */

export enum InfinityBaseState {
  GROUND = 'GROUND',               // State 0: Baseline vacuum / zero potential
  EXCITATION = 'EXCITATION',       // State 1: Activated state / energy injection
  SUPERPOSITION = 'SUPERPOSITION', // State 2: Multi-state probabilistic co-existence
  ENTANGLEMENT = 'ENTANGLEMENT',   // State 3: Non-local coupled correlation
  DISSIPATION = 'DISSIPATION',     // State 4: Entropic relaxation / energy dispersion
  COHERENCE = 'COHERENCE',         // State 5: Phase-locked resonant alignment
  COLLAPSE = 'COLLAPSE',           // State 6: Deterministic projective resolution
}

export enum ScaleTier {
  PLANCK = 'PLANCK',           // <= 10^-35 m
  SUBATOMIC = 'SUBATOMIC',     // 10^-18 to 10^-10 m
  ATOMIC = 'ATOMIC',           // 10^-10 to 10^-8 m
  MESOSCOPIC = 'MESOSCOPIC',   // 10^-8 to 10^-4 m
  MACROSCOPIC = 'MACROSCOPIC', // 10^-4 to 10^4 m
  COSMIC = 'COSMIC',           // >= 10^4 m
}

export interface ScaleVector {
  readonly tier: ScaleTier;
  readonly exponent: number;     // Order of magnitude (log10)
  readonly coefficient: number;  // Multiplicative factor [1.0, 10.0)
  readonly units?: string;
}

export enum PolarityVariant {
  FORWARD = 1,     // (+) Generative / forward evolution
  BALANCED = 0,    // (0) Ground / neutral equilibrium
  INVERSE = -1,    // (-) Reflective / reverse reconstruction
}

export interface SpatialCoordXYZ {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.618033988749895

export interface PhiTransformState {
  readonly phiFactor: number;          // Typically phi^k for k in Z
  readonly rotationAngleRad: number;   // Angle modulated by phi
  readonly transformedCoord: SpatialCoordXYZ;
  readonly determinant: number;
  readonly isLossless: boolean;
}

export enum EpistemicStatus {
  VERIFIED_CORE_CAPABILITY = 'VERIFIED_CORE_CAPABILITY', // Grounded in CUBiO Core / VDB / 1M Checkpoint
  EMPIRICALLY_VALIDATED = 'EMPIRICALLY_VALIDATED',       // Tested and verified in laboratory suite
  FORMAL_RESEARCH_HYPOTHESIS = 'FORMAL_RESEARCH_HYPOTHESIS', // Theoretical hypothesis (e.g. infinite state conjecture)
  UNVERIFIED_CONJECTURE = 'UNVERIFIED_CONJECTURE',       // Open speculation without formal proof
}

export interface InfinityReplica {
  readonly replicaId: string;
  readonly parentNodeId: string;
  readonly replicaIndex: number;
  readonly polarity: PolarityVariant;
  readonly scale: ScaleVector;
  readonly coord: SpatialCoordXYZ;
  readonly syncBarrierId: string;
  readonly replicaHash: string;
  readonly createdAt: number;
}

export interface InfinityNode {
  readonly id: string;
  readonly baseState: InfinityBaseState;
  readonly polarity: PolarityVariant;
  readonly scale: ScaleVector;
  readonly coord: SpatialCoordXYZ;
  readonly phiState?: PhiTransformState;
  readonly coreReferenceAddress?: number; // Read-only projection to Address 369 [0..368]
  readonly epistemicStatus: EpistemicStatus;
  readonly replicas: ReadonlyArray<InfinityReplica>;
  readonly metadata: Record<string, unknown>;
  readonly nodeHash: string;
  readonly timestamp: number;
}

export enum RelationType {
  ENTANGLED_WITH = 'ENTANGLED_WITH',
  SCALE_PROJECTION = 'SCALE_PROJECTION',
  PHI_TRANSFORM_OF = 'PHI_TRANSFORM_OF',
  POLARITY_INVERSE_OF = 'POLARITY_INVERSE_OF',
  REPLICA_OF = 'REPLICA_OF',
  STATE_TRANSITION = 'STATE_TRANSITION',
  READ_REFERENCE = 'READ_REFERENCE',
}

export interface InfinityRelation {
  readonly relationId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly type: RelationType;
  readonly weight: number;
  readonly bidirectional: boolean;
  readonly epistemicStatus: EpistemicStatus;
  readonly metadata?: Record<string, unknown>;
}

export interface InfinityTaskId {
  readonly taskId: string; // E.g., TASK-INF-346-XXXX
  readonly milestone: string;
  readonly originPhase: string;
  readonly hashDigest: string;
}

export interface InfinityExecutionResult<T = unknown> {
  readonly taskId: InfinityTaskId;
  readonly success: boolean;
  readonly epistemicStatus: EpistemicStatus;
  readonly data: T;
  readonly executionTimeMs: number;
  readonly coreIntegrityVerified: boolean;
}
