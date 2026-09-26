/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_tokenizer.ts
 *
 * Deterministic Native Tokenizer: CUBIO-TOKENIZER-V1.
 * Supports:
 * - UTF-8 character encoding and fallback
 * - Urdu script (Nastaliq & Naskh Unicode characters)
 * - Roman Urdu subwords
 * - English wordpieces & subwords
 * - Numerical and mathematical operators
 * - Special tokens and epistemic control tags
 * - Bounded sequence lengths and zero external dependencies
 */

import {
  CUBIO_TOKENIZER_ID,
  CUBIO_VOCABULARY_ID,
} from './native_model_types';
import {
  VocabularyCatalog,
  NativeVocabularyBuilder,
} from './native_vocabulary';
import { ExternalModelGuard } from './external_model_guard';

export interface EncodeOptions {
  addSpecialTokens?: boolean;
  maxSeqLen?: number;
  padToMaxLen?: boolean;
}

export interface DecodeOptions {
  skipSpecialTokens?: boolean;
}

export class NativeTokenizer {
  public readonly tokenizerId = CUBIO_TOKENIZER_ID;
  public readonly vocabularyId = CUBIO_VOCABULARY_ID;
  private readonly vocab: VocabularyCatalog;
  private readonly sortedVocabKeys: string[];
  private readonly maxSubwordLen: number;

  constructor(vocabCatalog?: VocabularyCatalog) {
    this.vocab = vocabCatalog ?? NativeVocabularyBuilder.buildVocabulary();

    // Verify vocab has zero external model dependencies
    ExternalModelGuard.assertNativeOnly(this.tokenizerId);
    ExternalModelGuard.assertNativeOnly(this.vocabularyId);

    // Pre-sort vocabulary keys by descending length for greedy longest-match tokenization
    this.sortedVocabKeys = Array.from(this.vocab.tokenToId.keys()).sort(
      (a, b) => b.length - a.length
    );

    let maxLen = 1;
    for (const key of this.sortedVocabKeys) {
      if (key.length > maxLen) maxLen = key.length;
    }
    this.maxSubwordLen = maxLen;
  }

  public getTokenizerId(): string {
    return this.tokenizerId;
  }

  public getVocabSize(): number {
    return this.vocab.size;
  }

  public getVocabularyHash(): string {
    return this.vocab.vocabularyHash;
  }

  public getSpecialTokenId(tokenName: keyof typeof NativeVocabularyBuilder.SPECIAL_TOKENS): number {
    const val = NativeVocabularyBuilder.SPECIAL_TOKENS[tokenName];
    return this.vocab.tokenToId.get(val) ?? 1; // 1 is UNK
  }

  /**
   * Tokenizes an input string into token pieces using longest-prefix greedy matching.
   */
  public tokenize(text: string): string[] {
    if (!text || text.length === 0) return [];

    const pieces: string[] = [];
    let i = 0;
    const len = text.length;

    while (i < len) {
      let matched = false;
      const endLimit = Math.min(len, i + this.maxSubwordLen);

      // Check special tokens or multi-character subwords
      for (let j = endLimit; j > i; j--) {
        const substr = text.substring(i, j);
        if (this.vocab.tokenToId.has(substr)) {
          pieces.push(substr);
          i = j;
          matched = true;
          break;
        }
      }

      // If no subword matched, fallback to single character
      if (!matched) {
        const char = text[i];
        if (this.vocab.tokenToId.has(char)) {
          pieces.push(char);
        } else {
          // Unknown character fallback
          pieces.push(NativeVocabularyBuilder.SPECIAL_TOKENS.UNK);
        }
        i++;
      }
    }

    return pieces;
  }

  /**
   * Encodes a string into an array of token IDs.
   */
  public encode(text: string, options: EncodeOptions = {}): number[] {
    const { addSpecialTokens = false, maxSeqLen, padToMaxLen = false } = options;
    const tokens: number[] = [];

    if (addSpecialTokens) {
      tokens.push(this.getSpecialTokenId('BOS'));
    }

    const pieces = this.tokenize(text);
    for (const p of pieces) {
      const id = this.vocab.tokenToId.get(p) ?? this.getSpecialTokenId('UNK');
      tokens.push(id);
    }

    if (addSpecialTokens) {
      tokens.push(this.getSpecialTokenId('EOS'));
    }

    // Sequence truncation if specified
    let finalTokens = tokens;
    if (maxSeqLen && finalTokens.length > maxSeqLen) {
      finalTokens = finalTokens.slice(0, maxSeqLen);
      if (addSpecialTokens && maxSeqLen > 1) {
        finalTokens[maxSeqLen - 1] = this.getSpecialTokenId('EOS');
      }
    }

    // Padding if specified
    if (padToMaxLen && maxSeqLen && finalTokens.length < maxSeqLen) {
      const padId = this.getSpecialTokenId('PAD');
      while (finalTokens.length < maxSeqLen) {
        finalTokens.push(padId);
      }
    }

    return finalTokens;
  }

  /**
   * Decodes an array of token IDs back into text.
   */
  public decode(tokens: number[], options: DecodeOptions = {}): string {
    const { skipSpecialTokens = false } = options;
    const specialValues = new Set<string>(Object.values(NativeVocabularyBuilder.SPECIAL_TOKENS));

    let result = '';
    for (const id of tokens) {
      const piece = this.vocab.idToToken.get(id);
      if (!piece) continue;

      if (skipSpecialTokens && specialValues.has(piece)) {
        continue;
      }
      result += piece;
    }

    // Post-decode normalization: collapse spaces, fix punctuation spacing, trim
    result = result
      .replace(/\s+/g, ' ')                          // collapse multiple whitespace to single space
      .replace(/\s+([.,!?;:)\]}])/g, '$1')            // remove space before closing punctuation
      .replace(/([(\[{])\s+/g, '$1')                  // remove space after opening brackets
      .trim();

    return result;
  }

  /**
   * Encodes text into tensor-compatible batch structure with attention masks
   */
  public batchEncode(texts: string[], maxSeqLen = 128): { inputIds: number[][]; attentionMask: number[][] } {
    const inputIds: number[][] = [];
    const attentionMask: number[][] = [];

    for (const text of texts) {
      const ids = this.encode(text, { addSpecialTokens: true, maxSeqLen, padToMaxLen: true });
      const padId = this.getSpecialTokenId('PAD');
      const mask = ids.map((id) => (id === padId ? 0 : 1));
      inputIds.push(ids);
      attentionMask.push(mask);
    }

    return { inputIds, attentionMask };
  }
}
