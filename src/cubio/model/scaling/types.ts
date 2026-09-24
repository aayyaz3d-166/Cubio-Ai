/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 45: Step 44 Configurable Model Scaling Types
 *
 * Master specifications for:
 * - Architecture Profiles: Tiny, Edge, Small, Medium, Large
 * - Configurable Layers, Hidden Dim, Attention Heads, FFN Dim, Vocab Size
 * - Theoretical Parameter & Memory Estimators (Physical RSS vs Virtual/Storage)
 * - Quantization-Aware Model Scaling Planner (Tiling, Sharding, Activation Checkpointing)
 * - Lazy Layer Loading & CAS-backed Model Manifests
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { ComputeBackendType } from '../../compute/backends/types';
import { EdgeProfileName } from '../../fabric/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. ARCHITECTURE PROFILES & CONFIG ──────────────────────────────────────

export type ModelScaleProfile = 'TINY' | 'EDGE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';

export interface ScalableModelArchitectureConfig {
  readonly modelId: string;
  readonly modelName: string;
  readonly profile: ModelScaleProfile;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly ffnDimension: number;
  readonly vocabSize: number;
  readonly maxSequenceLength: number;
  readonly defaultQuantization: QuantizationFormat;
  readonly enableMultimodalHeads: boolean;
  readonly enableActivationCheckpointing: boolean;
  readonly tileSizeBytes: number; // e.g. 1MB on Edge
}

// ─── 2. PARAMETER & MEMORY ESTIMATION ───────────────────────────────────────

export interface ParameterBreakdown {
  readonly embeddingParams: number;
  readonly attentionParamsPerLayer: number;
  readonly ffnParamsPerLayer: number;
  readonly layerNormParamsPerLayer: number;
  readonly totalBackboneParams: number;
  readonly multimodalHeadsParams: number;
  readonly totalParameters: number;
}

export interface MemoryEstimationReport {
  readonly configId: string;
  readonly profile: ModelScaleProfile;
  readonly totalParameters: number;
  readonly storageBytesCas: number;            // Compressed on-disk CAS
  readonly residentWeightBytesFP16: number;    // Unquantized
  readonly residentWeightBytesINT8: number;    // 8-bit quantized
  readonly residentWeightBytesINT4: number;    // 4-bit quantized
  readonly activationMemoryPerBatchBytes: number;
  readonly executionWorkingSetBytes: number;   // Active layer tile + buffers
  readonly maxRecommendedEdgeProfile: EdgeProfileName;
  readonly is2GBEdgeCompliant: boolean;
}

// ─── 3. SCALING PLAN & SHARDING ─────────────────────────────────────────────

export interface LayerShardAssignment {
  readonly layerIndex: number;
  readonly assignedNodeId: string;
  readonly estimatedWeightBytes: number;
  readonly quantization: QuantizationFormat;
  readonly casLayerCid: string;
}

export interface ModelScalingPlan {
  readonly planId: string;
  readonly config: ScalableModelArchitectureConfig;
  readonly parameters: ParameterBreakdown;
  readonly memoryReport: MemoryEstimationReport;
  readonly layerShards: readonly LayerShardAssignment[];
  readonly totalShards: number;
  readonly executionMode: 'TILED_STREAMING' | 'FULLY_RESIDENT' | 'FEDERATED_SHARDED';
  readonly planChecksum: string;
}

// ─── 4. MODEL MANIFEST & METADATA ───────────────────────────────────────────

export interface ScalableModelManifest {
  readonly manifestId: string;
  readonly config: ScalableModelArchitectureConfig;
  readonly parameterCount: number;
  readonly casRootCid: string;
  readonly merkleRoot: string;
  readonly memoryReport: MemoryEstimationReport;
  readonly scientificClassification: ScientificClassification;
  readonly createdTimestamp: number;
}
