/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/pagedWindowEngine.ts
 *
 * Paged Window Execution Engine:
 * - Tiles arbitrary sequence lengths into canonical 512-token tiles.
 * - Extracts active sliding-window tokens and pinned anchor tiles.
 * - Prevents quadratic RAM/compute explosion on large context profiles (16K -> 1M).
 * - Computes deterministic window hashes for bitwise reproducibility.
 */

import * as crypto from 'crypto';
import {
  WindowExpansionProfileId,
  WindowTile,
  WindowExecutionResult,
} from './types.js';
import { getWindowProfile, DEFAULT_WINDOW_TILE_SIZE } from './windowProfiles.js';
import { DeterministicTruncator } from './deterministicTruncator.js';

export class PagedWindowEngine {
  /**
   * Tiles an input token array into 512-token chunks.
   */
  public static tileTokens(
    tokens: readonly number[],
    tileSize = DEFAULT_WINDOW_TILE_SIZE,
    pinnedTileCount = 1
  ): readonly WindowTile[] {
    const tiles: WindowTile[] = [];
    const total = tokens.length;

    let tileIndex = 0;
    for (let i = 0; i < total; i += tileSize) {
      const slice = tokens.slice(i, i + tileSize);
      const tokenStart = i;
      const tokenEnd = Math.min(total - 1, i + slice.length - 1);

      const checksum = crypto
        .createHash('sha256')
        .update(slice.join(','))
        .digest('hex');

      tiles.push(
        Object.freeze({
          tileIndex,
          tokenStart,
          tokenEnd,
          tokenCount: slice.length,
          tokens: slice,
          checksum,
          isPinnedAnchor: tileIndex < pinnedTileCount,
        })
      );
      tileIndex++;
    }

    return Object.freeze(tiles);
  }

  /**
   * Executes paged window assembly for a target profile.
   */
  public static executeWindow(params: {
    tokens: readonly number[];
    profileId: WindowExpansionProfileId;
    pinnedTokensCount?: number;
  }): WindowExecutionResult {
    const startTime = Date.now();
    const { tokens, profileId, pinnedTokensCount = 0 } = params;

    const spec = getWindowProfile(profileId);
    const inputTokenCount = tokens.length;

    // 1. Truncate if input exceeds profile capacity
    let activeTokens = tokens;
    let isTruncated = false;
    let truncatedCount = 0;

    if (inputTokenCount > spec.maxWindowTokens) {
      const truncResult = DeterministicTruncator.truncate({
        tokens,
        maxTokens: spec.maxWindowTokens,
        policy: 'HEAD_AND_TAIL',
        pinnedPrefixCount: pinnedTokensCount,
      });
      activeTokens = truncResult.truncatedTokens;
      isTruncated = true;
      truncatedCount = truncResult.droppedCount;
    }

    // 2. Tile the active tokens
    const tiles = this.tileTokens(activeTokens, spec.tileSizeTokens, 1);
    const totalTiles = tiles.length;

    // 3. Select Active Tokens for transformer attention:
    // If within sliding window limit, keep all active tokens.
    // If exceeding sliding window, select pinned anchor tiles + recency tail tiles.
    let selectedTokens: number[] = [];
    let residentTiles = 0;

    if (activeTokens.length <= spec.slidingWindowTokens) {
      selectedTokens = [...activeTokens];
      residentTiles = totalTiles;
    } else {
      // Keep pinned anchor tiles (tile 0)
      const pinnedTiles = tiles.filter(t => t.isPinnedAnchor);
      for (const pt of pinnedTiles) {
        selectedTokens.push(...pt.tokens);
        residentTiles++;
      }

      // Calculate how many recency tokens to take
      const remainingBudget = spec.slidingWindowTokens - selectedTokens.length;
      if (remainingBudget > 0) {
        const tailTokens = activeTokens.slice(activeTokens.length - remainingBudget);
        selectedTokens.push(...tailTokens);
        residentTiles += Math.ceil(remainingBudget / spec.tileSizeTokens);
      }
    }

    // 4. Compute deterministic window hash
    const hasher = crypto.createHash('sha256');
    hasher.update(`WIN:${profileId}:TOTAL:${inputTokenCount}:ACTIVE:${selectedTokens.length}:TILES:${totalTiles}:`);
    hasher.update(selectedTokens.join(','));
    const windowHash = hasher.digest('hex');

    const executionTimeMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      profileId,
      inputTokenCount,
      activeTokenCount: selectedTokens.length,
      totalTiles,
      residentTiles: Math.min(residentTiles, spec.maxResidentTiles),
      activeTokens: Object.freeze(selectedTokens),
      isTruncated,
      truncatedTokenCount: truncatedCount,
      windowHash,
      executionTimeMs,
    });
  }
}
