/**
 * CUBiO AI — Phase 6: Task 74
 * Native Language Representation Layer
 * src/cubio/language/native/nativeLanguageEncoder.ts
 *
 * Sovereign Native Language Encoder.
 * Deterministically projects native token sequences into representation tensors
 * grounded in the 343-cell spatial lattice (7x7x7) and mathematical harmonic coordinates.
 * Strictly free from external neural network checkpoints or pretrained weights.
 */

import { cellIdToCoordinate } from '../../../core/address369';
import { NativeToken, NativeLanguageSequence, DEFAULT_LANGUAGE_BUDGET } from './languageTypes';
import { NativeTokenizer, TokenizeOptions } from './nativeTokenizer';

export const SPATIAL_EMBED_DIM = 16; // Standard SPATIAL_DIM in AdaptationCore

export interface EncodedLanguageRepresentation {
  readonly sequenceEmbedding: Float32Array;
  readonly tokenEmbeddings: readonly Float32Array[];
  readonly spatialCellIds: readonly number[];
}

export class NativeLanguageEncoder {
  private readonly _tokenizer: NativeTokenizer;

  constructor(tokenizer?: NativeTokenizer) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  /**
   * Deterministically projects a NativeLanguageSequence into FP32 embedding tensors.
   */
  public encodeSequence(sequence: NativeLanguageSequence): EncodedLanguageRepresentation {
    const tokens = sequence.tokens;
    const tokenEmbeddings: Float32Array[] = [];
    const seqEmbed = new Float32Array(SPATIAL_EMBED_DIM);

    if (tokens.length === 0) {
      return Object.freeze({
        sequenceEmbedding: seqEmbed,
        tokenEmbeddings: Object.freeze([]),
        spatialCellIds: Object.freeze([]),
      });
    }

    // Compute token embeddings grounded in spatial lattice and harmonic frequencies
    for (let pos = 0; pos < tokens.length; pos++) {
      const token = tokens[pos];
      const tEmbed = this.computeTokenEmbedding(token, pos, tokens.length);
      tokenEmbeddings.push(tEmbed);

      // Accumulate into sequence representation
      for (let d = 0; d < SPATIAL_EMBED_DIM; d++) {
        seqEmbed[d] += tEmbed[d];
      }
    }

    // Mean pool across sequence length
    const invLen = 1.0 / tokens.length;
    for (let d = 0; d < SPATIAL_EMBED_DIM; d++) {
      seqEmbed[d] *= invLen;
    }

    // L2 normalize sequence embedding
    this._normalizeL2(seqEmbed);

    return Object.freeze({
      sequenceEmbedding: seqEmbed,
      tokenEmbeddings: Object.freeze(tokenEmbeddings),
      spatialCellIds: sequence.spatialCellIds,
    });
  }

  /**
   * Tokenizes and encodes raw text in a single deterministic pass.
   */
  public encodeText(
    text: string,
    options?: TokenizeOptions
  ): { sequence: NativeLanguageSequence; representation: EncodedLanguageRepresentation } {
    const sequence = this._tokenizer.tokenize(text, options);
    const representation = this.encodeSequence(sequence);

    // Overwrite the placeholder sequence embedding with normalized sequence embedding
    for (let i = 0; i < SPATIAL_EMBED_DIM; i++) {
      sequence.embedding[i] = representation.sequenceEmbedding[i];
    }

    return { sequence, representation };
  }

  /**
   * Computes deterministic mathematical embedding for an individual token.
   * Grounded in 3D spatial cell coordinates (x, y, z in [0..6]) and positional frequencies.
   */
  public computeTokenEmbedding(token: NativeToken, position: number, seqLength: number): Float32Array {
    const vec = new Float32Array(SPATIAL_EMBED_DIM);
    const coord = cellIdToCoordinate(token.spatialCellId);

    // Coordinate normalized to [-1.0, 1.0]
    const nx = (coord.x - 3.0) / 3.0;
    const ny = (coord.y - 3.0) / 3.0;
    const nz = (coord.z - 3.0) / 3.0;

    for (let d = 0; d < SPATIAL_EMBED_DIM; d++) {
      // Positional frequency component
      const omega = 1.0 / Math.pow(100.0, (2 * (d % 8)) / 16.0);
      const posTerm = Math.sin((position + 1) * omega);

      // Spatial cell modulation component
      let spatialTerm = 0;
      if (d % 3 === 0) spatialTerm = nx;
      else if (d % 3 === 1) spatialTerm = ny;
      else spatialTerm = nz;

      // Token ID discrete harmonic
      const idTerm = Math.cos((token.id + 1) * 0.369 * (d + 1));

      vec[d] = 0.5 * posTerm + 0.3 * spatialTerm + 0.2 * idTerm;
    }

    this._normalizeL2(vec);
    return vec;
  }

  /**
   * Computes cosine similarity between two Float32 vectors.
   */
  public computeCosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA <= 0 || normB <= 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private _normalizeL2(vec: Float32Array): void {
    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    if (sumSq > 1e-12) {
      const invNorm = 1.0 / Math.sqrt(sumSq);
      for (let i = 0; i < vec.length; i++) {
        vec[i] *= invNorm;
      }
    }
  }
}
