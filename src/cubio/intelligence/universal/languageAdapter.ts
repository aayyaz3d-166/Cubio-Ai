/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Language Adapter
 *
 * Pluggable language adapter connecting the Universal Intelligence Orchestrator
 * to the 4-stage Universal Language Engine (Detect -> Normalize -> Interlingua -> Localize).
 */

import { LanguageDetectionResult, LanguageCode } from './universalTypes';
import { CubiOUniversalLanguageEngine } from './language/languageEngine';
import { SemanticInterlinguaRepresentation, LocalizedResponse } from './language/types';

export class CubiOLanguageAdapter {
  private readonly engine: CubiOUniversalLanguageEngine;

  constructor() {
    this.engine = new CubiOUniversalLanguageEngine();
  }

  /**
   * Detects language, script, RTL direction, and confidence.
   */
  public detectLanguage(text: string): LanguageDetectionResult {
    const report = this.engine.detectLanguage(text);
    return Object.freeze({
      detectedLanguage: report.detectedLanguage,
      confidence: report.confidence,
      script: report.script,
      isRTL: report.isRTL,
    });
  }

  /**
   * Retrieves the preferred language from a context object or defaults to 'en'.
   */
  public getLanguagePreference(context?: Record<string, unknown>): LanguageCode {
    if (context && typeof context.language === 'string') {
      return context.language as LanguageCode;
    }
    return 'en';
  }

  /**
   * Converts input to canonical Interlingua Semantic Pivot.
   */
  public toInterlingua(
    text: string,
    context?: Record<string, unknown>
  ): Readonly<SemanticInterlinguaRepresentation> {
    return this.engine.toInterlingua(text, context);
  }

  /**
   * Localizes response into user's target native language.
   */
  public localizeResponse(
    response: string,
    targetLang: LanguageCode,
    options?: {
      readonly preferredTone?: string;
      readonly activeDimension?: string;
    }
  ): Readonly<LocalizedResponse> {
    return this.engine.localizeResponse(response, targetLang, options);
  }

  /**
   * Adapts response for backward compatibility.
   */
  public adaptResponse(response: string, targetLang: LanguageCode): string {
    if (targetLang === 'en') {
      return response;
    }
    const localized = this.localizeResponse(response, targetLang);
    return localized.textOutput;
  }

  /**
   * Checks if multilingual translation/localization is available.
   */
  public isMultilingualCapabilityAvailable(): boolean {
    return true;
  }

  /**
   * Returns the underlying Universal Language Engine.
   */
  public getLanguageEngine(): CubiOUniversalLanguageEngine {
    return this.engine;
  }
}
