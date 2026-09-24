/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/longContextProfiles.ts
 *
 * Controlled scaling profiles from 1K through 1M tokens.
 * Defines token limits, chunking bounds, resident RAM caps, and attention routing.
 */

import {
  LongContextProfileId,
  LongContextProfileSpec,
  LongContextProfileError,
} from './types';

/**
 * Standard chunk size in tokens for indexing and load-on-demand tiling.
 */
export const DEFAULT_CHUNK_SIZE_TOKENS = 512;

/**
 * Absolute maximum token capacity supported in Phase 12 architecture.
 */
export const MAX_SOVEREIGN_CONTEXT_TOKENS = 1_048_576; // 1M

/**
 * Canonical Long-Context Scale Profile Specifications.
 */
export const LONG_CONTEXT_PROFILES: Readonly<Record<LongContextProfileId, LongContextProfileSpec>> = Object.freeze({
  [LongContextProfileId.LONG_1K]: Object.freeze({
    profileId: LongContextProfileId.LONG_1K,
    maxTokens: 1_024,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 2,
    maxResidentBlocks: 2,
    maxResidentRamBytes: 8 * 1024 * 1024, // 8 MB
    routingMechanism: 'DENSE_CAUSAL',
    description: '1K Context: Direct causal attention profile for immediate conversational turns.',
  }),

  [LongContextProfileId.LONG_4K]: Object.freeze({
    profileId: LongContextProfileId.LONG_4K,
    maxTokens: 4_096,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 8,
    maxResidentBlocks: 8,
    maxResidentRamBytes: 16 * 1024 * 1024, // 16 MB
    routingMechanism: 'DENSE_CAUSAL',
    description: '4K Context: Extended single-session working memory with exact attention.',
  }),

  [LongContextProfileId.LONG_16K]: Object.freeze({
    profileId: LongContextProfileId.LONG_16K,
    maxTokens: 16_384,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 32,
    maxResidentBlocks: 16,
    maxResidentRamBytes: 24 * 1024 * 1024, // 24 MB
    routingMechanism: 'BLOCK_SPARSE',
    description: '16K Context: Document-level reasoning with block-sparse attention indexing.',
  }),

  [LongContextProfileId.LONG_32K]: Object.freeze({
    profileId: LongContextProfileId.LONG_32K,
    maxTokens: 32_768,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 64,
    maxResidentBlocks: 24,
    maxResidentRamBytes: 32 * 1024 * 1024, // 32 MB
    routingMechanism: 'BLOCK_SPARSE',
    description: '32K Context: Multi-document code and spatial reasoning memory workspace.',
  }),

  [LongContextProfileId.LONG_128K]: Object.freeze({
    profileId: LongContextProfileId.LONG_128K,
    maxTokens: 131_072,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 256,
    maxResidentBlocks: 32,
    maxResidentRamBytes: 48 * 1024 * 1024, // 48 MB
    routingMechanism: 'HIERARCHICAL_SLIDING',
    description: '128K Context: Large repository context with hierarchical sliding window & global anchors.',
  }),

  [LongContextProfileId.LONG_256K]: Object.freeze({
    profileId: LongContextProfileId.LONG_256K,
    maxTokens: 262_144,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 512,
    maxResidentBlocks: 48,
    maxResidentRamBytes: 64 * 1024 * 1024, // 64 MB
    routingMechanism: 'HIERARCHICAL_SLIDING',
    description: '256K Context: Deep episodic memory with load-on-demand VDB tile caching.',
  }),

  [LongContextProfileId.LONG_1M]: Object.freeze({
    profileId: LongContextProfileId.LONG_1M,
    maxTokens: 1_048_576,
    defaultChunkSizeTokens: DEFAULT_CHUNK_SIZE_TOKENS,
    maxChunks: 2_048,
    maxResidentBlocks: 64,
    maxResidentRamBytes: 64 * 1024 * 1024, // 64 MB bounded RAM limit
    routingMechanism: 'HIERARCHICAL_SLIDING',
    description: '1M Context: Full sovereign long-context scale; 100% load-on-demand memory tiling.',
  }),
});

/**
 * Retrieves the specification for a given profile ID.
 * Throws LongContextProfileError if invalid.
 */
export function getLongContextProfile(profileId: string): LongContextProfileSpec {
  const spec = (LONG_CONTEXT_PROFILES as Record<string, LongContextProfileSpec>)[profileId];
  if (!spec) {
    const validProfiles = Object.keys(LONG_CONTEXT_PROFILES).join(', ');
    throw new LongContextProfileError(
      `Invalid or unsupported context profile "${profileId}". Approved profiles: ${validProfiles}`
    );
  }
  return spec;
}

/**
 * Validates that a requested token count fits within a profile.
 */
export function validateTokenBudget(tokens: number, profileId: LongContextProfileId): void {
  const spec = getLongContextProfile(profileId);
  if (tokens > spec.maxTokens) {
    throw new LongContextProfileError(
      `Requested token count ${tokens.toLocaleString()} exceeds profile ${profileId} capacity of ${spec.maxTokens.toLocaleString()} tokens.`
    );
  }
}

/**
 * Estimates the memory size of metadata index entries vs resident raw text.
 * Demonstrates the efficiency of canonical reference indexing.
 */
export function estimateMemoryComparison(tokenCount: number, chunkSize = DEFAULT_CHUNK_SIZE_TOKENS): {
  readonly chunkCount: number;
  readonly rawTextEstimatedBytes: number;
  readonly indexMetadataEstimatedBytes: number;
  readonly memorySavingsRatio: number;
} {
  const chunkCount = Math.ceil(tokenCount / chunkSize);
  // Average ~4 chars per token in UTF-8
  const rawTextEstimatedBytes = tokenCount * 4;
  // Index metadata is ~180 bytes per entry (pointers, numbers, hashes)
  const indexMetadataEstimatedBytes = chunkCount * 180;
  const memorySavingsRatio = rawTextEstimatedBytes / Math.max(1, indexMetadataEstimatedBytes);

  return Object.freeze({
    chunkCount,
    rawTextEstimatedBytes,
    indexMetadataEstimatedBytes,
    memorySavingsRatio,
  });
}
