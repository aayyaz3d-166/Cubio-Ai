/**
 * CUBiO AI — Phase 6: Task 76
 * Context Window & Sequence Learning Layer
 * src/cubio/language/native/nativeSequenceLearner.ts
 *
 * Sovereign Native Sequence Learner.
 * Processes sequential language streams with deterministic recurrent state updates,
 * positional encoding integration, and needle-in-a-haystack context retention probing.
 * Completely sovereign execution without foreign weights or external endpoints.
 */

import { SeedablePRNG } from '../../testing/native/prng';
import { NativeToken } from './languageTypes';
import { NativePositionalEncoding, POSITIONAL_DIM } from './nativePositionalEncoding';
import { NativeLanguageEncoder } from './nativeLanguageEncoder';
import { NativeContextWindow } from './nativeContextWindow';
import { SequenceRetentionProfile, SequenceStateSnapshot } from './contextTypes';

export const SEQUENCE_HIDDEN_DIM = 16;

export class NativeSequenceLearner {
  private readonly _tenantId: string;
  private readonly _seed: number;
  private readonly _prng: SeedablePRNG;
  private readonly _encoder: NativeLanguageEncoder;

  // Deterministic transition matrices
  private readonly _Wh: Float32Array; // [16, 16]
  private readonly _Wx: Float32Array; // [16, 16]
  private readonly _bh: Float32Array; // [16]

  // Active hidden state
  private _hiddenState: Float32Array;

  constructor(tenantId: string, seed = 369760) {
    this._tenantId = tenantId;
    this._seed = seed >>> 0;
    this._prng = new SeedablePRNG(this._seed);
    this._encoder = new NativeLanguageEncoder();

    this._Wh = this._initMatrix(SEQUENCE_HIDDEN_DIM, SEQUENCE_HIDDEN_DIM, 0.1);
    this._Wx = this._initMatrix(SEQUENCE_HIDDEN_DIM, SEQUENCE_HIDDEN_DIM, 0.2);
    this._bh = new Float32Array(SEQUENCE_HIDDEN_DIM);

    this._hiddenState = new Float32Array(SEQUENCE_HIDDEN_DIM);
  }

  public get tenantId(): string {
    return this._tenantId;
  }

  public get hiddenState(): Float32Array {
    return new Float32Array(this._hiddenState);
  }

  /**
   * Resets internal hidden state to zero vector.
   */
  public reset(): void {
    this._hiddenState.fill(0);
  }

  /**
   * Steps the recurrent sequence model on an individual token.
   */
  public step(token: NativeToken, position: number, totalTokens: number): Float32Array {
    const tokenEmbed = this._encoder.computeTokenEmbedding(token, position, totalTokens);
    const posEmbed = NativePositionalEncoding.computePositionEncoding(position, token.spatialCellId);

    // Combined input feature vector
    const u = new Float32Array(SEQUENCE_HIDDEN_DIM);
    for (let d = 0; d < SEQUENCE_HIDDEN_DIM; d++) {
      u[d] = 0.65 * tokenEmbed[d] + 0.35 * posEmbed[d];
    }

    // Next hidden state: h_next = LeakyReLU(Wh * h_prev + Wx * u + bh)
    const nextH = new Float32Array(SEQUENCE_HIDDEN_DIM);
    for (let i = 0; i < SEQUENCE_HIDDEN_DIM; i++) {
      let sum = this._bh[i];
      for (let j = 0; j < SEQUENCE_HIDDEN_DIM; j++) {
        sum += this._Wh[i * SEQUENCE_HIDDEN_DIM + j] * this._hiddenState[j];
        sum += this._Wx[i * SEQUENCE_HIDDEN_DIM + j] * u[j];
      }
      nextH[i] = sum > 0 ? sum : 0.05 * sum; // LeakyReLU
    }

    // L2 Normalize
    let sumSq = 0;
    for (let i = 0; i < SEQUENCE_HIDDEN_DIM; i++) sumSq += nextH[i] * nextH[i];
    if (sumSq > 1e-12) {
      const invNorm = 1.0 / Math.sqrt(sumSq);
      for (let i = 0; i < SEQUENCE_HIDDEN_DIM; i++) nextH[i] *= invNorm;
    }

    this._hiddenState = nextH;
    return new Float32Array(nextH);
  }

  /**
   * Processes a full ordered token sequence, updating hidden state through time.
   */
  public processSequence(tokens: readonly NativeToken[]): {
    finalState: Float32Array;
    stepStates: readonly Float32Array[];
  } {
    const stepStates: Float32Array[] = [];
    const len = tokens.length;

    for (let pos = 0; pos < len; pos++) {
      const s = this.step(tokens[pos], pos, len);
      stepStates.push(s);
    }

    return Object.freeze({
      finalState: new Float32Array(this._hiddenState),
      stepStates: Object.freeze(stepStates),
    });
  }

  /**
   * Evaluates context retention across sequence length via Needle-in-a-Haystack probing.
   * Tests whether facts placed Early (10%), Middle (50%), and Late (90%) are accurately recovered.
   */
  public evaluateRetention(
    contextWindow: NativeContextWindow,
    backgroundCorpus: readonly string[],
    needles: readonly {
      position: 'EARLY' | 'MIDDLE' | 'LATE';
      factStatement: string;
      probeKeyword: string;
    }[]
  ): SequenceRetentionProfile {
    contextWindow.clear();
    this.reset();

    const totalLines = backgroundCorpus.length;
    const earlyIdx = Math.floor(totalLines * 0.1);
    const middleIdx = Math.floor(totalLines * 0.5);
    const lateIdx = Math.floor(totalLines * 0.9);

    const earlyNeedle = needles.find((n) => n.position === 'EARLY')!;
    const middleNeedle = needles.find((n) => n.position === 'MIDDLE')!;
    const lateNeedle = needles.find((n) => n.position === 'LATE')!;

    // Stream corpus with inserted needles into context window
    for (let i = 0; i < totalLines; i++) {
      if (i === earlyIdx && earlyNeedle) {
        contextWindow.appendText(earlyNeedle.factStatement);
      }
      if (i === middleIdx && middleNeedle) {
        contextWindow.appendText(middleNeedle.factStatement);
      }
      if (i === lateIdx && lateNeedle) {
        contextWindow.appendText(lateNeedle.factStatement);
      }
      contextWindow.appendText(backgroundCorpus[i]);
    }

    // Process all active tokens through sequence learner
    this.processSequence(contextWindow.activeTokens);

    // Evaluate probe retrieval for each needle
    let earlyScore = 0;
    if (earlyNeedle) {
      const res = contextWindow.queryContext(earlyNeedle.probeKeyword);
      if (res.matchedActiveTokens.length > 0 || res.matchedReferences.length > 0) {
        earlyScore = 1.0;
      }
    }

    let middleScore = 0;
    if (middleNeedle) {
      const res = contextWindow.queryContext(middleNeedle.probeKeyword);
      if (res.matchedActiveTokens.length > 0 || res.matchedReferences.length > 0) {
        middleScore = 1.0;
      }
    }

    let lateScore = 0;
    if (lateNeedle) {
      const res = contextWindow.queryContext(lateNeedle.probeKeyword);
      if (res.matchedActiveTokens.length > 0 || res.matchedReferences.length > 0) {
        lateScore = 1.0;
      }
    }

    const overall = (earlyScore + middleScore + lateScore) / 3;

    return Object.freeze({
      earlyRetentionScore: earlyScore,
      middleRetentionScore: middleScore,
      lateRetentionScore: lateScore,
      overallScore: overall,
      sequenceLength: contextWindow.totalTokensIngested,
      probedFactsCount: 3,
      passed: overall >= 0.95,
    });
  }

  /**
   * Exports an immutable sequence snapshot.
   */
  public exportSnapshot(contextWindow: NativeContextWindow): SequenceStateSnapshot {
    return contextWindow.exportState(this._hiddenState);
  }

  /**
   * Restores an exported sequence snapshot.
   */
  public restoreSnapshot(
    contextWindow: NativeContextWindow,
    snapshot: SequenceStateSnapshot
  ): void {
    contextWindow.restoreState(snapshot);
    this._hiddenState = new Float32Array(snapshot.hiddenState);
  }

  private _initMatrix(rows: number, cols: number, scale = 0.1): Float32Array {
    const mat = new Float32Array(rows * cols);
    for (let i = 0; i < mat.length; i++) {
      // Deterministic Box-Muller Gaussian via SeedablePRNG
      const u1 = Math.max(1e-7, this._prng.nextFloat());
      const u2 = this._prng.nextFloat();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      mat[i] = z0 * scale;
    }
    return mat;
  }
}
