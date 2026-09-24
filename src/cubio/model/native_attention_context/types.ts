/**
 * CUBiO AI — Task 163: Native Attention & Context Scaling
 * src/cubio/model/native_attention_context/types.ts
 *
 * Authoritative contracts, profile specifications, and interface definitions
 * for native attention scaling, bounded computational complexity, and selective context window management.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign attention libraries (no FlashAttention, vLLM, xFormers, HuggingFace, etc.).
 * 2. Bounded computational complexity: O(T^2) for T <= 256, O(T * W) sliding-window for T > 256.
 * 3. Selective VDB retrieval: load relevant chunks on demand, never load the entire database.
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 5. Primary authority: VDB is primary persistent storage; .3dmemory is checkpoint transport only.
 */

export const TASK_163_ID = 'CUBIO-TASK-163-NATIVE-ATTENTION-CONTEXT-SCALING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Controlled Context Scale Profiles spanning 64 to 4,096 tokens.
 */
export const ContextScaleProfile = {
  CONTEXT_TINY: 64,         // 219K Baseline
  CONTEXT_EDGE: 128,        // 1M Edge Profile
  CONTEXT_COMPACT: 256,     // 5M Compact Profile
  CONTEXT_BALANCED: 512,    // 20M Balanced Profile
  CONTEXT_EXTENDED: 1024,   // 50M Extended Profile
  CONTEXT_SOVEREIGN: 2048,  // 100M Sovereign Profile
  CONTEXT_MAX_BOUNDED: 4096,// Absolute bounded context ceiling
} as const;

export type ContextScaleProfile = (typeof ContextScaleProfile)[keyof typeof ContextScaleProfile];

export const VALID_CONTEXT_CAPACITIES: readonly number[] = Object.freeze([64, 128, 256, 512, 1024, 2048, 4096]);

export type AttentionMechanism = 'DENSE_CAUSAL' | 'BOUNDED_SLIDING_WINDOW';

/**
 * Prohibited external attention libraries and CUDA binaries.
 */
export const PROHIBITED_FOREIGN_ATTENTION_LIBRARIES: readonly string[] = Object.freeze([
  'flashattention',
  'flash-attn',
  'flash_attn',
  'vllm',
  'xformers',
  'huggingface',
  'deepspeed',
  'fastertransformer',
  'tensorrt-llm',
  'triton',
]);

/**
 * Filter for selective VDB chunk retrieval.
 */
export interface ContextRetrievalFilter {
  readonly tenantId: string;
  readonly domain?: string;
  readonly cellId?: number; // 0..342
  readonly maxChunks?: number;
  readonly queryKeywords?: readonly string[];
}

/**
 * An individual retrieved or injected memory chunk in the context window.
 */
export interface ContextWindowChunk {
  readonly chunkId: string;
  readonly sourceObjectId: string;
  readonly cellId?: number;
  readonly text: string;
  readonly tokenCount: number;
  readonly relevanceScore: number; // 0.0 .. 1.0
  readonly isPinned: boolean; // Pinned chunks (e.g. system instructions) survive eviction
  readonly createdAt: string;
}

/**
 * Result of assembling a context window within a profile limit.
 */
export interface ContextAssemblyResult {
  readonly profile: ContextScaleProfile;
  readonly maxCapacityTokens: number;
  readonly assembledChunks: readonly ContextWindowChunk[];
  readonly totalTokens: number;
  readonly promptText: string;
  readonly truncationApplied: boolean;
  readonly evictedChunkCount: number;
  readonly contextHash: string;
  readonly canonicalChecksum: string;
}

/**
 * Complexity metrics verifying bounded computational operations.
 */
export interface AttentionComplexityMetrics {
  readonly sequenceLength: number;
  readonly mechanism: AttentionMechanism;
  readonly windowSize: number;
  readonly totalOperations: number;
  readonly complexityOrder: 'O(T^2)' | 'O(T*W)';
  readonly computeBudgetExceeded: boolean;
  readonly executionLatencyMs: number;
}

/**
 * Streaming checkpoint record for attention context state.
 */
export interface AttentionContextCheckpoint {
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly profile: ContextScaleProfile;
  readonly stateVersion: number;
  readonly stateHash: string;
  readonly vdbSynced: boolean;
  readonly contextPayload: string; // Base64 serialized context window
  readonly timestamp: number;
}
