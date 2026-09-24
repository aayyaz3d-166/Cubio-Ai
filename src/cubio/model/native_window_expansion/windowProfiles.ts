/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/windowProfiles.ts
 *
 * Controlled context window specifications for 1K through 1M tokens.
 */

import {
  WindowExpansionProfileId,
  WindowExpansionProfileSpec,
  WindowProfileError,
} from './types.js';

export const DEFAULT_WINDOW_TILE_SIZE = 512;
export const MAX_SOVEREIGN_WINDOW_TOKENS = 1_048_576; // 1M

export const WINDOW_EXPANSION_PROFILES: Readonly<Record<WindowExpansionProfileId, WindowExpansionProfileSpec>> = Object.freeze({
  [WindowExpansionProfileId.WIN_1K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_1K,
    maxWindowTokens: 1_024,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 1_024,
    maxResidentTiles: 2,
    maxWorkingRamBytes: 8 * 1024 * 1024, // 8 MB
    description: '1K Window: Direct exact causal attention for single-turn edge prompts.',
  }),

  [WindowExpansionProfileId.WIN_4K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_4K,
    maxWindowTokens: 4_096,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 8,
    maxWorkingRamBytes: 16 * 1024 * 1024, // 16 MB
    description: '4K Window: Extended single-session conversational window.',
  }),

  [WindowExpansionProfileId.WIN_16K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_16K,
    maxWindowTokens: 16_384,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 16,
    maxWorkingRamBytes: 24 * 1024 * 1024, // 24 MB
    description: '16K Window: Document-scale context window with paged tile caching.',
  }),

  [WindowExpansionProfileId.WIN_32K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_32K,
    maxWindowTokens: 32_768,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 24,
    maxWorkingRamBytes: 32 * 1024 * 1024, // 32 MB
    description: '32K Window: Multi-document code & spatial context window.',
  }),

  [WindowExpansionProfileId.WIN_128K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_128K,
    maxWindowTokens: 131_072,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 32,
    maxWorkingRamBytes: 48 * 1024 * 1024, // 48 MB
    description: '128K Window: Repository-scale context with hierarchical sliding window & global anchors.',
  }),

  [WindowExpansionProfileId.WIN_256K]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_256K,
    maxWindowTokens: 262_144,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 48,
    maxWorkingRamBytes: 64 * 1024 * 1024, // 64 MB
    description: '256K Window: Deep episodic memory context with load-on-demand tiling.',
  }),

  [WindowExpansionProfileId.WIN_1M]: Object.freeze({
    profileId: WindowExpansionProfileId.WIN_1M,
    maxWindowTokens: 1_048_576,
    tileSizeTokens: DEFAULT_WINDOW_TILE_SIZE,
    slidingWindowTokens: 2_048,
    maxResidentTiles: 64,
    maxWorkingRamBytes: 64 * 1024 * 1024, // 64 MB bounded RAM limit
    description: '1M Window: Sovereign full-scale window with 100% paged tile execution.',
  }),
});

export function getWindowProfile(profileId: string): WindowExpansionProfileSpec {
  const spec = (WINDOW_EXPANSION_PROFILES as Record<string, WindowExpansionProfileSpec>)[profileId];
  if (!spec) {
    const valid = Object.keys(WINDOW_EXPANSION_PROFILES).join(', ');
    throw new WindowProfileError(`Invalid context window profile "${profileId}". Approved: ${valid}`);
  }
  return spec;
}

export function validateWindowTokens(tokens: number, profileId: WindowExpansionProfileId): void {
  const spec = getWindowProfile(profileId);
  if (tokens > spec.maxWindowTokens) {
    throw new WindowProfileError(
      `Tokens ${tokens.toLocaleString()} exceed profile ${profileId} capacity ${spec.maxWindowTokens.toLocaleString()}`
    );
  }
}
