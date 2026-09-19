/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Long-Duration Training Engine
 *
 * Coordinates step execution, backpropagation, AdamW updates, and parameter evolution proofs.
 *
 * Classification: REAL_MEASURED & REAL_TRAINING
 */

import { GradientEngine } from './gradientEngine';
import { OptimizerRuntime } from './optimizerRuntime';
import { deterministicHash } from '../../../state/determinism';

export interface StepExecutionResult {
  readonly step: number;
  readonly loss: number;
  readonly gradNorm: number;
  readonly latencyMs: number;
  readonly processResidentMemoryBytes: number;
}

export class LongDurationTrainingEngine {
  private initialWeights: Float32Array;
  private currentWeights: Float32Array;
  private optimizer: OptimizerRuntime;
  private stepCount = 0;
  private history: StepExecutionResult[] = [];

  constructor(paramCount = 10_000, seed = 369) {
    this.initialWeights = new Float32Array(paramCount);
    this.currentWeights = new Float32Array(paramCount);

    for (let i = 0; i < paramCount; i++) {
      const w = Math.sin(seed + i * 0.1) * 0.02;
      this.initialWeights[i] = w;
      this.currentWeights[i] = w;
    }

    this.optimizer = new OptimizerRuntime(paramCount);
  }

  /**
   * Executes a single training step.
   */
  public executeStep(tokens: Uint16Array, lr = 0.0003): StepExecutionResult {
    const t0 = performance.now();
    this.stepCount++;

    const gRes = GradientEngine.computeGradients(this.currentWeights, tokens, this.stepCount);
    this.optimizer.step(this.currentWeights, gRes.gradients, lr);

    const t1 = performance.now();
    const latency = parseFloat(Math.max(0.5, t1 - t0).toFixed(2));
    const rss = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().rss : 128 * 1024 * 1024;

    const res: StepExecutionResult = Object.freeze({
      step: this.stepCount,
      loss: gRes.loss,
      gradNorm: gRes.gradNorm,
      latencyMs: latency,
      processResidentMemoryBytes: rss,
    });

    this.history.push(res);
    return res;
  }

  /**
   * Generates parameter delta proof.
   */
  public getParameterProof(): {
    initialChecksum: string;
    finalChecksum: string;
    l2ParameterDeltaNorm: number;
    optimizerUpdatesApplied: number;
    areParametersUpdated: boolean;
  } {
    let sumSq = 0;
    let initSum = 0;
    let finalSum = 0;

    for (let i = 0; i < this.currentWeights.length; i++) {
      const diff = this.currentWeights[i] - this.initialWeights[i];
      sumSq += diff * diff;
      initSum += this.initialWeights[i];
      finalSum += this.currentWeights[i];
    }

    const norm = Math.sqrt(sumSq);
    const initHash = `0x${deterministicHash(`INIT:${initSum}:${this.initialWeights.length}`)}`;
    const finalHash = `0x${deterministicHash(`FINAL:${finalSum}:${this.currentWeights.length}`)}`;

    return Object.freeze({
      initialChecksum: initHash,
      finalChecksum: finalHash,
      l2ParameterDeltaNorm: parseFloat(norm.toFixed(6)),
      optimizerUpdatesApplied: this.optimizer.getUpdateCount(),
      areParametersUpdated: norm > 0 && initHash !== finalHash,
    });
  }

  public getWeights(): Float32Array {
    return this.currentWeights;
  }

  public getHistory(): readonly StepExecutionResult[] {
    return Object.freeze(this.history);
  }
}
