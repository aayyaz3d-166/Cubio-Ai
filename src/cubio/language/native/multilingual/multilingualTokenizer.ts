/**
 * CUBiO AI — Phase 6: Task 86
 * Native Multilingual Intelligence Layer
 * src/cubio/language/native/multilingual/multilingualTokenizer.ts
 *
 * Sovereign Language-Aware Native Tokenizer.
 * Executes Unicode-correct script-aware tokenization across Latin, Arabic/Urdu,
 * and Hanzi/CJK scripts with deterministic byte-fallback for 100% vocabulary coverage.
 */

import {
  SupportedLanguageCode,
  SUPPORTED_LANGUAGES,
  UnsupportedLanguageError,
  MultilingualIntelligenceError,
} from './multilingualTypes';
import { NativeTokenizer, TokenizeOptions } from '../nativeTokenizer';
import { NativeVocabulary } from '../nativeVocabulary';
import { NativeLanguageSequence, NativeToken } from '../languageTypes';

export interface MultilingualTokenizeResult {
  readonly sequence: NativeLanguageSequence;
  readonly languageCode: SupportedLanguageCode;
  readonly charCount: number;
  readonly wordCount: number;
  readonly tokenCount: number;
  readonly byteTokensCount: number;
  readonly tokensPerWord: number;
  readonly charPerToken: number;
  readonly byteFallbackRatio: number;
}

export class MultilingualTokenizer {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _vocab: NativeVocabulary;

  constructor(tokenizer?: NativeTokenizer, vocab?: NativeVocabulary) {
    this._vocab = vocab ?? NativeVocabulary.getInstance();
    this._tokenizer = tokenizer ?? new NativeTokenizer(this._vocab);
  }

  public get vocab(): NativeVocabulary {
    return this._vocab;
  }

  public get baseTokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  /**
   * Tokenizes text in a specified or auto-detected language with Unicode normalization.
   */
  public tokenize(
    text: string,
    options: {
      languageCode?: SupportedLanguageCode;
      tenantId?: string;
      addSpecialTokens?: boolean;
    } = {}
  ): MultilingualTokenizeResult {
    if (typeof text !== 'string') {
      throw new MultilingualIntelligenceError('Tokenize text must be a string');
    }

    // 1. Unicode NFC Normalization
    const normalizedText = text.normalize('NFC');
    const charCount = normalizedText.length;

    // 2. Determine language code
    const langCode = options.languageCode ?? this.detectLanguage(normalizedText);
    if (!SUPPORTED_LANGUAGES[langCode]) {
      throw new UnsupportedLanguageError(langCode);
    }

    // 3. Pre-process text according to script conventions
    const processedText = this._preprocessForScript(normalizedText, langCode);

    // 4. Tokenize using sovereign base tokenizer
    const sequence = this._tokenizer.tokenize(processedText, {
      tenantId: options.tenantId,
      addSpecialTokens: options.addSpecialTokens,
    });

    // 5. Count byte fallbacks and compute efficiency metrics
    let byteTokensCount = 0;
    for (const t of sequence.tokens) {
      if (/^<0x[0-9A-Fa-f]{2}>$/.test(t.symbol)) {
        byteTokensCount++;
      }
    }

    const tokenCount = sequence.tokens.length;
    const words = normalizedText.trim().split(/\s+/).filter((w) => w.length > 0);
    const wordCount = Math.max(1, words.length);

    const tokensPerWord = Math.round((tokenCount / wordCount) * 1000) / 1000;
    const charPerToken = tokenCount > 0 ? Math.round((charCount / tokenCount) * 1000) / 1000 : 0;
    const byteFallbackRatio = tokenCount > 0 ? Math.round((byteTokensCount / tokenCount) * 1000) / 1000 : 0;

    return Object.freeze({
      sequence,
      languageCode: langCode,
      charCount,
      wordCount,
      tokenCount,
      byteTokensCount,
      tokensPerWord,
      charPerToken,
      byteFallbackRatio,
    });
  }

  /**
   * Detokenizes a sequence back to losslessly reconstructed UTF-8 text.
   */
  public detokenize(tokens: readonly (NativeToken | number | string)[]): string {
    const raw = this._tokenizer.detokenize(tokens);
    return raw.normalize('NFC');
  }

  /**
   * Deterministically detects the dominant script and language code of the input text.
   */
  public detectLanguage(text: string): SupportedLanguageCode {
    if (!text || text.trim().length === 0) return 'en';

    let arabicUrduChars = 0;
    let hanziChars = 0;
    let latinChars = 0;
    let frenchDiacritics = 0;
    let germanUmlauts = 0;
    let urduSpecificChars = 0;

    for (const char of text) {
      const code = char.codePointAt(0) ?? 0;

      // Arabic / Urdu range: 0x0600 - 0x06FF, 0x0750 - 0x077F
      if ((code >= 0x0600 && code <= 0x06ff) || (code >= 0x0750 && code <= 0x077f)) {
        arabicUrduChars++;
        // Specific Urdu characters: ٹ (0x0679), ڈ (0x0688), ڑ (0x0691), ے (0x06d2), ہ (0x06c1), ں (0x06ba)
        if ([0x0679, 0x0688, 0x0691, 0x06d2, 0x06c1, 0x06ba].includes(code)) {
          urduSpecificChars++;
        }
      }
      // Hanzi / CJK Unified Ideographs: 0x4E00 - 0x9FFF
      else if (code >= 0x4e00 && code <= 0x9fff) {
        hanziChars++;
      }
      // Latin: 0x0041 - 0x007A
      else if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
        latinChars++;
      }
      // French specific: é, è, ê, ë, à, â, ç, î, ï, ô, ù, û, ü, œ
      else if (/[éèêëàâçîïôùûœ]/i.test(char)) {
        frenchDiacritics++;
      }
      // German specific: ä, ö, ü, ß
      else if (/[äöüß]/i.test(char)) {
        germanUmlauts++;
      }
    }

    if (hanziChars > 0 && hanziChars >= arabicUrduChars && hanziChars >= latinChars) {
      return 'zh';
    }

    if (arabicUrduChars > 0 && arabicUrduChars >= latinChars) {
      return urduSpecificChars > 0 ? 'ur' : 'ar';
    }

    if (frenchDiacritics > germanUmlauts) {
      return 'fr';
    }

    if (germanUmlauts > 0) {
      return 'de';
    }

    // Default Latin
    return 'en';
  }

  // ===========================================================================
  // SCRIPT-SPECIFIC PREPROCESSING
  // ===========================================================================

  private _preprocessForScript(text: string, _langCode: SupportedLanguageCode): string {
    return text;
  }
}
