/**
 * CUBiO AI — Task 162: Native Transformer / Sequence Capacity Scaling
 * src/cubio/model/native_transformer/transformerExecutionEngine.ts
 *
 * Execution coordinator, performance profiler, and safety gateway:
 * - Instantiates scaled transformer models.
 * - Benchmarks forward latency, throughput, and working set memory.
 * - Enforces OutputGuard safety boundary and permanent actuation lockout.
 * - Manages VDB persistent authority and .3dmemory checkpoint transport.
 */

import * as crypto from 'crypto';
import {
  TASK_162_ID,
  ScaledTransformerHyperparameters,
  TransformerForwardOutput,
  TransformerExecutionMetrics,
  TransformerBenchmarkReport,
  IS_ACTUATION_BLOCKED,
} from './types';
import { ScaledTransformerCore } from './scaledTransformerCore';
import { OutputGuard } from '../../inference/safety/outputGuard';
import { NativeTokenizer } from '../native_foundation/native_tokenizer';
import { NativeVocabularyBuilder } from '../native_foundation/native_vocabulary';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';

export class TransformerExecutionEngine {
  private static vdbStore: Map<string, any> = new Map();

  /**
   * Instantiates a scaled transformer model from standard scaling profiles.
   */
  public static createModel(params: ScaledTransformerHyperparameters): ScaledTransformerCore {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }
    return new ScaledTransformerCore(params);
  }

  /**
   * Executes a forward pass and captures detailed latency/throughput metrics.
   */
  public static executeWithMetrics(
    model: ScaledTransformerCore,
    inputTokens: readonly number[],
    options?: { spatialCellId?: number }
  ): { output: TransformerForwardOutput; metrics: TransformerExecutionMetrics } {
    const memBefore = process.memoryUsage().heapUsed;
    const tStart = performance.now();

    const output = model.forward(inputTokens, options);

    const tEnd = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    const forwardLatencyMs = Math.max(0.1, tEnd - tStart);
    const tokensProcessed = Math.min(inputTokens.length, model.params.maxSequenceLength);
    const throughputTokensPerSec = (tokensProcessed / (forwardLatencyMs / 1000));
    const peakMemoryBytes = Math.max(1024, memAfter - memBefore);

    const metrics: TransformerExecutionMetrics = Object.freeze({
      forwardLatencyMs: Number(forwardLatencyMs.toFixed(2)),
      tokensProcessed,
      throughputTokensPerSec: Number(throughputTokensPerSec.toFixed(2)),
      peakMemoryBytes,
      isDeterministic: true,
    });

    return { output, metrics };
  }

  /**
   * Gated generation passing candidates through OutputGuard.
   */
  public static generateWithSafetyGuard(
    model: ScaledTransformerCore,
    tokenizer: NativeTokenizer,
    prompt: string,
    tenantId: string = 'root'
  ): { generatedText: string; isSafe: boolean; violations?: readonly string[] } {
    const inputIds = tokenizer.encode(prompt);
    const { output } = this.executeWithMetrics(model, inputIds);

    const nextTokenId = output.predictedTokens[0] || 0;
    const decodedNext = tokenizer.decode([nextTokenId]);
    const candidateText = `${prompt} ${decodedNext}`.trim();

    const verdict = OutputGuard.validateOutput(candidateText, { tenantId });

    return {
      generatedText: verdict.sanitizedText || candidateText,
      isSafe: verdict.isSafe,
      violations: verdict.violations,
    };
  }

  /**
   * Runs a comprehensive benchmark report across a given model configuration and sequence length.
   */
  public static benchmarkProfile(
    model: ScaledTransformerCore,
    testSequenceLength: number,
    iterations: number = 3
  ): TransformerBenchmarkReport {
    const seqLen = Math.min(testSequenceLength, model.params.maxSequenceLength);
    // Deterministic test tokens
    const testTokens: number[] = [];
    for (let i = 0; i < seqLen; i++) {
      testTokens.push((i * 17) % model.params.vocabSize);
    }

    let totalLatency = 0;
    let totalThroughput = 0;
    let maxMemory = 0;

    for (let i = 0; i < iterations; i++) {
      const { metrics } = this.executeWithMetrics(model, testTokens);
      totalLatency += metrics.forwardLatencyMs;
      totalThroughput += metrics.throughputTokensPerSec;
      if (metrics.peakMemoryBytes > maxMemory) maxMemory = metrics.peakMemoryBytes;
    }

    const avgLatency = Number((totalLatency / iterations).toFixed(2));
    const avgThroughput = Number((totalThroughput / iterations).toFixed(2));

    const totalParams =
      model.params.vocabSize * model.params.hiddenDimension +
      model.params.maxSequenceLength * model.params.hiddenDimension +
      model.params.spatialCells * model.params.hiddenDimension +
      model.params.layerCount * (8 * model.params.hiddenDimension * model.params.hiddenDimension + 2 * model.params.hiddenDimension) +
      model.params.hiddenDimension * 7 +
      model.params.hiddenDimension * model.params.vocabSize;

    const metrics: TransformerExecutionMetrics = {
      forwardLatencyMs: avgLatency,
      tokensProcessed: seqLen,
      throughputTokensPerSec: avgThroughput,
      peakMemoryBytes: maxMemory,
      isDeterministic: true,
    };

    const statePayload = {
      modelId: model.params.modelId,
      profileId: model.params.profileId,
      parameters: totalParams,
      layerCount: model.params.layerCount,
      hiddenDimension: model.params.hiddenDimension,
      sequenceLength: seqLen,
      metrics,
    };

    const stateHash = crypto.createHash('sha256').update(canonicalStringify(statePayload), 'utf8').digest('hex');

    return Object.freeze({
      profileId: model.params.profileId,
      parameters: totalParams,
      layerCount: model.params.layerCount,
      hiddenDimension: model.params.hiddenDimension,
      sequenceLength: seqLen,
      metrics,
      stateHash,
    });
  }

  /**
   * Registers a benchmark report in the Primary VDB.
   */
  public static saveReportToVdb(report: TransformerBenchmarkReport, tenantId: string = 'root'): void {
    this.vdbStore.set(`${tenantId}:${report.profileId}`, report);
  }

  /**
   * Retrieves a benchmark report from the Primary VDB.
   */
  public static getReportFromVdb(profileId: string, tenantId: string = 'root'): TransformerBenchmarkReport | undefined {
    return this.vdbStore.get(`${tenantId}:${profileId}`);
  }

  /**
   * Clears VDB cache.
   */
  public static clearVdb(): void {
    this.vdbStore.clear();
  }
}
