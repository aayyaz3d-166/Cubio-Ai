/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * benchmark_runner.ts
 *
 * Benchmark Runner comparing Genesis Baseline vs Trained Model.
 * Measures:
 * - Inference latency (ms)
 * - Memory usage (RSS MB)
 * - Epistemic classification accuracy
 * - Non-fact lockout enforcement
 * - Baseline improvement delta
 */

import { CubiONativeModel } from './native_model_architecture';
import { NativeInferenceEngine } from './native_inference_engine';
import { EvaluationEngine } from './evaluation_engine';
import { EpistemicStatus } from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface BenchmarkMetrics {
  readonly modelId: string;
  readonly meanLatencyMs: number;
  readonly memoryRssMb: number;
  readonly overallAccuracy: number;
  readonly overallLoss: number;
  readonly nonFactLockoutRate: number;
  readonly externalCalls: number;
}

export interface BenchmarkReport {
  readonly benchmarkRunId: string;
  readonly genesisMetrics: BenchmarkMetrics;
  readonly trainedMetrics: BenchmarkMetrics;
  readonly deltaAccuracy: number;
  readonly deltaLoss: number;
  readonly deltaLatencyMs: number;
  readonly isPerformanceCompliant: boolean;
}

export class BenchmarkRunner {
  public static runBenchmark(
    genesisModel: CubiONativeModel,
    trainedModel: CubiONativeModel
  ): BenchmarkReport {
    ExternalModelGuard.assertNativeOnly(genesisModel.modelId);
    ExternalModelGuard.assertNativeOnly(trainedModel.modelId);

    const genesisEngine = new NativeInferenceEngine(genesisModel);
    const trainedEngine = new NativeInferenceEngine(trainedModel);
    const evalEngine = new EvaluationEngine();

    const evalBattery = evalEngine.generateEvaluationBattery();

    // 1. Evaluate Genesis Model
    const genLatencies: number[] = [];
    let genLockoutPassed = 0;
    let genLockoutTotal = 0;

    for (const item of evalBattery) {
      const out = genesisEngine.generate(item.prompt, { maxTokens: 16 });
      genLatencies.push(out.latencyMs);

      if (item.expectedStatus === EpistemicStatus.PREDICTION || item.expectedStatus === EpistemicStatus.HYPOTHESIS) {
        genLockoutTotal++;
        if (out.epistemicStatus !== EpistemicStatus.FACT) {
          genLockoutPassed++;
        }
      }
    }

    const genScore = evalEngine.evaluateModel(genesisModel, 'CHK_GENESIS');
    const genMeanLat = genLatencies.reduce((a, b) => a + b, 0) / Math.max(1, genLatencies.length);
    const genRss = Math.round((process.memoryUsage().rss / (1024 * 1024)) * 100) / 100;

    const genesisMetrics: BenchmarkMetrics = {
      modelId: genesisModel.modelId,
      meanLatencyMs: Math.round(genMeanLat * 100) / 100,
      memoryRssMb: genRss,
      overallAccuracy: genScore.overallAccuracy,
      overallLoss: genScore.overallLoss,
      nonFactLockoutRate: genLockoutTotal > 0 ? genLockoutPassed / genLockoutTotal : 1.0,
      externalCalls: 0,
    };

    // 2. Evaluate Trained Model
    const trainLatencies: number[] = [];
    let trainLockoutPassed = 0;
    let trainLockoutTotal = 0;

    for (const item of evalBattery) {
      const out = trainedEngine.generate(item.prompt, { maxTokens: 16 });
      trainLatencies.push(out.latencyMs);

      if (item.expectedStatus === EpistemicStatus.PREDICTION || item.expectedStatus === EpistemicStatus.HYPOTHESIS) {
        trainLockoutTotal++;
        if (out.epistemicStatus !== EpistemicStatus.FACT) {
          trainLockoutPassed++;
        }
      }
    }

    const trainScore = evalEngine.evaluateModel(trainedModel, 'CHK_TRAINED');
    const trainMeanLat = trainLatencies.reduce((a, b) => a + b, 0) / Math.max(1, trainLatencies.length);
    const trainRss = Math.round((process.memoryUsage().rss / (1024 * 1024)) * 100) / 100;

    const trainedMetrics: BenchmarkMetrics = {
      modelId: trainedModel.modelId,
      meanLatencyMs: Math.round(trainMeanLat * 100) / 100,
      memoryRssMb: trainRss,
      overallAccuracy: trainScore.overallAccuracy,
      overallLoss: trainScore.overallLoss,
      nonFactLockoutRate: trainLockoutTotal > 0 ? trainLockoutPassed / trainLockoutTotal : 1.0,
      externalCalls: 0,
    };

    const deltaAccuracy = Math.round((trainedMetrics.overallAccuracy - genesisMetrics.overallAccuracy) * 10000) / 10000;
    const deltaLoss = Math.round((trainedMetrics.overallLoss - genesisMetrics.overallLoss) * 10000) / 10000;
    const deltaLatencyMs = Math.round((trainedMetrics.meanLatencyMs - genesisMetrics.meanLatencyMs) * 100) / 100;

    const isPerformanceCompliant =
      trainedMetrics.memoryRssMb < 512 &&
      trainedMetrics.nonFactLockoutRate === 1.0 &&
      trainedMetrics.externalCalls === 0;

    return Object.freeze({
      benchmarkRunId: `BENCH_${Date.now()}`,
      genesisMetrics,
      trainedMetrics,
      deltaAccuracy,
      deltaLoss,
      deltaLatencyMs,
      isPerformanceCompliant,
    });
  }
}
