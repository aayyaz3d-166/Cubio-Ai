/**
 * CUBiO AI — Phase 6: Task 86
 * Native Multilingual Intelligence Layer
 * src/cubio/language/native/multilingual/multilingualTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for sovereign native multilingual processing, Unicode preservation,
 * decoupled language representation, shared conceptual structures,
 * and empirical multilingual capability measurement.
 * Guarantees zero foreign translation APIs, zero pretrained multilingual models,
 * and permanent hardware actuation lockout across all languages.
 */

import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { ClaimProvenance } from '../generation/generationTypes';

// =============================================================================
// SUPPORTED LANGUAGES & SCRIPTS
// =============================================================================

export type SupportedLanguageCode =
  | 'en' // English (Latin, LTR) - Primary High-Resource Baseline
  | 'fr' // French (Latin with diacritics, LTR)
  | 'de' // German (Latin with umlauts, LTR)
  | 'ur' // Urdu (Perso-Arabic script, RTL)
  | 'ar' // Arabic (Arabic script, RTL)
  | 'zh'; // Chinese (Hanzi / Simplified CJK Ideographs)

export type ScriptDirection = 'LTR' | 'RTL';

export type LanguageScript = 'LATIN' | 'ARABIC_URDU' | 'HANZI_CJK';

export interface LanguageDefinition {
  readonly code: SupportedLanguageCode;
  readonly name: string;
  readonly nativeName: string;
  readonly script: LanguageScript;
  readonly direction: ScriptDirection;
  readonly resourceTier: 'PRIMARY' | 'VERIFIED_CONCEPT';
  readonly unicodeRange: readonly [number, number][];
}

export const SUPPORTED_LANGUAGES: Readonly<Record<SupportedLanguageCode, LanguageDefinition>> = Object.freeze({
  en: Object.freeze({
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'LATIN',
    direction: 'LTR',
    resourceTier: 'PRIMARY',
    unicodeRange: Object.freeze([[0x0020, 0x007e]]),
  }),
  fr: Object.freeze({
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    script: 'LATIN',
    direction: 'LTR',
    resourceTier: 'VERIFIED_CONCEPT',
    unicodeRange: Object.freeze([[0x0020, 0x00ff], [0x0152, 0x0153]]),
  }),
  de: Object.freeze({
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    script: 'LATIN',
    direction: 'LTR',
    resourceTier: 'VERIFIED_CONCEPT',
    unicodeRange: Object.freeze([[0x0020, 0x00ff]]),
  }),
  ur: Object.freeze({
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'ARABIC_URDU',
    direction: 'RTL',
    resourceTier: 'VERIFIED_CONCEPT',
    unicodeRange: Object.freeze([[0x0600, 0x06ff], [0x0750, 0x077f]]),
  }),
  ar: Object.freeze({
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    script: 'ARABIC_URDU',
    direction: 'RTL',
    resourceTier: 'VERIFIED_CONCEPT',
    unicodeRange: Object.freeze([[0x0600, 0x06ff]]),
  }),
  zh: Object.freeze({
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '中文',
    script: 'HANZI_CJK',
    direction: 'LTR',
    resourceTier: 'VERIFIED_CONCEPT',
    unicodeRange: Object.freeze([[0x4e00, 0x9fff]]),
  }),
});

// =============================================================================
// STRUCTURED DOMAIN ERRORS
// =============================================================================

export class MultilingualIntelligenceError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'MULTILINGUAL_INTELLIGENCE_ERROR') {
    super(message);
    this.name = 'MultilingualIntelligenceError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class UnsupportedLanguageError extends MultilingualIntelligenceError {
  constructor(languageCode: string) {
    super(`Language code "${languageCode}" is not supported in CUBiO native multilingual runtime.`, 'UNSUPPORTED_LANGUAGE');
    this.name = 'UnsupportedLanguageError';
  }
}

export class UnalignedSemanticTransferError extends MultilingualIntelligenceError {
  constructor(message: string) {
    super(message, 'UNALIGNED_SEMANTIC_TRANSFER_PROHIBITED');
    this.name = 'UnalignedSemanticTransferError';
  }
}

export class MultilingualActuationBlockedError extends MultilingualIntelligenceError {
  constructor(message: string = 'Hardware actuation is permanently blocked fail-closed across all languages.') {
    super(message, 'ACTUATION_PERMANENTLY_BLOCKED');
    this.name = 'MultilingualActuationBlockedError';
  }
}

// =============================================================================
// SHARED CONCEPT & LEXICAL MAPPING CONTRACTS
// =============================================================================

export interface ConceptLexicalRealization {
  readonly languageCode: SupportedLanguageCode;
  readonly canonicalTerm: string;
  readonly surfaceVariants: readonly string[];
  readonly declarativeTemplate: string;
  readonly interrogativeTemplate: string;
}

export interface SharedConcept {
  readonly conceptId: string;
  readonly canonicalName: string;
  readonly domain: string;
  readonly spatialCellId?: number;
  readonly defaultEpistemicStatus: EpistemicStatus;
  readonly lexicalRealizations: Readonly<Record<SupportedLanguageCode, ConceptLexicalRealization>>;
  readonly semanticAttributes: Readonly<Record<string, string | number | boolean>>;
}

// =============================================================================
// MULTILINGUAL PROCESSING & METRICS CONTRACTS
// =============================================================================

export interface MultilingualQuery {
  readonly queryText: string;
  readonly sourceLanguage: SupportedLanguageCode;
  readonly targetLanguage?: SupportedLanguageCode;
  readonly tenantId?: string;
  readonly contextStatements?: readonly string[];
}

export interface MultilingualResponse {
  readonly responseId: string;
  readonly queryText: string;
  readonly sourceLanguage: SupportedLanguageCode;
  readonly targetLanguage: SupportedLanguageCode;
  readonly generatedText: string;
  readonly matchedConceptId?: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly isGrounded: boolean;
  readonly tokenCount: number;
  readonly charCount: number;
  readonly byteTokensCount: number;
  readonly provenance?: ClaimProvenance;
  readonly durationMs: number;
}

export interface MultilingualLanguageMetrics {
  readonly languageCode: SupportedLanguageCode;
  readonly languageName: string;
  readonly script: LanguageScript;
  readonly direction: ScriptDirection;
  readonly sampleCount: number;
  readonly totalChars: number;
  readonly totalTokens: number;
  readonly tokensPerWord: number;
  readonly charPerToken: number;
  readonly byteFallbackRatio: number;
  readonly retrievalAccuracy: number;
  readonly reasoningAccuracy: number;
  readonly unknownAppropriateness: number;
  readonly averageLatencyMs: number;
  readonly memoryFootprintBytes: number;
}

export interface MultilingualCapabilityMatrix {
  readonly evaluatedLanguages: readonly SupportedLanguageCode[];
  readonly perLanguageMetrics: Readonly<Record<SupportedLanguageCode, MultilingualLanguageMetrics>>;
  readonly crossLanguageConsistencyScore: number;
  readonly overallAccuracy: number;
  readonly totalEvaluationTimeMs: number;
  readonly timestamp: number;
}

// =============================================================================
// MULTILINGUAL CONFIGURATION
// =============================================================================

export interface MultilingualConfig {
  readonly defaultLanguage: SupportedLanguageCode;
  readonly strictGroundedOnly: boolean;
  readonly allowByteFallback: boolean;
  readonly enforceEpistemicLabels: boolean;
  readonly budgetMs: number;
  readonly seed: number;
}

export const DEFAULT_MULTILINGUAL_CONFIG: MultilingualConfig = Object.freeze({
  defaultLanguage: 'en',
  strictGroundedOnly: true,
  allowByteFallback: true,
  enforceEpistemicLabels: true,
  budgetMs: 2000,
  seed: 369,
});
