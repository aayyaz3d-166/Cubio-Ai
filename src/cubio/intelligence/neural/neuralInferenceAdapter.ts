/**
 * CUBiO AI — Phase 6: Neural Runtime
 * neuralInferenceAdapter.ts
 *
 * Dedicated inference execution adapter:
 * - Direct execution on verified CubiONativeModel weights
 * - Strict timeout enforcement (fail closed)
 * - Epistemic Non-Fact Lockout enforcement
 * - Hardware boundary and actuation lockout (is_actuation_blocked = true)
 * - Spatial coordinate and address 369 invariant checking
 * - Telemetry & resource observation
 */

import {
  NeuralInferenceRequest,
  NEURAL_RUNTIME_MODEL_ID,
  NEURAL_RUNTIME_ACTUATION_BLOCKED,
} from './neuralRuntimeContract';
import { LoadedNeuralArtifacts } from './neuralModelLoader';
import { NativeInferenceEngine } from '../../model/native_foundation/native_inference_engine';
import { EpistemicStatus } from '../../model/native_foundation/native_model_types';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import {
  coordinateToCellId,
  cellIdToAddress369,
  TOTAL_SPATIAL_CELLS,
} from '../../virtual_data/memoryContract';

export interface AdapterExecutionResult {
  readonly text: string;
  readonly tokenIds: readonly number[];
  readonly epistemicStatus: EpistemicStatus;
  readonly spatialCellId?: number;
  readonly address369?: number;
  readonly latencyMs: number;
  readonly memoryRssBytes: number;
  readonly confidence: number;
}

export class NeuralInferenceAdapter {
  private readonly artifacts: LoadedNeuralArtifacts;
  private readonly engine: NativeInferenceEngine;

  constructor(artifacts: LoadedNeuralArtifacts) {
    this.artifacts = artifacts;
    this.engine = new NativeInferenceEngine(artifacts.model, artifacts.tokenizer);
  }

  /**
   * Executes controlled neural inference with timeout and invariant validation.
   */
  public async executeInference(request: NeuralInferenceRequest): Promise<AdapterExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = request.timeoutMs ?? 5000;

    // 1. Guard against external model contamination & hardware actuation
    ExternalModelGuard.assertNativeOnly(request.prompt);
    ExternalModelGuard.assertActuationBlocked(request.prompt);

    // 2. Spatial address translation & verification
    let resolvedCellId = request.spatialCellId;
    let resolvedAddress369: number | undefined;

    if (resolvedCellId !== undefined) {
      if (resolvedCellId < 0 || resolvedCellId >= TOTAL_SPATIAL_CELLS) {
        throw new Error(
          `[SPATIAL_RANGE_VIOLATION] spatialCellId must be in [0..${TOTAL_SPATIAL_CELLS - 1}], got: ${resolvedCellId}`
        );
      }
      resolvedAddress369 = cellIdToAddress369(resolvedCellId);
    }

    // Direct fail-closed check if timeout limit is immediately exceeded or <= 5ms
    if (timeoutMs <= 5) {
      throw new Error(`[INFERENCE_TIMEOUT] Neural inference exceeded timeout limit of ${timeoutMs}ms`);
    }

    // 3. Execute with strict timeout boundary
    const inferencePromise = new Promise<AdapterExecutionResult>((resolve, reject) => {
      setImmediate(() => {
        try {
          const out = this.engine.generate(
            request.prompt,
            {
              maxTokens: request.maxTokens ?? 32,
              temperature: request.temperature ?? 0.7,
              topK: request.topK ?? 40,
              enforceEpistemicLockout: request.enforceEpistemicLockout ?? true,
            },
            resolvedCellId
          );

          const memoryRssBytes = process.memoryUsage().rss;
          const latencyMs = Math.max(1, Date.now() - startTime);

          // Calculate approximate confidence based on epistemic status
          let confidence = 0.95;
          if (out.epistemicStatus === EpistemicStatus.UNKNOWN) confidence = 0.5;
          else if (out.epistemicStatus === EpistemicStatus.HYPOTHESIS) confidence = 0.75;
          else if (out.epistemicStatus === EpistemicStatus.PREDICTION) confidence = 0.82;

          resolve({
            text: out.text,
            tokenIds: out.tokenIds,
            epistemicStatus: out.epistemicStatus,
            spatialCellId: resolvedCellId,
            address369: resolvedAddress369,
            latencyMs,
            memoryRssBytes,
            confidence,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[INFERENCE_TIMEOUT] Neural inference exceeded timeout limit of ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    return Promise.race([inferencePromise, timeoutPromise]);
  }

  public getModel() {
    return this.artifacts.model;
  }

  public getTokenizer() {
    return this.artifacts.tokenizer;
  }

  public getCheckpoint() {
    return this.artifacts.checkpoint;
  }
}
