/**
 * CUBiO AI — Phase 6: Task 77
 * Native Language Model Scaling
 * src/cubio/language/native/scaling/languageModelScaler.ts
 *
 * Evaluation engine for comparing configurations across the scaling spectrum.
 * Computes the Pareto frontier of perplexity vs computational cost,
 * tracks parameter progression, and detects capacity saturation.
 */

import {
  LanguageScalingTier,
  LanguageArchitectureConfig,
  STANDARD_LANGUAGE_TIERS,
  LanguageEvaluationMetrics,
  ParetoFrontierPoint,
  LanguageModelSaturationError,
} from './languageScalingTypes';
import { NativeLanguageArchitecture } from './nativeLanguageArchitecture';
import { NativeTokenizer } from '../nativeTokenizer';

export interface TierEvaluationResult {
  readonly tier: LanguageScalingTier;
  readonly parameterCount: number;
  readonly weightMemoryBytes: number;
  readonly metrics: LanguageEvaluationMetrics;
  readonly trainingLosses: readonly number[];
}

export interface SpectrumComparisonReport {
  readonly evaluatedTiers: readonly TierEvaluationResult[];
  readonly paretoFrontier: readonly ParetoFrontierPoint[];
  readonly recommendedTier: LanguageScalingTier;
  readonly saturationDetected: boolean;
  readonly saturationTier?: LanguageScalingTier;
}

export class LanguageModelScaler {
  private readonly _tokenizer: NativeTokenizer;

  constructor(tokenizer?: NativeTokenizer) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
  }

  /**
   * Trains and evaluates a model configuration over a corpus of text lines.
   */
  public trainAndEvaluateTier(
    config: LanguageArchitectureConfig,
    trainCorpus: readonly string[],
    valCorpus: readonly string[],
    epochs = 2,
    lr = 0.05,
    seed = 42
  ): TierEvaluationResult {
    const model = new NativeLanguageArchitecture(config, 't_scaling_bench', seed);

    // Prepare token sequences
    const trainSequences: number[][] = [];
    for (const text of trainCorpus) {
      const tokens = this._tokenizer.tokenize(text).tokens;
      if (tokens.length >= 2) {
        trainSequences.push(tokens.map((t) => t.id));
      }
    }

    const valSequences: number[][] = [];
    for (const text of valCorpus) {
      const tokens = this._tokenizer.tokenize(text).tokens;
      if (tokens.length >= 2) {
        valSequences.push(tokens.map((t) => t.id));
      }
    }

    // Training loop
    const trainingLosses: number[] = [];
    for (let ep = 0; ep < epochs; ep++) {
      let epLoss = 0;
      let count = 0;
      for (const seq of trainSequences) {
        // Next-token prediction: input seq[0..n-2], target seq[1..n-1]
        const inputTokens = seq.slice(0, -1);
        const targetTokens = seq.slice(1);
        const stepLoss = model.trainStep(inputTokens, targetTokens, lr);
        epLoss += stepLoss;
        count++;
      }
      trainingLosses.push(count > 0 ? epLoss / count : 0);
    }

    // Validation evaluation
    let totalValLoss = 0;
    let totalValTokens = 0;
    let totalCorrect = 0;
    let totalElapsedMs = 0;

    for (const seq of valSequences) {
      const inputTokens = seq.slice(0, -1);
      const targetTokens = seq.slice(1);

      const t0 = performance.now();
      const m = model.evaluate(inputTokens, targetTokens);
      totalElapsedMs += performance.now() - t0;

      totalValLoss += m.loss * m.evaluatedTokens;
      totalValTokens += m.evaluatedTokens;
      totalCorrect += m.accuracy * m.evaluatedTokens;
    }

    const avgLoss = totalValTokens > 0 ? totalValLoss / totalValTokens : 0;
    const perplexity = Math.min(1e5, Math.exp(avgLoss));
    const accuracy = totalValTokens > 0 ? totalCorrect / totalValTokens : 0;
    const latencyUs = totalValTokens > 0 ? (totalElapsedMs / totalValTokens) * 1000 : 0;
    const tokensPerSec = totalElapsedMs > 0 ? (totalValTokens / totalElapsedMs) * 1000 : 0;
    const saturationRatio = Math.min(1.0, accuracy + 1.0 / Math.max(1.0, avgLoss));

    const metrics: LanguageEvaluationMetrics = Object.freeze({
      loss: avgLoss,
      perplexity,
      accuracy,
      evaluatedTokens: totalValTokens,
      inferenceLatencyUs: latencyUs,
      tokensPerSec,
      saturationRatio,
    });

    return Object.freeze({
      tier: config.tier,
      parameterCount: model.inventory.totalParameters,
      weightMemoryBytes: model.inventory.weightMemoryBytes,
      metrics,
      trainingLosses: Object.freeze(trainingLosses),
    });
  }

  /**
   * Compares all standard scaling tiers across an identical corpus.
   */
  public evaluateSpectrum(
    trainCorpus: readonly string[],
    valCorpus: readonly string[],
    tiersToEvaluate?: LanguageScalingTier[],
    epochs = 2
  ): SpectrumComparisonReport {
    const targetTiers = tiersToEvaluate || [
      LanguageScalingTier.TINY_BASELINE,
      LanguageScalingTier.MINI,
      LanguageScalingTier.COMPACT,
      LanguageScalingTier.BALANCED,
      LanguageScalingTier.EXTENDED,
    ];

    const results: TierEvaluationResult[] = [];
    for (const tier of targetTiers) {
      const cfg = STANDARD_LANGUAGE_TIERS[tier];
      const r = this.trainAndEvaluateTier(cfg, trainCorpus, valCorpus, epochs);
      results.push(r);
    }

    // Build Pareto Frontier
    const frontierPoints: ParetoFrontierPoint[] = results.map((r) => {
      // Efficiency score: higher throughput / perplexity ratio
      const eff = (r.metrics.tokensPerSec / Math.max(1.0, r.metrics.perplexity)) * (r.metrics.accuracy * 10);
      return Object.freeze({
        tier: r.tier,
        parameterCount: r.parameterCount,
        perplexity: r.metrics.perplexity,
        tokensPerSec: r.metrics.tokensPerSec,
        latencyUs: r.metrics.inferenceLatencyUs,
        efficiencyScore: eff,
      });
    });

    // Detect saturation (diminishing return < 1% gain while params double)
    let saturationDetected = false;
    let saturationTier: LanguageScalingTier | undefined;

    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      const lossDelta = prev.metrics.loss - curr.metrics.loss;
      const paramRatio = curr.parameterCount / prev.parameterCount;

      // If parameters grew >= 2x but loss decreased by less than 0.005, flag saturation
      if (paramRatio >= 2.0 && lossDelta < 0.005) {
        saturationDetected = true;
        saturationTier = curr.tier;
        break;
      }
    }

    // Recommended tier is best efficiency score on Pareto frontier
    let bestEff = -Infinity;
    let recommended = targetTiers[0];
    for (const p of frontierPoints) {
      if (p.efficiencyScore > bestEff) {
        bestEff = p.efficiencyScore;
        recommended = p.tier;
      }
    }

    return Object.freeze({
      evaluatedTiers: Object.freeze(results),
      paretoFrontier: Object.freeze(frontierPoints),
      recommendedTier: recommended,
      saturationDetected,
      saturationTier,
    });
  }
}
