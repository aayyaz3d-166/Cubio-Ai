/**
 * CUBiO AI — Phase 6: Task 74
 * Native Language Representation Layer
 * src/cubio/language/native/nativeTokenizer.ts
 *
 * Sovereign Native Tokenizer.
 * Executes deterministic tokenization and lossless reconstruction.
 * Features full Unicode-safe byte-fallback for zero out-of-vocabulary failure,
 * epistemic classification preservation, and 343 spatial cell grounding.
 */

import * as crypto from 'crypto';
import { TOTAL_SPATIAL_CELLS } from '../../../core/address369';
import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../core/canonicalIdentity';
import { EpistemicStatus } from '../../epistemic/native/epistemicTypes';
import {
  NativeToken,
  NativeLanguageSequence,
  TokenKind,
  MalformedLanguageInputError,
  SequenceLengthExceededError,
  DEFAULT_LANGUAGE_BUDGET,
} from './languageTypes';
import { NativeVocabulary, SPECIAL_TOKENS } from './nativeVocabulary';

export interface TokenizeOptions {
  readonly tenantId?: string;
  readonly domain?: CanonicalDomain;
  readonly objectId?: string;
  readonly epistemicStatus?: EpistemicStatus;
  readonly maxSequenceLength?: number;
  readonly provenanceId?: string;
  readonly addSpecialTokens?: boolean;
}

export class NativeTokenizer {
  private readonly _vocab: NativeVocabulary;

  constructor(vocab?: NativeVocabulary) {
    this._vocab = vocab ?? NativeVocabulary.getInstance();
  }

  public get vocab(): NativeVocabulary {
    return this._vocab;
  }

  /**
   * Deterministically tokenizes a raw UTF-8 string into a NativeLanguageSequence.
   */
  public tokenize(text: string, options: TokenizeOptions = {}): NativeLanguageSequence {
    if (typeof text !== 'string') {
      throw new MalformedLanguageInputError(
        `Language input must be a string. Received: ${typeof text}`
      );
    }

    const tenantId = options.tenantId?.trim() || DEFAULT_TENANT_ID;
    const domain = options.domain || 'KNOWLEDGE';
    const contentSeed = crypto
      .createHash('sha256')
      .update(`${tenantId}:${domain}:${text}`, 'utf8')
      .digest('hex')
      .slice(0, 16);
    const objectId = options.objectId || `lang_seq_${contentSeed}`;
    const provenanceId = options.provenanceId || `prov_${contentSeed}`;
    const maxLen = options.maxSequenceLength ?? DEFAULT_LANGUAGE_BUDGET.maxSequenceLength;

    // Epistemic parsing
    let effectiveEpistemic: EpistemicStatus = options.epistemicStatus || 'CANONICAL_FACT';
    let processedText = text;

    if (processedText.startsWith('[FACT] ') || processedText.startsWith('FACT: ')) {
      effectiveEpistemic = 'CANONICAL_FACT';
    } else if (processedText.startsWith('[EVIDENCE] ') || processedText.startsWith('EVIDENCE: ')) {
      effectiveEpistemic = 'EMPIRICAL_EVIDENCE';
    } else if (processedText.startsWith('[HYPOTHESIS] ') || processedText.startsWith('HYPOTHESIS: ')) {
      effectiveEpistemic = 'SUPPORTED_HYPOTHESIS';
    } else if (processedText.startsWith('[UNKNOWN] ') || processedText.startsWith('UNKNOWN: ')) {
      effectiveEpistemic = 'EPISTEMIC_UNKNOWN';
    }

    const rawTokens = this._splitIntoTokens(processedText);
    const tokens: NativeToken[] = [];

    if (options.addSpecialTokens) {
      tokens.push(this._createToken(SPECIAL_TOKENS.BOS, '<bos>', 'SPECIAL', effectiveEpistemic));
    }

    for (const raw of rawTokens) {
      const token = this._resolveToken(raw, effectiveEpistemic);
      if (Array.isArray(token)) {
        for (const t of token) {
          tokens.push(t);
        }
      } else {
        tokens.push(token);
      }
    }

    if (options.addSpecialTokens) {
      tokens.push(this._createToken(SPECIAL_TOKENS.EOS, '<eos>', 'SPECIAL', effectiveEpistemic));
    }

    if (tokens.length > maxLen) {
      throw new SequenceLengthExceededError(
        `Token sequence length (${tokens.length}) exceeds maximum allowable budget (${maxLen})`
      );
    }

    // Activated spatial cells
    const cellSet = new Set<number>();
    for (const t of tokens) {
      cellSet.add(t.spatialCellId);
    }
    const spatialCellIds = Object.freeze(Array.from(cellSet).sort((a, b) => a - b));

    // Compute cryptographic checksum over sequence
    const checksumPayload = JSON.stringify({
      tenantId,
      domain,
      objectId,
      tokens: tokens.map((t) => ({ id: t.id, symbol: t.symbol, cell: t.spatialCellId })),
      epistemicStatus: effectiveEpistemic,
      rawText: text,
      vocabMerkleRoot: this._vocab.merkleRoot,
    });
    const checksum = crypto.createHash('sha256').update(checksumPayload, 'utf8').digest('hex');

    // Create zero-placeholder or pooled embedding
    const embedding = new Float32Array(16); // Standard SPATIAL_DIM
    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length; i++) {
        const cell = tokens[i].spatialCellId;
        const dimIdx = cell % 16;
        embedding[dimIdx] += 1.0 / tokens.length;
      }
    }

    const now = Date.now();

    return Object.freeze({
      mathType: 'NATIVE_LANGUAGE_SEQUENCE',
      sequenceId: `seq_${checksum.slice(0, 16)}`,
      objectId,
      tenantId,
      domain,
      stateVersion: 1,
      tokens: Object.freeze(tokens),
      rawText: text,
      length: tokens.length,
      embedding,
      spatialCellIds,
      epistemicStatus: effectiveEpistemic,
      checksum,
      provenanceId,
      vocabVersion: this._vocab.version,
      vocabChecksum: this._vocab.merkleRoot,
      timestamps: Object.freeze({
        createdAt: now,
        updatedAt: now,
      }),
    });
  }

  /**
   * Reconstructs raw text losslessly from a sequence of tokens.
   */
  public detokenize(tokens: readonly (NativeToken | number | string)[]): string {
    if (!tokens || !Array.isArray(tokens)) {
      throw new MalformedLanguageInputError('Detokenize expects an array of tokens, ids, or symbols');
    }

    const byteChunks: number[] = [];
    let textResult = '';

    const flushBytes = () => {
      if (byteChunks.length > 0) {
        textResult += Buffer.from(byteChunks).toString('utf8');
        byteChunks.length = 0;
      }
    };

    for (const item of tokens) {
      let symbol: string;
      if (typeof item === 'number') {
        symbol = this._vocab.getSymbol(item);
      } else if (typeof item === 'string') {
        symbol = item;
      } else if (item && typeof item === 'object' && 'symbol' in item) {
        symbol = item.symbol;
      } else {
        continue;
      }

      // Skip BOS, EOS, PAD
      if (symbol === '<bos>' || symbol === '<eos>' || symbol === '<pad>' || symbol === '<mask>') {
        continue;
      }

      // Check byte token <0x..>
      const byteMatch = /^<0x([0-9A-Fa-f]{2})>$/.exec(symbol);
      if (byteMatch) {
        const byteVal = parseInt(byteMatch[1], 16);
        byteChunks.push(byteVal);
      } else {
        flushBytes();
        textResult += symbol;
      }
    }

    flushBytes();
    return textResult;
  }

  /**
   * Tokenizes text using regex token segmentation preserving exact whitespace and punctuation.
   */
  private _splitIntoTokens(text: string): string[] {
    if (!text) return [];

    // Regex matching special tokens, words, single characters, spaces, punctuation
    const regex = /(<[a-z0-9_x]+>|\s+|[A-Za-z0-9]+|[^\sA-Za-z0-9])/gu;
    const matches = text.match(regex);
    return matches ? matches : [text];
  }

  /**
   * Resolves a raw string chunk into one or more NativeTokens.
   */
  private _resolveToken(
    chunk: string,
    epistemic: EpistemicStatus
  ): NativeToken | NativeToken[] {
    // 1. Direct vocabulary hit
    if (this._vocab.has(chunk)) {
      const id = this._vocab.getId(chunk);
      const kind = this._determineTokenKind(chunk, id);
      return this._createToken(id, chunk, kind, epistemic);
    }

    // 2. Greedy longest subword matching across chunk
    const tokens: NativeToken[] = [];
    let pos = 0;

    while (pos < chunk.length) {
      let matched = false;
      // Try longest prefix from remaining chunk
      for (let len = chunk.length - pos; len >= 1; len--) {
        const sub = chunk.slice(pos, pos + len);
        if (this._vocab.has(sub)) {
          const id = this._vocab.getId(sub);
          const kind = this._determineTokenKind(sub, id);
          tokens.push(this._createToken(id, sub, kind, epistemic));
          pos += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Fallback: encode the next Unicode code point as byte tokens
        const codePoint = chunk.codePointAt(pos)!;
        const char = String.fromCodePoint(codePoint);
        const charBuf = Buffer.from(char, 'utf8');
        for (let b = 0; b < charBuf.length; b++) {
          const byteVal = charBuf[b];
          const byteSym = this._vocab.getByteToken(byteVal);
          const byteId = this._vocab.getByteTokenId(byteVal);
          tokens.push(this._createToken(byteId, byteSym, 'BYTE_FALLBACK', epistemic));
        }
        pos += char.length;
      }
    }

    return tokens;
  }

  private _determineTokenKind(symbol: string, id: number): TokenKind {
    if (id < 9) return 'SPECIAL';
    if (id >= 9 && id < 265) return 'BYTE_FALLBACK';
    if (/^\d+$/.test(symbol)) return 'NUMERIC';
    if (/^[.,!?;:\-_()[\]{}"'`/@#$%^&*+=<>~|]$/.test(symbol)) return 'PUNCTUATION';
    if (/^[A-Za-z]+$/.test(symbol)) return 'WORD';
    return 'SUBWORD';
  }

  private _createToken(
    id: number,
    symbol: string,
    kind: TokenKind,
    epistemic: EpistemicStatus
  ): NativeToken {
    // Deterministic spatial cell grounding into [0..342]
    const hashVal = crypto.createHash('sha256').update(symbol, 'utf8').digest();
    const unsignedHash = ((hashVal.readUInt32BE(0) ^ (id * 31)) >>> 0);
    const spatialCellId = unsignedHash % TOTAL_SPATIAL_CELLS;

    const tokenChecksum = crypto
      .createHash('sha256')
      .update(`${id}:${symbol}:${kind}:${spatialCellId}:${epistemic}`, 'utf8')
      .digest('hex');

    return Object.freeze({
      id,
      symbol,
      kind,
      spatialCellId,
      epistemicTag: epistemic,
      checksum: tokenChecksum,
    });
  }
}
