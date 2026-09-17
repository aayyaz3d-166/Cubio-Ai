/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Language Layer Types
 *
 * Core contracts for Language Detection, Script Normalization,
 * Interlingua Semantic Pivoting, and Native Response Localization.
 */

import { LanguageCode } from '../universalTypes';
export type { LanguageCode };

export type LanguageScript =
  | 'Latn'
  | 'Arab'
  | 'Deva'
  | 'Guru'
  | 'Hans'
  | 'Hant'
  | 'Cyrl';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageDetectionReport {
  readonly detectedLanguage: LanguageCode;
  readonly script: LanguageScript;
  readonly isRTL: boolean;
  readonly confidence: number;
  readonly secondaryMatches?: readonly {
    readonly language: LanguageCode;
    readonly confidence: number;
  }[];
  readonly dialect?: string;
  readonly tokenCount: number;
}

export interface NormalizedText {
  readonly rawText: string;
  readonly normalizedText: string;
  readonly strippedDiacritics: string;
  readonly standardizedDigits: string;
  readonly script: LanguageScript;
  readonly language: LanguageCode;
  readonly tokens: readonly string[];
  readonly phoneticTokens?: readonly string[];
}

export interface SemanticInterlinguaRepresentation {
  readonly interlinguaId: string;
  readonly sourceLanguage: LanguageCode;
  readonly sourceText: string;
  readonly normalizedText: string;
  readonly interlinguaPivot: string;
  readonly detectedIntent: string;
  readonly extractedEntities: readonly string[];
  readonly spatialGrounding?: {
    readonly dimension?: string;
    readonly geometricForm?: string;
    readonly mathematicalContext?: string;
  };
  readonly confidence: number;
  readonly timestamp: number;
}

export interface LocalizedResponse {
  readonly responseId: string;
  readonly targetLanguage: LanguageCode;
  readonly textOutput: string;
  readonly direction: TextDirection;
  readonly script: LanguageScript;
  readonly sourcePivotChecksum: string;
  readonly formattedWithKaTeX: boolean;
  readonly timestamp: number;
}

export interface ILanguageEngine {
  detectLanguage(text: string): LanguageDetectionReport;
  normalizeText(text: string, language?: LanguageCode): NormalizedText;
  toInterlingua(text: string, context?: Record<string, unknown>): SemanticInterlinguaRepresentation;
  localizeResponse(
    sourceText: string,
    targetLanguage: LanguageCode,
    options?: {
      readonly preferredTone?: string;
      readonly activeDimension?: string;
    }
  ): LocalizedResponse;
}
