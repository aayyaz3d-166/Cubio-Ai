/**
 * CUBiO AI — Task 160: Native Parameter Expansion
 * src/cubio/model/native_expansion/types.ts
 *
 * Authoritative contracts, interfaces, and constants for native parameter expansion
 * from the 219K baseline to the approved 1M scaling profile.
 *
 * HARD CONSTRAINTS:
 * 1. Zero foreign pretrained weights or cloud checkpoints (no Qwen, LLaMA, GPT, Claude, etc.).
 * 2. Exact parameter accounting: 219,264 -> 1,045,760 parameters.
 * 3. Spatial authority: 343-cell HCP lattice + 26 symbolic anchors = Address 369.
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 5. Primary VDB persistence authority; .3dmemory is checkpoint transport only.
 */

export const TASK_160_ID = 'CUBIO-TASK-160-NATIVE-PARAMETER-EXPANSION';
export const BASELINE_219K_ID = 'CUBIO-NATIVE-MODEL-V1';
export const EXPANDED_1M_ID = 'CUBIO-NATIVE-EXPANDED-1M-V1';
export const IS_ACTUATION_BLOCKED = true;

export type TensorGroup = 'EMBEDDING' | 'ATTENTION' | 'MLP' | 'NORM' | 'HEAD';

export const ExpansionStrategy = {
  SUB_MATRIX_PRESERVE: 'SUB_MATRIX_PRESERVE',
  ORTHOGONAL_SOVEREIGN_INIT: 'ORTHOGONAL_SOVEREIGN_INIT',
} as const;

export type ExpansionStrategy = (typeof ExpansionStrategy)[keyof typeof ExpansionStrategy];

/**
 * Specification for an individual allocated tensor in the expanded model.
 */
export interface ExpandedTensorSpec {
  readonly tensorName: string;
  readonly group: TensorGroup;
  readonly shape: readonly number[];
  readonly parameterCount: number;
  readonly dtype: 'float32';
  readonly isExpandedFromBaseline: boolean;
  readonly baseTensorShape?: readonly number[];
  readonly baseParameterCount?: number;
}

/**
 * Full tensor breakdown and allocation catalog.
 */
export interface ParameterAllocationCatalog {
  readonly modelId: string;
  readonly targetParameters: number;
  readonly tensorCount: number;
  readonly tensors: readonly ExpandedTensorSpec[];
  readonly embeddingParams: number;
  readonly attentionParams: number;
  readonly mlpParams: number;
  readonly normParams: number;
  readonly headParams: number;
}

/**
 * Native Layer weights in the 1M expanded architecture.
 */
export interface ExpandedLayerWeights {
  readonly layerIndex: number;
  qWeight: number[][];    // [128, 128]
  kWeight: number[][];    // [128, 128]
  vWeight: number[][];    // [128, 128]
  outWeight: number[][];  // [128, 128]
  ffn1Weight: number[][]; // [128, 256]
  ffn2Weight: number[][]; // [256, 128]
  norm1Gamma: number[];   // [128]
  norm2Gamma: number[];   // [128]
}

/**
 * In-memory weights representation for the expanded 1M model.
 */
export interface ExpandedModelWeights {
  tokenEmbedding: number[][];       // [768, 128]
  positionalEmbedding: number[][];  // [128, 128]
  spatialEmbedding: number[][];     // [343, 128]
  layers: ExpandedLayerWeights[];   // 6 layers
  epistemicHead: number[][];        // [128, 7]
  lmHead: number[][];               // [128, 768]
}

/**
 * Cryptographic provenance tracking the parameter expansion lineage.
 */
export interface ExpansionProvenance {
  readonly taskId: string;
  readonly sourceModelId: string;
  readonly sourceParameters: number;
  readonly sourceStateHash: string;
  readonly targetModelId: string;
  readonly targetParameters: number;
  readonly strategy: ExpansionStrategy;
  readonly stateVersion: number;
  readonly tenantId: string;
  readonly createdAt: string;
}

/**
 * Complete expanded model container with weights, allocation, and manifest.
 */
export interface ExpandedModelContainer {
  readonly modelId: string;
  readonly weights: ExpandedModelWeights;
  readonly allocation: ParameterAllocationCatalog;
  readonly provenance: ExpansionProvenance;
  readonly stateHash: string;
  readonly canonicalChecksum: string;
  readonly canActuate: false;
  readonly isActuationBlocked: true;
}

/**
 * Checkpoint record for storage in VDB and streaming in .3dmemory.
 */
export interface ExpansionCheckpointRecord {
  readonly checkpointId: string;
  readonly modelId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly totalParameters: number;
  readonly tensorCount: number;
  readonly stateHash: string;
  readonly provenance: ExpansionProvenance;
  readonly vdbSynced: boolean;
  readonly weightsPayload: string; // Base64 serialized weights
  readonly timestamp: number;
}
