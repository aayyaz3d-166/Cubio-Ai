/**
 * CUBiO AI — Task 164: Native MLP / Feature Capacity Scaling
 * src/cubio/model/native_mlp_feature/types.ts
 *
 * Authoritative contracts, profile specifications, and interface definitions
 * for native MLP / feed-forward feature capacity scaling.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign MLP architectures (no SwiGLU, Mixtral MoE, DeepSeek MoE, Mamba SSM, RWKV, etc.).
 * 2. Pure native deterministic computation; zero external pretrained weights.
 * 3. Controlled configuration profiles with hard capacity validation bounds.
 * 4. Integration with Phase 10 reasoning state and canonical VDB memory without duplicate payloads.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 6. Primary persistent authority: VDB; .3dmemory is checkpoint transport only.
 */

export const TASK_164_ID = 'CUBIO-TASK-164-NATIVE-MLP-FEATURE-SCALING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * 7 Controlled Feature Scaling Profiles spanning 128 to 3,840 intermediate feature dimensions.
 */
export const MlpFeatureScaleProfile = {
  MLP_TINY: 'MLP_TINY',           // d=64,  ffn=128,  ratio=2.0x (219K Profile)
  MLP_EDGE: 'MLP_EDGE',           // d=128, ffn=256,  ratio=2.0x (1M Profile)
  MLP_COMPACT: 'MLP_COMPACT',     // d=256, ffn=768,  ratio=3.0x (5M Profile)
  MLP_BALANCED: 'MLP_BALANCED',   // d=384, ffn=1536, ratio=4.0x (20M Profile)
  MLP_EXTENDED: 'MLP_EXTENDED',   // d=512, ffn=2048, ratio=4.0x (50M Profile)
  MLP_SOVEREIGN: 'MLP_SOVEREIGN', // d=640, ffn=2560, ratio=4.0x (100M Profile)
  MLP_MAX_CAPACITY: 'MLP_MAX_CAPACITY', // d=640, ffn=3840, ratio=6.0x (Max Capacity Ceiling)
} as const;

export type MlpFeatureScaleProfile = (typeof MlpFeatureScaleProfile)[keyof typeof MlpFeatureScaleProfile];

/**
 * Specification for a concrete feature profile.
 */
export interface MlpProfileSpec {
  readonly profile: MlpFeatureScaleProfile;
  readonly hiddenDimension: number;
  readonly intermediateDimension: number;
  readonly expansionRatio: number;
  readonly estimatedFlopsPerToken: number;
  readonly memoryFootprintBytes: number; // Single layer weights (FP32)
}

/**
 * Profile registry mapping each profile identifier to its exact parameters.
 */
export const MLP_PROFILE_CATALOG: Readonly<Record<MlpFeatureScaleProfile, MlpProfileSpec>> = Object.freeze({
  MLP_TINY: {
    profile: 'MLP_TINY',
    hiddenDimension: 64,
    intermediateDimension: 128,
    expansionRatio: 2.0,
    estimatedFlopsPerToken: 4 * 64 * 128, // 32,768 FLOPs
    memoryFootprintBytes: (64 * 128 + 128 * 64) * 4, // 65,536 bytes
  },
  MLP_EDGE: {
    profile: 'MLP_EDGE',
    hiddenDimension: 128,
    intermediateDimension: 256,
    expansionRatio: 2.0,
    estimatedFlopsPerToken: 4 * 128 * 256, // 131,072 FLOPs
    memoryFootprintBytes: (128 * 256 + 256 * 128) * 4, // 262,144 bytes
  },
  MLP_COMPACT: {
    profile: 'MLP_COMPACT',
    hiddenDimension: 256,
    intermediateDimension: 768,
    expansionRatio: 3.0,
    estimatedFlopsPerToken: 4 * 256 * 768, // 786,432 FLOPs
    memoryFootprintBytes: (256 * 768 + 768 * 256) * 4, // 1,572,864 bytes
  },
  MLP_BALANCED: {
    profile: 'MLP_BALANCED',
    hiddenDimension: 384,
    intermediateDimension: 1536,
    expansionRatio: 4.0,
    estimatedFlopsPerToken: 4 * 384 * 1536, // 2,359,296 FLOPs
    memoryFootprintBytes: (384 * 1536 + 1536 * 384) * 4, // 4,718,592 bytes
  },
  MLP_EXTENDED: {
    profile: 'MLP_EXTENDED',
    hiddenDimension: 512,
    intermediateDimension: 2048,
    expansionRatio: 4.0,
    estimatedFlopsPerToken: 4 * 512 * 2048, // 4,194,304 FLOPs
    memoryFootprintBytes: (512 * 2048 + 2048 * 512) * 4, // 8,388,608 bytes
  },
  MLP_SOVEREIGN: {
    profile: 'MLP_SOVEREIGN',
    hiddenDimension: 640,
    intermediateDimension: 2560,
    expansionRatio: 4.0,
    estimatedFlopsPerToken: 4 * 640 * 2560, // 6,553,600 FLOPs
    memoryFootprintBytes: (640 * 2560 + 2560 * 640) * 4, // 13,107,200 bytes
  },
  MLP_MAX_CAPACITY: {
    profile: 'MLP_MAX_CAPACITY',
    hiddenDimension: 640,
    intermediateDimension: 3840,
    expansionRatio: 6.0,
    estimatedFlopsPerToken: 4 * 640 * 3840, // 9,830,400 FLOPs
    memoryFootprintBytes: (640 * 3840 + 3840 * 640) * 4, // 19,660,800 bytes
  },
});

/**
 * Native non-linear activation functions.
 */
export type NativeActivationFunction =
  | 'NATIVE_RELU'
  | 'NATIVE_GELU'
  | 'NATIVE_SILU_APPROX'
  | 'NATIVE_POLYNOMIAL_HCP';

/**
 * Prohibited foreign MLP architectures and external weight frameworks.
 */
export const PROHIBITED_FOREIGN_MLP_ARCHITECTURES: readonly string[] = Object.freeze([
  'swiglu',
  'swi-glu',
  'mixtral-moe',
  'switchtransformer-moe',
  'deepseek-moe',
  'mamba-ssm-mlp',
  'rwkv-channelmix',
  'transformer-xl-ffn',
  'megatron-lm-mlp',
]);

/**
 * Hyperparameters for instantiated MLP block.
 */
export interface MlpHyperparameters {
  readonly profile: MlpFeatureScaleProfile;
  readonly hiddenDimension: number;
  readonly intermediateDimension: number;
  readonly expansionRatio: number;
  readonly activation: NativeActivationFunction;
  readonly hasResidual: boolean;
  readonly hasLayerNorm: boolean;
  readonly seed?: number;
}

/**
 * Weights for an instantiated scaled MLP block.
 */
export interface ScaledMlpWeights {
  readonly upWeight: readonly (readonly number[])[];   // [hiddenDim x intermediateDim]
  readonly downWeight: readonly (readonly number[])[]; // [intermediateDim x hiddenDim]
  readonly normGamma: readonly number[];              // [hiddenDim]
  readonly gateWeight?: readonly (readonly number[])[]; // Optional native gating [hiddenDim x intermediateDim]
}

/**
 * Execution options for MLP forward pass.
 */
export interface MlpForwardOptions {
  readonly spatialCellId?: number; // 0..342 for HCP lattice modulation
  readonly tenantId?: string;
  readonly recordMetrics?: boolean;
}

/**
 * Output of MLP forward pass.
 */
export interface MlpForwardOutput {
  readonly outputFeatures: readonly (readonly number[])[]; // [seqLen x hiddenDim]
  readonly intermediateActivations?: readonly (readonly number[])[]; // [seqLen x intermediateDim]
  readonly meanActivationEnergy: number;
  readonly totalFlops: number;
  readonly latencyMs: number;
  readonly stateHash: string;
}

/**
 * Epistemic probability vector projected from feature space (7 classes).
 */
export type EpistemicDistribution = readonly [
  number, // FACT
  number, // AXIOM
  number, // DERIVED
  number, // HYPOTHESIS
  number, // CONJECTURE
  number, // PREDICTION
  number  // UNVERIFIED
];

/**
 * Canonical reference handle pointing to feature memory in primary VDB.
 */
export interface FeatureRepresentationHandle {
  readonly handleId: string;
  readonly tenantId: string;
  readonly profile: MlpFeatureScaleProfile;
  readonly objectId: string;
  readonly stateVersion: number;
  readonly featureHash: string;
  readonly byteSize: number;
  readonly vdbSynced: boolean;
  readonly createdAt: string;
}

/**
 * Record integrating MLP feature state with Phase 10 reasoning engines.
 */
export interface FeatureReasoningBridgeRecord {
  readonly bridgeId: string;
  readonly tenantId: string;
  readonly profile: MlpFeatureScaleProfile;
  readonly dominantEpistemicClass: string;
  readonly epistemicDistribution: EpistemicDistribution;
  readonly reasoningGroundingScore: number;
  readonly featureHandle: FeatureRepresentationHandle;
  readonly isActuationBlocked: boolean;
  readonly stateHash: string;
}

/**
 * Checkpoint contract for MLP feature state export to .3dmemory.
 */
export interface MlpCheckpoint {
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly profile: MlpFeatureScaleProfile;
  readonly stateVersion: number;
  readonly stateHash: string;
  readonly totalParameters: number;
  readonly vdbSynced: boolean;
  readonly serializedPayload: string;
  readonly timestamp: number;
}

/**
 * Performance metrics for profiled MLP execution.
 */
export interface MlpProfileMetrics {
  readonly profile: MlpFeatureScaleProfile;
  readonly sequenceLength: number;
  readonly hiddenDimension: number;
  readonly intermediateDimension: number;
  readonly totalFlops: number;
  readonly latencyMs: number;
  readonly throughputFeaturesPerSec: number;
  readonly memoryFootprintBytes: number;
  readonly isDeterministic: boolean;
}

