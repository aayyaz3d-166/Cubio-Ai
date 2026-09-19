/**
 * CUBiO AI -- Unified Native Frontier Benchmark Harness
 * src/cubio/benchmark/frontierBenchmarkHarness.ts
 *
 * Implements the authoritative, standardized evaluation harness for Phase 17 Frontier Benchmarks:
 * - Executes identical evaluation protocols across all benchmark categories.
 * - Records model hash, dataset hash, seed, runtime environment, latency, memory, outputs, scores, and failure evidence.
 * - Strict sovereign native enforcement: zero external models, zero cloud APIs, permanent actuation lock.
 * - Validates against known deterministic test cases and captures unredacted failure diagnostics.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  NativeTrainingIntegrationEngine,
  CanonicalTrainingSample,
  TrainingBatch,
  IS_ACTUATION_BLOCKED,
} from '../core/nativeTrainingIntegration';
import {
  NativeParameterScalingEngine,
  SCALED_1M_CONFIG,
  ParameterTierConfig,
} from '../scaling/parameterScalingEngine';
import { ThreeDMemoryCheckpointEngine } from '../core/threeDMemoryStreaming';
import { cellIdToAddress369, validateCellId } from '../../core/address369';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import { CUBIO_NATIVE_MODEL_ID } from '../model/native_foundation/native_model_types';
import { EpistemicStatus } from '../epistemic/native/epistemicTypes';

// ─── Interfaces & Types ──────────────────────────────────────────────────────

export interface FrontierBenchmarkSample extends CanonicalTrainingSample {
  readonly difficultyTier?: 'STANDARD' | 'HARD' | 'FRONTIER';
  readonly reasoningType?: string;
  readonly expectedSpatialAddress?: number;
}

export interface FrontierBenchmarkSuite {
  readonly suiteId: string;
  readonly suiteName: string;
  readonly domain: string;
  readonly version: string;
  readonly description: string;
  readonly samples: FrontierBenchmarkSample[];
}

export interface SampleEvaluationEvidence {
  readonly sampleId: string;
  readonly domain: string;
  readonly promptLength: number;
  readonly completionLength: number;
  readonly cellId: number;
  readonly address369: number;
  readonly spatialGroundingValid: boolean;
  readonly totalLoss: number;
  readonly tokenLoss: number;
  readonly epistemicLoss: number;
  readonly latencyMs: number;
  readonly passed: boolean;
  readonly failureReason?: string;
}

export interface FailureEvidenceRecord {
  readonly sampleId: string;
  readonly domain: string;
  readonly errorType: string;
  readonly errorMessage: string;
  readonly stackTrace?: string;
  readonly timestamp: string;
  readonly diagnosticContext?: any;
}

export interface BenchmarkLatencyProfile {
  readonly totalDurationMs: number;
  readonly sampleCount: number;
  readonly avgLatencyMs: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly minLatencyMs: number;
  readonly maxLatencyMs: number;
  readonly throughputTokensPerSec: number;
}

export interface BenchmarkMemoryProfile {
  readonly initialHeapUsedMb: number;
  readonly finalHeapUsedMb: number;
  readonly heapDeltaMb: number;
  readonly fp32WeightBytes: number;
}

export interface FrontierBenchmarkExecutionReport {
  readonly harnessTitle: string;
  readonly harnessVersion: string;
  readonly phase: string;
  readonly suiteId: string;
  readonly suiteName: string;
  readonly executedAt: string;
  readonly executionDurationSec: number;
  readonly modelMetadata: {
    readonly tierId: string;
    readonly parameterCount: number;
    readonly tensorCount: number;
    readonly checkpointPath: string;
    readonly checkpointSha256: string;
    readonly stateHash: string;
  };
  readonly datasetMetadata: {
    readonly suiteId: string;
    readonly sampleCount: number;
    readonly datasetSha256: string;
  };
  readonly seedSchedule: {
    readonly evaluationSeed: number;
  };
  readonly runtimeEnvironment: {
    readonly nodeVersion: string;
    readonly platform: string;
    readonly arch: string;
    readonly pid: number;
    readonly actuationBlocked: boolean;
  };
  readonly latencyProfile: BenchmarkLatencyProfile;
  readonly memoryProfile: BenchmarkMemoryProfile;
  readonly scoreSummary: {
    readonly totalSamples: number;
    readonly passedSamples: number;
    readonly failedSamples: number;
    readonly passRatePercent: number;
    readonly avgLoss: number;
    readonly avgTokenLoss: number;
    readonly avgEpistemicLoss: number;
    readonly spatialAccuracyPercent: number;
    readonly totalTokensEvaluated: number;
  };
  readonly sampleEvidence: SampleEvaluationEvidence[];
  readonly failureEvidence: FailureEvidenceRecord[];
  readonly passFailDecision: 'PASS' | 'FAIL';
}

export interface FrontierBenchmarkHarnessConfig {
  readonly checkpointPath: string;
  readonly evaluationSeed?: number;
  readonly expectedCheckpointSha256?: string;
  readonly expectedStateHash?: string;
  readonly parameterConfig?: ParameterTierConfig;
}

// ─── Unified Benchmark Harness Class ─────────────────────────────────────────

export class FrontierBenchmarkHarness {
  public static readonly HARNESS_VERSION = '1.0.0-NATIVE-FRONTIER';
  public static readonly CANONICAL_SEED = 42;

  private readonly config: FrontierBenchmarkHarnessConfig;
  private readonly scalingEngine: NativeParameterScalingEngine;
  private evalEngine!: NativeTrainingIntegrationEngine;
  private checkpointSha256: string = '';
  private stateHash: string = '';
  private isInitialized: boolean = false;

  constructor(config: FrontierBenchmarkHarnessConfig) {
    this.config = {
      evaluationSeed: FrontierBenchmarkHarness.CANONICAL_SEED,
      parameterConfig: SCALED_1M_CONFIG,
      ...config,
    };

    // Assert sovereign boundary at construction
    ExternalModelGuard.assertNativeOnly(CUBIO_NATIVE_MODEL_ID);
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('SECURITY VIOLATION: IS_ACTUATION_BLOCKED must be true in benchmark harness');
    }

    this.scalingEngine = new NativeParameterScalingEngine(this.config.evaluationSeed!);
  }

  /**
   * Initializes the harness by loading and verifying the production candidate checkpoint.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const absPath = path.resolve(this.config.checkpointPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Checkpoint file not found: ${absPath}`);
    }

    const ckptBuf = fs.readFileSync(absPath);
    this.checkpointSha256 = crypto.createHash('sha256').update(ckptBuf).digest('hex');

    if (this.config.expectedCheckpointSha256 && this.checkpointSha256 !== this.config.expectedCheckpointSha256) {
      throw new Error(
        `Checkpoint SHA-256 mismatch: expected ${this.config.expectedCheckpointSha256}, got ${this.checkpointSha256}`
      );
    }

    // Restore checkpoint into evaluation engine
    this.evalEngine = this.scalingEngine.createEngineForTier(
      this.config.parameterConfig || SCALED_1M_CONFIG,
      this.config.evaluationSeed!
    );

    const restoreRes = this.evalEngine.restoreCheckpoint(absPath, 'root');
    if (!restoreRes.restored) {
      throw new Error(`Failed to restore checkpoint: ${absPath}`);
    }

    this.stateHash = this.evalEngine.getModel().computeWeightsHash();

    if (this.config.expectedStateHash && this.stateHash !== this.config.expectedStateHash) {
      throw new Error(
        `Restored state hash mismatch: expected ${this.config.expectedStateHash}, got ${this.stateHash}`
      );
    }

    this.isInitialized = true;
  }

  public getCheckpointSha256(): string {
    return this.checkpointSha256;
  }

  public getStateHash(): string {
    return this.stateHash;
  }

  public getEvalEngine(): NativeTrainingIntegrationEngine {
    if (!this.isInitialized) throw new Error('Harness must be initialized first');
    return this.evalEngine;
  }

  /**
   * Executes the standardized benchmark protocol over an entire benchmark suite.
   */
  public async executeSuite(suite: FrontierBenchmarkSuite): Promise<FrontierBenchmarkExecutionReport> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Sovereign actuation assertion
    ExternalModelGuard.assertNativeOnly(CUBIO_NATIVE_MODEL_ID);
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('SECURITY VIOLATION: Actuation lock violated during suite execution');
    }

    const tStart = performance.now();
    const initialHeapMb = process.memoryUsage().heapUsed / (1024 * 1024);

    // Compute dataset SHA-256
    const datasetSha256 = crypto.createHash('sha256').update(JSON.stringify(suite.samples)).digest('hex');

    const sampleLatencies: number[] = [];
    const sampleEvidence: SampleEvaluationEvidence[] = [];
    const failureEvidence: FailureEvidenceRecord[] = [];

    let totalLossSum = 0;
    let totalTokenLossSum = 0;
    let totalEpistemicLossSum = 0;
    let spatialCorrectCount = 0;
    let passedCount = 0;
    let totalTokens = 0;

    for (const sample of suite.samples) {
      const sStart = performance.now();
      try {
        // Validate spatial coordinates bounds [0, 342]
        if (sample.cellId < 0 || sample.cellId >= 343) {
          throw new Error(`Spatial cellId out of bounds [0, 342]: ${sample.cellId}`);
        }

        // Validate Formula A: address = 26 + cellId
        const expectedAddress = 26 + sample.cellId;
        const actualAddress = cellIdToAddress369(sample.cellId);
        const spatialGroundingValid = (actualAddress === expectedAddress) && (sample.address369 === expectedAddress);

        if (spatialGroundingValid) {
          spatialCorrectCount++;
        }

        // Forward evaluation pass
        const evalResult = this.evalEngine.evaluateSample(sample);
        const sLatency = performance.now() - sStart;
        sampleLatencies.push(sLatency);

        const totalLoss = evalResult.totalLoss;
        const tokenLoss = evalResult.tokenLoss;
        const epistemicLoss = evalResult.epistemicLoss;

        if (!Number.isFinite(totalLoss) || Number.isFinite(tokenLoss) === false) {
          throw new Error(`Non-finite numerical loss detected on sample ${sample.sampleId}: total=${totalLoss}, token=${tokenLoss}`);
        }

        totalLossSum += totalLoss;
        totalTokenLossSum += tokenLoss;
        totalEpistemicLossSum += epistemicLoss;

        // Estimate tokens
        const sampleTokens = (sample.prompt.split(/\s+/).length + sample.completion.split(/\s+/).length) * 2;
        totalTokens += sampleTokens;

        passedCount++;

        sampleEvidence.push({
          sampleId: sample.sampleId,
          domain: sample.domain,
          promptLength: sample.prompt.length,
          completionLength: sample.completion.length,
          cellId: sample.cellId,
          address369: sample.address369,
          spatialGroundingValid,
          totalLoss,
          tokenLoss,
          epistemicLoss,
          latencyMs: parseFloat(sLatency.toFixed(3)),
          passed: true,
        });
      } catch (err: any) {
        const sLatency = performance.now() - sStart;
        sampleLatencies.push(sLatency);

        const failureRecord: FailureEvidenceRecord = {
          sampleId: sample.sampleId,
          domain: sample.domain,
          errorType: err.name || 'BenchmarkExecutionError',
          errorMessage: err.message || 'Unknown benchmark execution error',
          stackTrace: err.stack,
          timestamp: new Date().toISOString(),
          diagnosticContext: { cellId: sample.cellId, address369: sample.address369 },
        };
        failureEvidence.push(failureRecord);

        sampleEvidence.push({
          sampleId: sample.sampleId,
          domain: sample.domain,
          promptLength: sample.prompt.length,
          completionLength: sample.completion.length,
          cellId: sample.cellId,
          address369: sample.address369,
          spatialGroundingValid: false,
          totalLoss: 999.0,
          tokenLoss: 999.0,
          epistemicLoss: 999.0,
          latencyMs: parseFloat(sLatency.toFixed(3)),
          passed: false,
          failureReason: err.message,
        });
      }
    }

    const tEnd = performance.now();
    const totalDurationMs = tEnd - tStart;
    const finalHeapMb = process.memoryUsage().heapUsed / (1024 * 1024);

    // Latency Percentiles
    const sortedLatencies = [...sampleLatencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const minLat = sortedLatencies[0] || 0;
    const maxLat = sortedLatencies[sortedLatencies.length - 1] || 0;
    const avgLat = sortedLatencies.length > 0 ? totalDurationMs / sortedLatencies.length : 0;
    const throughput = totalDurationMs > 0 ? (totalTokens / (totalDurationMs / 1000)) : 0;

    const n = suite.samples.length;
    const passRatePercent = n > 0 ? (passedCount / n) * 100 : 0;
    const avgLoss = passedCount > 0 ? totalLossSum / passedCount : 999;
    const avgTokenLoss = passedCount > 0 ? totalTokenLossSum / passedCount : 999;
    const avgEpistemicLoss = passedCount > 0 ? totalEpistemicLossSum / passedCount : 999;
    const spatialAccuracyPercent = n > 0 ? (spatialCorrectCount / n) * 100 : 0;

    const passFailDecision = (failureEvidence.length === 0 && passRatePercent === 100 && spatialAccuracyPercent === 100)
      ? 'PASS'
      : 'FAIL';

    return {
      harnessTitle: 'CUBiO AI Unified Native Frontier Benchmark Harness',
      harnessVersion: FrontierBenchmarkHarness.HARNESS_VERSION,
      phase: 'PHASE_17_FRONTIER_BENCHMARK',
      suiteId: suite.suiteId,
      suiteName: suite.suiteName,
      executedAt: new Date().toISOString(),
      executionDurationSec: parseFloat((totalDurationMs / 1000).toFixed(3)),
      modelMetadata: {
        tierId: SCALED_1M_CONFIG.tierId,
        parameterCount: SCALED_1M_CONFIG.parameters,
        tensorCount: SCALED_1M_CONFIG.tensors,
        checkpointPath: this.config.checkpointPath,
        checkpointSha256: this.checkpointSha256,
        stateHash: this.stateHash,
      },
      datasetMetadata: {
        suiteId: suite.suiteId,
        sampleCount: suite.samples.length,
        datasetSha256,
      },
      seedSchedule: {
        evaluationSeed: this.config.evaluationSeed!,
      },
      runtimeEnvironment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        actuationBlocked: IS_ACTUATION_BLOCKED,
      },
      latencyProfile: {
        totalDurationMs: parseFloat(totalDurationMs.toFixed(2)),
        sampleCount: n,
        avgLatencyMs: parseFloat(avgLat.toFixed(2)),
        p50LatencyMs: parseFloat(p50.toFixed(2)),
        p95LatencyMs: parseFloat(p95.toFixed(2)),
        minLatencyMs: parseFloat(minLat.toFixed(2)),
        maxLatencyMs: parseFloat(maxLat.toFixed(2)),
        throughputTokensPerSec: parseFloat(throughput.toFixed(1)),
      },
      memoryProfile: {
        initialHeapUsedMb: parseFloat(initialHeapMb.toFixed(2)),
        finalHeapUsedMb: parseFloat(finalHeapMb.toFixed(2)),
        heapDeltaMb: parseFloat((finalHeapMb - initialHeapMb).toFixed(2)),
        fp32WeightBytes: SCALED_1M_CONFIG.fp32WeightBytes,
      },
      scoreSummary: {
        totalSamples: n,
        passedSamples: passedCount,
        failedSamples: failureEvidence.length,
        passRatePercent: parseFloat(passRatePercent.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(6)),
        avgTokenLoss: parseFloat(avgTokenLoss.toFixed(6)),
        avgEpistemicLoss: parseFloat(avgEpistemicLoss.toFixed(6)),
        spatialAccuracyPercent: parseFloat(spatialAccuracyPercent.toFixed(2)),
        totalTokensEvaluated: totalTokens,
      },
      sampleEvidence,
      failureEvidence,
      passFailDecision,
    };
  }
}
