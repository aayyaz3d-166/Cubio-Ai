/**
 * CUBiO AI — Phase 6: Task 74
 * Native Language Representation Layer
 * src/cubio/language/native/languageTypes.ts
 *
 * Universal type contracts, errors, and interfaces for native language representation.
 * Guarantees sovereign tokenization, vocabulary versioning, spatial lattice grounding,
 * and deterministic representation without external model dependencies.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../core/canonicalIdentity';
import { EpistemicStatus } from '../../epistemic/native/epistemicTypes';
import { InformationModality } from '../../information/native/infoTypes';

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================

export class LanguageRepresentationError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'LANGUAGE_REPRESENTATION_ERROR') {
    super(message);
    this.name = 'LanguageRepresentationError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class VocabularyExhaustedError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'VOCABULARY_EXHAUSTED');
    this.name = 'VocabularyExhaustedError';
  }
}

export class SequenceLengthExceededError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'SEQUENCE_LENGTH_EXCEEDED');
    this.name = 'SequenceLengthExceededError';
  }
}

export class MalformedLanguageInputError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'MALFORMED_LANGUAGE_INPUT');
    this.name = 'MalformedLanguageInputError';
  }
}

export class DetokenizationIntegrityError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'DETOKENIZATION_INTEGRITY_MISMATCH');
    this.name = 'DetokenizationIntegrityError';
  }
}

export class TenantLanguageMismatchError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'TENANT_LANGUAGE_MISMATCH');
    this.name = 'TenantLanguageMismatchError';
  }
}

export class ExternalModelDependencyError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'EXTERNAL_MODEL_DEPENDENCY_PROHIBITED');
    this.name = 'ExternalModelDependencyError';
  }
}

export class ActuationBlockedError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'ACTUATION_PERMANENTLY_BLOCKED');
    this.name = 'ActuationBlockedError';
  }
}

// =============================================================================
// TOKEN & SEQUENCE CONTRACTS
// =============================================================================

export type TokenKind =
  | 'SPECIAL'
  | 'WORD'
  | 'SUBWORD'
  | 'PUNCTUATION'
  | 'NUMERIC'
  | 'BYTE_FALLBACK';

export interface NativeToken {
  /** Numerical identifier within vocabulary */
  readonly id: number;
  /** Literal text symbol or byte token representation */
  readonly symbol: string;
  /** Categorical classification */
  readonly kind: TokenKind;
  /** Grounded cell coordinate [0..342] in the 343-cell spatial lattice */
  readonly spatialCellId: number;
  /** Epistemic tag associated with this token */
  readonly epistemicTag: EpistemicStatus;
  /** Cryptographic SHA-256 digest of token properties */
  readonly checksum: string;
}

export interface NativeLanguageSequence {
  readonly mathType: 'NATIVE_LANGUAGE_SEQUENCE';
  /** Unique sequence identifier */
  readonly sequenceId: string;
  /** Canonical object identity */
  readonly objectId: string;
  /** Tenant isolation namespace */
  readonly tenantId: string;
  /** Architectural domain */
  readonly domain: CanonicalDomain;
  /** Monotonic state version */
  readonly stateVersion: number;
  /** Ordered token sequence */
  readonly tokens: readonly NativeToken[];
  /** Original raw input string */
  readonly rawText: string;
  /** Total token count */
  readonly length: number;
  /** Deterministic sequence-level FP32 embedding (dim 16) */
  readonly embedding: Float32Array;
  /** Unique activated spatial cell IDs across sequence */
  readonly spatialCellIds: readonly number[];
  /** Overall epistemic status of sequence */
  readonly epistemicStatus: EpistemicStatus;
  /** Cryptographic SHA-256 digest of sequence */
  readonly checksum: string;
  /** Provenance lineage identifier */
  readonly provenanceId: string;
  /** Associated vocabulary version */
  readonly vocabVersion: string;
  /** Associated vocabulary Merkle root */
  readonly vocabChecksum: string;
  /** Sequence creation and update timestamps */
  readonly timestamps: {
    readonly createdAt: number;
    readonly updatedAt: number;
  };
}

export interface SpecialTokensMap {
  readonly PAD: 0;
  readonly UNK: 1;
  readonly BOS: 2;
  readonly EOS: 3;
  readonly FACT: 4;
  readonly EVIDENCE: 5;
  readonly HYPOTHESIS: 6;
  readonly UNKNOWN: 7;
  readonly MASK: 8;
}

export interface NativeVocabularyMetadata {
  readonly vocabId: string;
  readonly version: string;
  readonly size: number;
  readonly merkleRoot: string;
  readonly createdAt: number;
  readonly specialTokens: SpecialTokensMap;
}

export interface LanguageResourceBudget {
  readonly maxSequenceLength: number;
  readonly maxVocabularySize: number;
  readonly maxWorkingMemoryBytes: number;
}

export const DEFAULT_LANGUAGE_BUDGET: LanguageResourceBudget = Object.freeze({
  maxSequenceLength: 512,
  maxVocabularySize: 8192,
  maxWorkingMemoryBytes: 16 * 1024 * 1024,
});
