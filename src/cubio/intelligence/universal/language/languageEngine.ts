/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Master Universal Language Engine
 *
 * Unifies the 4-stage multilingual pipeline:
 * Detection -> Normalization -> Interlingua Semantic Pivot -> Native Response Localization.
 */

import {
  ILanguageEngine,
  LanguageCode,
  LanguageDetectionReport,
  NormalizedText,
  SemanticInterlinguaRepresentation,
  LocalizedResponse,
} from './types';
import { detectLanguage } from './detector';
import { normalizeText } from './normalizer';
import { toInterlingua } from './interlingua';
import { localizeResponse } from './localizer';

export class CubiOUniversalLanguageEngine implements ILanguageEngine {
  /**
   * Identifies the language, script, confidence, and directionality of the input text.
   */
  public detectLanguage(text: string): Readonly<LanguageDetectionReport> {
    return detectLanguage(text);
  }

  /**
   * Normalizes script variations, aerabs/diacritics, numerals, and phonetic patterns.
   */
  public normalizeText(text: string, language?: LanguageCode): Readonly<NormalizedText> {
    const lang = language || this.detectLanguage(text).detectedLanguage;
    return normalizeText(text, lang);
  }

  /**
   * Converts a multilingual user prompt into a canonical Interlingua Semantic Pivot.
   */
  public toInterlingua(
    text: string,
    context?: Record<string, unknown>
  ): Readonly<SemanticInterlinguaRepresentation> {
    return toInterlingua(text, context);
  }

  /**
   * Localizes a canonical engine response into the target native language.
   */
  public localizeResponse(
    sourceText: string,
    targetLanguage: LanguageCode,
    options?: {
      readonly preferredTone?: string;
      readonly activeDimension?: string;
    }
  ): Readonly<LocalizedResponse> {
    return localizeResponse(sourceText, targetLanguage, options);
  }

  /**
   * Convenience end-to-end processor:
   * Detects language -> Builds Interlingua Pivot.
   */
  public processInput(text: string, context?: Record<string, unknown>): {
    readonly detection: Readonly<LanguageDetectionReport>;
    readonly normalized: Readonly<NormalizedText>;
    readonly interlingua: Readonly<SemanticInterlinguaRepresentation>;
  } {
    const detection = this.detectLanguage(text);
    const normalized = this.normalizeText(text, detection.detectedLanguage);
    const interlingua = this.toInterlingua(text, context);

    return Object.freeze({
      detection,
      normalized,
      interlingua,
    });
  }
}
