/**
 * CUBiO AI — Task 163: Native Attention & Context Scaling
 * src/cubio/model/native_attention_context/attentionGovernor.ts
 *
 * Bounded attention complexity engine:
 * - Implements Dense Causal Attention for T <= 256 (O(T^2)).
 * - Implements Bounded Sliding-Window Attention for T > 256 (O(T * W), W = 128).
 * - Enforces computation limits and rejects out-of-budget sequences.
 * - Asserts 100% native execution (no foreign FlashAttention/vLLM libraries).
 */

import {
  AttentionMechanism,
  AttentionComplexityMetrics,
  PROHIBITED_FOREIGN_ATTENTION_LIBRARIES,
  IS_ACTUATION_BLOCKED,
} from './types';

export class AttentionSovereigntyError extends Error {
  constructor(message: string) {
    super(`[ATTENTION_SOVEREIGNTY_VIOLATION] ${message}`);
    this.name = 'AttentionSovereigntyError';
  }
}

export class ContextLimitExceededError extends Error {
  constructor(message: string) {
    super(`[CONTEXT_LIMIT_EXCEEDED] ${message}`);
    this.name = 'ContextLimitExceededError';
  }
}

export class AttentionBudgetExceededError extends Error {
  constructor(message: string) {
    super(`[ATTENTION_BUDGET_EXCEEDED] ${message}`);
    this.name = 'AttentionBudgetExceededError';
  }
}

export const SLIDING_WINDOW_SIZE = 128;
export const MAX_ALLOWED_CONTEXT_LENGTH = 4096;
export const MAX_ALLOWED_ATTENTION_OPERATIONS = 4096 * SLIDING_WINDOW_SIZE; // 524,288 ops

/**
 * Asserts that no external/foreign attention library is referenced.
 */
export function assertNativeAttentionSovereignty(mechanismOrLibrary: string): void {
  const lower = mechanismOrLibrary.toLowerCase().trim();
  for (const prohibited of PROHIBITED_FOREIGN_ATTENTION_LIBRARIES) {
    if (lower.includes(prohibited)) {
      throw new AttentionSovereigntyError(
        `Prohibited external attention library reference detected: '${prohibited}'. Only native CUBiO attention is permitted.`
      );
    }
  }
}

export class NativeAttentionGovernor {
  /**
   * Evaluates attention complexity and selects the bounded mechanism.
   */
  public static determineAttentionMechanism(sequenceLength: number): {
    mechanism: AttentionMechanism;
    windowSize: number;
    totalOperations: number;
    complexityOrder: 'O(T^2)' | 'O(T*W)';
  } {
    if (sequenceLength <= 0) {
      throw new ContextLimitExceededError('sequenceLength must be greater than 0.');
    }

    if (sequenceLength > MAX_ALLOWED_CONTEXT_LENGTH) {
      throw new ContextLimitExceededError(
        `Sequence length ${sequenceLength} exceeds maximum bounded context limit of ${MAX_ALLOWED_CONTEXT_LENGTH} tokens.`
      );
    }

    if (sequenceLength <= 256) {
      // Dense causal attention: T * (T + 1) / 2 operations
      const totalOperations = Math.floor((sequenceLength * (sequenceLength + 1)) / 2);
      return {
        mechanism: 'DENSE_CAUSAL',
        windowSize: sequenceLength,
        totalOperations,
        complexityOrder: 'O(T^2)',
      };
    } else {
      // Bounded sliding-window attention: sequenceLength * W operations
      const totalOperations = sequenceLength * SLIDING_WINDOW_SIZE;
      if (totalOperations > MAX_ALLOWED_ATTENTION_OPERATIONS) {
        throw new AttentionBudgetExceededError(
          `Attention operations (${totalOperations.toLocaleString()}) exceed hard ceiling of ${MAX_ALLOWED_ATTENTION_OPERATIONS.toLocaleString()}.`
        );
      }
      return {
        mechanism: 'BOUNDED_SLIDING_WINDOW',
        windowSize: SLIDING_WINDOW_SIZE,
        totalOperations,
        complexityOrder: 'O(T*W)',
      };
    }
  }

  /**
   * Computes bounded attention weights for a causal sequence using native computation.
   */
  public static computeAttentionWeights(
    q: readonly number[][], // [seqLen, headDim]
    k: readonly number[][], // [seqLen, headDim]
    headDim: number
  ): { attentionWeights: number[][]; metrics: AttentionComplexityMetrics } {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const tStart = performance.now();
    const seqLen = q.length;

    const { mechanism, windowSize, totalOperations, complexityOrder } =
      this.determineAttentionMechanism(seqLen);

    const weights: number[][] = [];
    const scale = 1.0 / Math.sqrt(headDim);

    for (let t = 0; t < seqLen; t++) {
      // Determine attention receptive field bounds [startIdx..t]
      const startIdx = mechanism === 'DENSE_CAUSAL'
        ? 0
        : Math.max(0, t - windowSize + 1);

      const rowRaw: number[] = [];
      let maxLogit = -Infinity;

      for (let s = startIdx; s <= t; s++) {
        let dot = 0;
        for (let d = 0; d < headDim; d++) {
          dot += q[t][d] * k[s][d];
        }
        const logit = dot * scale;
        rowRaw.push(logit);
        if (logit > maxLogit) maxLogit = logit;
      }

      // Stable softmax over receptive field
      let sumExp = 0;
      const expRow: number[] = [];
      for (let i = 0; i < rowRaw.length; i++) {
        const val = Math.exp(rowRaw[i] - maxLogit);
        expRow.push(val);
        sumExp += val;
      }

      const rowWeights: number[] = new Array(seqLen).fill(0);
      for (let i = 0; i < expRow.length; i++) {
        const s = startIdx + i;
        rowWeights[s] = sumExp > 0 ? expRow[i] / sumExp : 0;
      }

      weights.push(rowWeights);
    }

    const tEnd = performance.now();
    const executionLatencyMs = Number(Math.max(0.1, tEnd - tStart).toFixed(2));

    const metrics: AttentionComplexityMetrics = Object.freeze({
      sequenceLength: seqLen,
      mechanism,
      windowSize,
      totalOperations,
      complexityOrder,
      computeBudgetExceeded: false,
      executionLatencyMs,
    });

    return { attentionWeights: weights, metrics };
  }
}
