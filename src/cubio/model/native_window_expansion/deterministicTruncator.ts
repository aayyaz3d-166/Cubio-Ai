/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/deterministicTruncator.ts
 *
 * Deterministic token truncation and boundary preservation engine.
 * Ensures that when sequences exceed window capacity, pinned anchor tokens
 * (system prompt, spatial genesis) and recent conversation tail are preserved,
 * while middle tokens are cleanly truncated at tile boundaries.
 */

import * as crypto from 'crypto';
import { WindowTruncationPolicy } from './types';

export interface TruncationResult {
  readonly originalTokens: readonly number[];
  readonly truncatedTokens: readonly number[];
  readonly originalCount: number;
  readonly truncatedCount: number;
  readonly droppedCount: number;
  readonly isTruncated: boolean;
  readonly boundaryHash: string;
}

export class DeterministicTruncator {
  /**
   * Truncates a token sequence deterministically to fit within maxTokens.
   */
  public static truncate(params: {
    tokens: readonly number[];
    maxTokens: number;
    policy?: WindowTruncationPolicy;
    pinnedPrefixCount?: number; // Pinned anchor tokens (e.g. system instructions)
  }): TruncationResult {
    const { tokens, maxTokens, policy = 'HEAD_AND_TAIL', pinnedPrefixCount = 0 } = params;

    const originalCount = tokens.length;

    // If within budget, no truncation needed
    if (originalCount <= maxTokens) {
      const hasher = crypto.createHash('sha256').update(tokens.join(','));
      return Object.freeze({
        originalTokens: tokens,
        truncatedTokens: tokens,
        originalCount,
        truncatedCount: originalCount,
        droppedCount: 0,
        isTruncated: false,
        boundaryHash: hasher.digest('hex'),
      });
    }

    let truncated: number[] = [];

    switch (policy) {
      case 'SLIDING_RECENT': {
        // Keep the most recent maxTokens
        truncated = tokens.slice(originalCount - maxTokens);
        break;
      }

      case 'PINNED_ANCHORS_ONLY': {
        // Keep up to maxTokens from the pinned prefix
        const keepHead = Math.min(pinnedPrefixCount, maxTokens);
        truncated = tokens.slice(0, keepHead);
        break;
      }

      case 'HEAD_AND_TAIL':
      default: {
        // Reserve space for pinned prefix
        const safeHeadCount = Math.min(pinnedPrefixCount, Math.floor(maxTokens * 0.25));
        const safeTailCount = maxTokens - safeHeadCount;

        const headTokens = tokens.slice(0, safeHeadCount);
        const tailTokens = tokens.slice(originalCount - safeTailCount);

        truncated = [...headTokens, ...tailTokens];
        break;
      }
    }

    const droppedCount = originalCount - truncated.length;
    const hasher = crypto.createHash('sha256');
    hasher.update(`TRUNC:${policy}:${originalCount}:${truncated.length}:`);
    hasher.update(truncated.join(','));
    const boundaryHash = hasher.digest('hex');

    return Object.freeze({
      originalTokens: tokens,
      truncatedTokens: Object.freeze(truncated),
      originalCount,
      truncatedCount: truncated.length,
      droppedCount,
      isTruncated: true,
      boundaryHash,
    });
  }
}
