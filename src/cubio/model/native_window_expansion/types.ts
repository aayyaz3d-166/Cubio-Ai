/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/types.ts
 *
 * Universal contracts, profile definitions, and domain errors for progressive
 * native context window expansion (1K -> 4K -> 16K -> 32K -> 128K -> 256K -> 1M).
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no FlashAttention, vLLM, xFormers, DeepSpeed, Triton).
 * 2. Paged window retrieval instead of quadratic memory explosion.
 * 3. Deterministic token ordering, truncation, and boundary restoration.
 * 4. Integration with Phase 11 native model forward execution and Phase 10 reasoning.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_172_ID = 'CUBIO-TASK-172-NATIVE-CONTEXT-WINDOW-EXPANSION';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Approved Context Window Expansion Profiles spanning 1K to 1M tokens.
 */
export const WindowExpansionProfileId = {
  WIN_1K: 'WIN_1K',       // 1,024 tokens
  WIN_4K: 'WIN_4K',       // 4,096 tokens
  WIN_16K: 'WIN_16K',     // 16,384 tokens
  WIN_32K: 'WIN_32K',     // 32,768 tokens
  WIN_128K: 'WIN_128K',   // 131,072 tokens
  WIN_256K: 'WIN_256K',   // 262,144 tokens
  WIN_1M: 'WIN_1M',       // 1,048,576 tokens
} as const;

export type WindowExpansionProfileId = (typeof WindowExpansionProfileId)[keyof typeof WindowExpansionProfileId];

/**
 * Window truncation policy when sequence length exceeds profile limit.
 */
export type WindowTruncationPolicy =
  | 'HEAD_AND_TAIL'        // Preserve pinned system head + recency tail, drop middle
  | 'SLIDING_RECENT'       // Keep most recent tokens up to capacity
  | 'PINNED_ANCHORS_ONLY'; // Drop all non-pinned tokens exceeding limit

/**
 * Architectural specification for a context window profile.
 */
export interface WindowExpansionProfileSpec {
  readonly profileId: WindowExpansionProfileId;
  readonly maxWindowTokens: number;
  readonly tileSizeTokens: number;
  readonly slidingWindowTokens: number;
  readonly maxResidentTiles: number;
  readonly maxWorkingRamBytes: number;
  readonly description: string;
}

/**
 * A tiled segment of a context window.
 */
export interface WindowTile {
  readonly tileIndex: number;
  readonly tokenStart: number;
  readonly tokenEnd: number;
  readonly tokenCount: number;
  readonly tokens: readonly number[];
  readonly checksum: string; // SHA-256 of tokens
  readonly isPinnedAnchor: boolean;
}

/**
 * Result of window execution and active token extraction.
 */
export interface WindowExecutionResult {
  readonly profileId: WindowExpansionProfileId;
  readonly inputTokenCount: number;
  readonly activeTokenCount: number;
  readonly totalTiles: number;
  readonly residentTiles: number;
  readonly activeTokens: readonly number[];
  readonly isTruncated: boolean;
  readonly truncatedTokenCount: number;
  readonly windowHash: string;
  readonly executionTimeMs: number;
}

/**
 * Benchmark metrics captured for a window profile.
 */
export interface WindowProfileBenchmarkMetrics {
  readonly profileId: WindowExpansionProfileId;
  readonly maxTokens: number;
  readonly inputTokensTested: number;
  readonly activeTokensProcessed: number;
  readonly forwardLatencyMs: number;
  readonly peakHeapRamMb: number;
  readonly throughputTokensPerSec: number;
  readonly isEdgeCompliant: boolean;
  readonly timestamp: string;
}

/**
 * Prohibited external libraries for window expansion.
 */
export const PROHIBITED_WINDOW_LIBRARIES: readonly string[] = Object.freeze([
  'flashattention',
  'flash-attn',
  'flash_attn',
  'vllm',
  'xformers',
  'deepspeed',
  'megatron',
  'triton',
  'tensorrt-llm',
  'fastertransformer',
  'ring-attention',
  'ring_attention',
]);

// =============================================================================
// DOMAIN ERROR HIERARCHY
// =============================================================================

export class WindowExpansionError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'WINDOW_EXPANSION_ERROR') {
    super(`[WindowExpansion] ${message}`);
    this.name = 'WindowExpansionError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class WindowProfileError extends WindowExpansionError {
  constructor(message: string) {
    super(message, 'WINDOW_PROFILE_ERROR');
    this.name = 'WindowProfileError';
  }
}

export class WindowOverflowError extends WindowExpansionError {
  public readonly requestedTokens: number;
  public readonly maxAllowedTokens: number;

  constructor(requestedTokens: number, maxAllowedTokens: number) {
    super(
      `Sequence length ${requestedTokens.toLocaleString()} exceeds window profile capacity of ${maxAllowedTokens.toLocaleString()} tokens.`,
      'WINDOW_OVERFLOW_ERROR'
    );
    this.name = 'WindowOverflowError';
    this.requestedTokens = requestedTokens;
    this.maxAllowedTokens = maxAllowedTokens;
  }
}

export class WindowActuationBlockedError extends WindowExpansionError {
  constructor(directive?: string) {
    super(
      `Hardware actuation attempt blocked fail-closed: "${directive ?? 'ACTUATION_DIRECTIVE'}". IS_ACTUATION_BLOCKED=true permanently.`,
      'WINDOW_ACTUATION_BLOCKED'
    );
    this.name = 'WindowActuationBlockedError';
  }
}

export class WindowForeignFrameworkError extends WindowExpansionError {
  constructor(framework: string) {
    super(
      `Prohibited foreign window framework detected: "${framework}". Pure native TypeScript architecture required.`,
      'WINDOW_FOREIGN_FRAMEWORK_ERROR'
    );
    this.name = 'WindowForeignFrameworkError';
  }
}

export class WindowResourceExceededError extends WindowExpansionError {
  public readonly resourceType: string;
  public readonly currentValue: number;
  public readonly limitValue: number;

  constructor(resourceType: string, currentValue: number, limitValue: number) {
    super(
      `Resource limit exceeded for ${resourceType}: ${currentValue.toLocaleString()} > limit ${limitValue.toLocaleString()}`,
      'WINDOW_RESOURCE_EXCEEDED'
    );
    this.name = 'WindowResourceExceededError';
    this.resourceType = resourceType;
    this.currentValue = currentValue;
    this.limitValue = limitValue;
  }
}
