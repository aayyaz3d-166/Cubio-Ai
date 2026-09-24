/**
 * CUBiO AI — Task 159: Native Model Scaling Architecture
 * src/cubio/model/native_scaling/types.ts
 *
 * Authoritative type contracts, enums, parameter accounting structures,
 * and manifest interfaces for scaling the native CUBiO language model.
 *
 * STRICT INVARIANTS:
 * 1. Zero external pretrained models (no Qwen, LLaMA, Mistral, Gemma, GPT, Claude, Gemini, BERT, etc.).
 * 2. Zero foreign weights or internet/cloud dependencies.
 * 3. Spatial authority: 343-cell HCP lattice + 26 symbolic anchors = Address 369.
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true fail-closed.
 * 5. Primary authority: VDB is primary persistent storage; .3dmemory is checkpoint/transport only.
 * 6. Tenant isolation and canonical provenance enforced at every tier.
 */

export const TASK_159_ID = 'CUBIO-TASK-159-NATIVE-MODEL-SCALING';
export const CUBIO_SCALING_FAMILY_ID = 'CUBIO-NATIVE-SCALING-FAMILY-V1';
export const IS_ACTUATION_BLOCKED = true;

/**
 * 6 Explicit Scaling Profiles from 219K to 100M parameters.
 */
export const NativeScalingProfileId = {
  NATIVE_219K: 'NATIVE_219K',
  NATIVE_1M: 'NATIVE_1M',
  NATIVE_5M: 'NATIVE_5M',
  NATIVE_20M: 'NATIVE_20M',
  NATIVE_50M: 'NATIVE_50M',
  NATIVE_100M: 'NATIVE_100M',
  CUSTOM: 'CUSTOM',
} as const;

export type NativeScalingProfileId = (typeof NativeScalingProfileId)[keyof typeof NativeScalingProfileId];

/**
 * Prohibited external model identifiers for sovereign isolation.
 */
export const PROHIBITED_EXTERNAL_MODELS: readonly string[] = Object.freeze([
  'qwen',
  'qwen1.5',
  'qwen2',
  'qwen2.5',
  'llama',
  'llama2',
  'llama3',
  'mistral',
  'mixtral',
  'gemma',
  'gpt',
  'gpt-3',
  'gpt-4',
  'claude',
  'gemini',
  'bert',
  'roberta',
  't5',
  'falcon',
  'deepseek',
  'phi',
  'phi-2',
  'phi-3',
  'chinchilla',
  'palm',
]);

/**
 * Native model architecture hyperparameters for scaling.
 */
export interface NativeModelArchitectureConfig {
  readonly profileId: NativeScalingProfileId;
  readonly modelName: string;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly ffnDimension: number; // 2 * hiddenDimension in native CUBiO architecture
  readonly vocabSize: number;
  readonly maxSequenceLength: number;
  readonly spatialCells: number; // fixed 343 HCP lattice cells
  readonly symbolicAnchors: number; // fixed 26 anchors
  readonly epistemicClasses: number; // fixed 7 epistemic classes
  readonly masterSeed: number;
  readonly description: string;
}

/**
 * Exact parameter accounting per tensor group.
 */
export interface NativeParameterBreakdown {
  readonly tokenEmbeddingParams: number;
  readonly positionalEmbeddingParams: number;
  readonly spatialEmbeddingParams: number;
  readonly attentionParamsTotal: number;
  readonly ffnParamsTotal: number;
  readonly layerNormParamsTotal: number;
  readonly epistemicHeadParams: number;
  readonly lmHeadParams: number;
  readonly backboneParams: number;
  readonly totalParameters: number;
  readonly tensorCount: number;
  readonly fp32WeightBytes: number;
  readonly int8WeightBytes: number;
}

/**
 * Memory footprint estimation.
 */
export interface NativeMemoryFootprint {
  readonly profileId: NativeScalingProfileId;
  readonly totalParameters: number;
  readonly residentWeightBytesFP32: number;
  readonly residentWeightBytesFP16: number;
  readonly residentWeightBytesINT8: number;
  readonly activationWorkingSetBytes: number;
  readonly peakRamEstimateBytes: number;
  readonly isWithinBudget: boolean;
  readonly maxAllowedRamBytes: number;
}

/**
 * Bounded resource limits enforced by Resource Governor.
 */
export interface NativeResourceLimits {
  readonly maxParameters: number; // absolute ceiling e.g. 105,000,000
  readonly minParameters: number; // 200,000
  readonly maxLayerCount: number; // 32
  readonly maxHiddenDimension: number; // 1024
  readonly maxSequenceLength: number; // 4096
  readonly maxRamBytes: number; // 1024 * 1024 * 1024 (1 GB RAM hard limit for execution)
  readonly maxForwardLatencyMs: number; // 5000 ms limit
}

/**
 * Deterministic model configuration & version manifest.
 */
export interface NativeModelManifest {
  readonly manifestVersion: string;
  readonly modelId: string;
  readonly profileId: NativeScalingProfileId;
  readonly stateVersion: number;
  readonly tenantId: string;
  readonly config: NativeModelArchitectureConfig;
  readonly parameterBreakdown: NativeParameterBreakdown;
  readonly canonicalChecksum: string;
  readonly stateHash: string;
  readonly createdAt: string;
  readonly isActuationBlocked: boolean;
  readonly isNativeOnly: boolean;
}

/**
 * Checkpoint serialization record for streaming .3dmemory.
 */
export interface NativeScalingCheckpointRecord {
  readonly checkpointId: string;
  readonly profileId: NativeScalingProfileId;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly totalParameters: number;
  readonly stateHash: string;
  readonly vdbSynced: boolean;
  readonly weightsPayload: string; // serialized deterministic weights
  readonly timestamp: number;
}
