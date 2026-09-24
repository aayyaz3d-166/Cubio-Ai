/**
 * CUBiO AI — Phase 6: Task 78
 * Native Language Training & Curriculum
 * src/cubio/language/native/curriculum/languageBatchGenerator.ts
 *
 * Deterministic seeded batch generator with split containment verification,
 * bounded batch size, and bounded context length.
 */

import { SeedablePRNG } from '../../../testing/native/prng';
import {
  LanguageCurriculumSample,
  LanguageDatasetSplit,
  LanguageSplitLeakageError,
  LanguageCurriculumBudgetExceededError,
  DEFAULT_CURRICULUM_BUDGET,
} from './languageCurriculumTypes';

export interface CurriculumBatch {
  readonly batchIndex: number;
  readonly samples: readonly LanguageCurriculumSample[];
  readonly inputSequences: readonly (readonly number[])[];
  readonly targetSequences: readonly (readonly number[])[];
  readonly totalTokens: number;
}

export class LanguageBatchGenerator {
  private readonly _prng: SeedablePRNG;
  private readonly _batchSize: number;
  private readonly _maxSeqLen: number;

  constructor(
    seed = 42,
    batchSize = 8,
    maxSeqLen = 512
  ) {
    if (batchSize > DEFAULT_CURRICULUM_BUDGET.maxBatchSize) {
      throw new LanguageCurriculumBudgetExceededError(
        `Batch size ${batchSize} exceeds maximum allowable cap (${DEFAULT_CURRICULUM_BUDGET.maxBatchSize})`
      );
    }
    if (maxSeqLen > DEFAULT_CURRICULUM_BUDGET.maxSequenceTokens) {
      throw new LanguageCurriculumBudgetExceededError(
        `Max sequence length ${maxSeqLen} exceeds maximum allowable cap (${DEFAULT_CURRICULUM_BUDGET.maxSequenceTokens})`
      );
    }

    this._prng = new SeedablePRNG(seed);
    this._batchSize = Math.max(1, batchSize);
    this._maxSeqLen = Math.max(8, maxSeqLen);
  }

  /**
   * Generates deterministic batches for a target split.
   * Enforces split containment: throws if any sample has mismatched split.
   */
  public generateBatches(
    samples: readonly LanguageCurriculumSample[],
    expectedSplit: LanguageDatasetSplit = LanguageDatasetSplit.TRAIN
  ): CurriculumBatch[] {
    // 1. Strict split containment validation
    for (const s of samples) {
      if (s.split !== expectedSplit) {
        throw new LanguageSplitLeakageError(
          `Sample ${s.sampleId} with split ${s.split} entered batch generator for expected split ${expectedSplit}`
        );
      }
    }

    // 2. Deterministic Fisher-Yates shuffle using SeedablePRNG
    const shuffled = [...samples];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this._prng.nextFloat() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    // 3. Partition into bounded batches
    const batches: CurriculumBatch[] = [];
    let batchIndex = 0;

    for (let i = 0; i < shuffled.length; i += this._batchSize) {
      const batchSamples = shuffled.slice(i, i + this._batchSize);
      const inputSequences: number[][] = [];
      const targetSequences: number[][] = [];
      let totalTokens = 0;

      for (const s of batchSamples) {
        const fullTokens = s.tokenIds.slice(0, this._maxSeqLen);
        if (fullTokens.length < 2) continue;

        // Next-token prediction: input is [0..N-2], target is [1..N-1]
        const input = fullTokens.slice(0, -1);
        const target = fullTokens.slice(1);

        inputSequences.push(input);
        targetSequences.push(target);
        totalTokens += input.length;
      }

      if (inputSequences.length > 0) {
        batches.push(
          Object.freeze({
            batchIndex,
            samples: Object.freeze(batchSamples),
            inputSequences: Object.freeze(inputSequences.map((s) => Object.freeze(s))),
            targetSequences: Object.freeze(targetSequences.map((s) => Object.freeze(s))),
            totalTokens,
          })
        );
        batchIndex++;
      }
    }

    return batches;
  }
}
