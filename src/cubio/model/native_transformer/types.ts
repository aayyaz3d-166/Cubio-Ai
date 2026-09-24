/**
 * CUBiO AI — Task 162: Native Transformer / Sequence Capacity Scaling
 * src/cubio/model/native_transformer/types.ts
 *
 * Authoritative contracts, hyperparameters, and interface definitions
 * for native transformer sequence modeling and multi-head attention scaling.
 *
 * STRICT INVARIANTS:
 * 1. ZERO foreign model weights (no Qwen, LLaMA, GPT, Claude, Gemini).
 * 2. Causal multi-head self-attention with exact dimensional partitioning.
 * 3. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 4. Primary authority: VDB is primary persistent storage; .3dmemory is checkpoint transport only.
 */

export const TASK_162_ID = 'CUBIO-TASK-162-NATIVE-TRANSFORMER-SEQUENCE-SCALING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * 7-Tier Epistemic Taxonomy
 */
export const EpistemicStatus = {
  FACT: 'FACT',
  OBSERVATION: 'OBSERVATION',
  DERIVATION: 'DERIVATION',
  HYPOTHESIS: 'HYPOTHESIS',
  PREDICTION: 'PREDICTION',
  ASSUMPTION: 'ASSUMPTION',
  UNKNOWN: 'UNKNOWN',
} as const;

export type EpistemicStatus = (typeof EpistemicStatus)[keyof typeof EpistemicStatus];

/**
 * Scaled Transformer hyperparameters.
 */
export interface ScaledTransformerHyperparameters {
  readonly modelId: string;
  readonly profileId: string;
  readonly layerCount: number;         // 4 .. 26
  readonly hiddenDimension: number;    // 64 .. 640
  readonly attentionHeads: number;     // 4 .. 20 (must divide hiddenDimension)
  readonly headDimension: number;      // hiddenDimension / attentionHeads (e.g. 16, 32)
  readonly ffnDimension: number;       // 2 * hiddenDimension
  readonly vocabSize: number;          // 478 .. 11264
  readonly maxSequenceLength: number;  // 64 .. 2048
  readonly spatialCells: number;       // strictly 343 HCP lattice cells
  readonly epistemicClasses: number;   // strictly 7 classes
  readonly masterSeed: number;
}

/**
 * Options for forward inference pass.
 */
export interface TransformerForwardOptions {
  readonly spatialCellId?: number; // 0..342
  readonly returnAttentionWeights?: boolean;
  readonly returnHiddenStates?: boolean;
}

/**
 * Output of a transformer forward pass.
 */
export interface TransformerForwardOutput {
  readonly logits: number[][]; // [seqLen, vocabSize]
  readonly lastHiddenState: number[][]; // [seqLen, hiddenDimension]
  readonly epistemicScores: Record<EpistemicStatus, number>;
  readonly dominantEpistemicStatus: EpistemicStatus;
  readonly predictedTokens: number[];
  readonly attentionEntropy: number;
  readonly executionTimeMs: number;
}

/**
 * Execution metrics for a forward pass or benchmark step.
 */
export interface TransformerExecutionMetrics {
  readonly forwardLatencyMs: number;
  readonly tokensProcessed: number;
  readonly throughputTokensPerSec: number;
  readonly peakMemoryBytes: number;
  readonly isDeterministic: boolean;
}

/**
 * Benchmark report summarizing scaling capacity across configurations.
 */
export interface TransformerBenchmarkReport {
  readonly profileId: string;
  readonly parameters: number;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly sequenceLength: number;
  readonly metrics: TransformerExecutionMetrics;
  readonly stateHash: string;
}
