/**
 * CUBiO AI — Phase 6: Task 75
 * Native Tokenizer & Vocabulary Expansion Layer
 * src/cubio/language/native/expansionTypes.ts
 *
 * Type contracts, provenance records, and errors for controlled vocabulary expansion.
 * Guarantees monotonic token ID assignment, version lineage, and checkpoint serialization.
 */

import { LanguageRepresentationError } from './languageTypes';

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================

export class VocabularyExpansionError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'VOCABULARY_EXPANSION_ERROR');
    this.name = 'VocabularyExpansionError';
  }
}

export class IncompatibleVocabularyVersionError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'INCOMPATIBLE_VOCABULARY_VERSION');
    this.name = 'IncompatibleVocabularyVersionError';
  }
}

export class InvalidCheckpointError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'INVALID_CHECKPOINT_INTEGRITY');
    this.name = 'InvalidCheckpointError';
  }
}

// =============================================================================
// PROVENANCE & CHECKPOINT CONTRACTS
// =============================================================================

export interface TokenProvenance {
  readonly tokenId: number;
  readonly symbol: string;
  readonly sourceCorpusChecksum: string;
  readonly frequency: number;
  readonly utilityScore: number;
  readonly addedInVersion: string;
  readonly timestamp: number;
  readonly tenantId: string;
}

export interface VocabularyCheckpoint {
  readonly vocabId: string;
  readonly version: string;
  readonly parentVersion?: string;
  readonly merkleRoot: string;
  readonly parentMerkleRoot?: string;
  readonly tokens: readonly string[];
  readonly provenanceMap: Readonly<Record<number, TokenProvenance>>;
  readonly size: number;
  readonly createdAt: number;
}

export interface VocabularyExpansionOptions {
  readonly maxNewTokens?: number;
  readonly minFrequency?: number;
  readonly minTokenLength?: number;
  readonly maxTokenLength?: number;
  readonly targetVersion?: string;
  readonly tenantId?: string;
}

export interface VocabularyExpansionResult {
  readonly previousVersion: string;
  readonly newVersion: string;
  readonly previousSize: number;
  readonly newSize: number;
  readonly addedTokensCount: number;
  readonly addedTokens: readonly string[];
  readonly previousMerkleRoot: string;
  readonly newMerkleRoot: string;
  readonly corpusChecksum: string;
  readonly elapsedMs: number;
}
