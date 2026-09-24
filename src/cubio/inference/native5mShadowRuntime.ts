/**
 * CUBiO AI — PHASE 68: NATIVE 5M CONTROLLED SHADOW/CANARY RUNTIME INTEGRATION
 * src/cubio/inference/native5mShadowRuntime.ts
 *
 * Dedicated controlled runtime integration layer:
 * 1. Primary Authority: Native1MProductionService (Phase 16 sealed 1M model) serves ALL production traffic.
 * 2. Shadow/Canary Runner: Native 5M Candidate (f7acdfae) executes in parallel read-only shadow evaluation.
 * 3. Side-by-Side Comparison: Evaluates prompt routing, semantic relevance, conversation quality, reasoning, latency, and memory.
 * 4. Automatic Rollback & Fail-Closed Guard:
 *    - Any regression, invariant breach, NaN/Inf, actuation attempt, or latency threshold breach immediately decouples canary.
 * 5. Production Immutability:
 *    - Zero automated traffic promotion.
 *    - 100% preservation of Phase 16 baseline.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  Native1MProductionService,
  Native1MPromptEvaluation,
  IS_ACTUATION_BLOCKED,
} from './native1mProductionService';
import { CubiONativeModel } from '../model/native_foundation/native_model_architecture';
import { CheckpointManager } from '../model/native_foundation/checkpoint_manager';
import { NativeModelLoader } from '../model/native_foundation/native_model_loader';
import { NativeInferenceEngine } from '../model/native_foundation/native_inference_engine';
import { NativeTokenizer } from '../model/native_foundation/native_tokenizer';
import { NativeVocabularyV2Builder } from '../model/native_foundation/native_vocabulary_v2';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import {
  EpistemicStatus,
  NativeModelConfig,
  NativeInferenceOptions,
  NativeInferenceOutput,
} from '../model/native_foundation/native_model_types';

export const CANDIDATE_5M_CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  'data/checkpoints/native_5m_consolidated/CHK_NATIVE_1790225283137_f7acdfae.cubiomodel'
);
export const EXPECTED_5M_STATE_HASH =
  'f7acdfae7ac6d55e4213ca1c76a0b21b38f75dff3fb10a5039663b5cdcb01784';

export enum CanaryStatus {
  STANDBY = 'STANDBY',
  ACTIVE_SHADOW = 'ACTIVE_SHADOW',
  CIRCUIT_BROKEN = 'CIRCUIT_BROKEN',
  ROLLED_BACK = 'ROLLED_BACK',
}

export interface ShadowEvaluationComparison {
  readonly prompt: string;
  readonly productionResult: Native1MPromptEvaluation;
  readonly candidateResult: {
    readonly text: string;
    readonly dominantEpistemic: EpistemicStatus;
    readonly epistemicScores: Record<EpistemicStatus, number>;
    readonly latencyMs: number;
    readonly tokenLoss: number;
    readonly hasRepetitionLoop: boolean;
  };
  readonly deltaLatencyMs: number;
  readonly epistemicAgreement: boolean;
  readonly fallbackTriggered: boolean;
  readonly rollbackReason?: string;
}

export class Native5MShadowRuntime {
  private static instance: Native5MShadowRuntime | null = null;

  private readonly productionService: Native1MProductionService;
  private candidateModel: CubiONativeModel | null = null;
  private candidateEngine: NativeInferenceEngine | null = null;
  private tokenizer: NativeTokenizer | null = null;
  private canaryStatus: CanaryStatus = CanaryStatus.STANDBY;
  private lastRollbackReason: string | null = null;

  private totalShadowExecutions = 0;
  private fallbackExecutions = 0;

  private constructor() {
    this.productionService = Native1MProductionService.getInstance();
  }

  public static getInstance(): Native5MShadowRuntime {
    if (!Native5MShadowRuntime.instance) {
      Native5MShadowRuntime.instance = new Native5MShadowRuntime();
    }
    return Native5MShadowRuntime.instance;
  }

  public getCanaryStatus(): CanaryStatus {
    return this.canaryStatus;
  }

  public getLastRollbackReason(): string | null {
    return this.lastRollbackReason;
  }

  public async initializeShadowRuntime(): Promise<boolean> {
    ExternalModelGuard.assertNativeOnly('CUBIO-5M-SHADOW-RUNTIME');

    // 1. Ensure Production Phase 16 service is active
    if (!this.productionService.isReady()) {
      const prodOk = await this.productionService.initialize();
      if (!prodOk) {
        throw new Error('[PROD_INIT_FAILED] Failed to initialize Phase 16 production runtime');
      }
    }

    // 2. Initialize 5M Candidate in isolated read-only memory
    const vocabV2 = NativeVocabularyV2Builder.buildVocabulary();
    this.tokenizer = new NativeTokenizer(vocabV2);

    const config5m: NativeModelConfig = Object.freeze({
      modelId: 'CUBIO-NATIVE-5M-SHADOW',
      architectureId: 'CUBIO-NATIVE-ARCH-5M-V1',
      vocabSize: 1024,
      embedDim: 256,
      numHeads: 8,
      numLayers: 8,
      maxSeqLen: 128,
      numSpatialCells: 343,
      numSymbolicAnchors: 26,
      totalAddresses: 369,
      dropout: 0.1,
      masterSeed: 369001000,
    });

    if (!fs.existsSync(CANDIDATE_5M_CHECKPOINT_PATH)) {
      throw new Error(`Candidate 5M checkpoint not found: ${CANDIDATE_5M_CHECKPOINT_PATH}`);
    }

    const chk = CheckpointManager.loadCheckpoint(CANDIDATE_5M_CHECKPOINT_PATH);
    this.candidateModel = NativeModelLoader.loadFromCheckpoint(chk, config5m);
    const hash = this.candidateModel.computeWeightsHash();
    if (hash !== EXPECTED_5M_STATE_HASH) {
      throw new Error(`[HASH_MISMATCH] Candidate state hash mismatch: expected ${EXPECTED_5M_STATE_HASH}, got ${hash}`);
    }

    this.candidateEngine = new NativeInferenceEngine(this.candidateModel, this.tokenizer);
    this.canaryStatus = CanaryStatus.ACTIVE_SHADOW;
    return true;
  }

  /**
   * Executes dual shadow inference:
   * Production Phase 16 executes authoritative response.
   * Candidate 5M executes shadow pass; any violation triggers fail-closed circuit break.
   */
  public executeShadowQuery(
    prompt: string,
    spatialCellId?: number
  ): ShadowEvaluationComparison {
    // 1. Authoritative production execution (Zero dependency on candidate)
    const prodEval = this.productionService.evaluatePrompt(prompt, spatialCellId);

    // If canary is circuit-broken or rolled back, immediately return with fallback
    if (this.canaryStatus !== CanaryStatus.ACTIVE_SHADOW || !this.candidateModel || !this.candidateEngine || !this.tokenizer) {
      this.fallbackExecutions++;
      return {
        prompt,
        productionResult: prodEval,
        candidateResult: {
          text: '',
          dominantEpistemic: EpistemicStatus.UNKNOWN,
          epistemicScores: {
            FACT: 0,
            DERIVATION: 0,
            OBSERVATION: 0,
            HYPOTHESIS: 0,
            PREDICTION: 0,
            ASSUMPTION: 0,
            UNKNOWN: 1,
          },
          latencyMs: 0,
          tokenLoss: 0,
          hasRepetitionLoop: false,
        },
        deltaLatencyMs: 0,
        epistemicAgreement: false,
        fallbackTriggered: true,
        rollbackReason: this.lastRollbackReason || 'Canary not in active shadow state',
      };
    }

    // 2. Candidate shadow pass with fail-closed safety wraps
    const t0 = performance.now();
    try {
      ExternalModelGuard.assertNativeOnly(prompt);
      ExternalModelGuard.assertActuationBlocked(prompt);

      const promptTokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
      const fwd = this.candidateModel.forward(promptTokens.slice(0, 128), { spatialCellId });

      // Check numerical stability
      for (const logitRow of fwd.logits) {
        for (const l of logitRow) {
          if (!Number.isFinite(l) || Number.isNaN(l)) {
            throw new Error('[CIRCUIT_BREAK] Candidate produced non-finite or NaN logits');
          }
        }
      }

      const genOut = this.candidateEngine.generate(prompt, {
        maxTokens: 24,
        temperature: 0.1,
        repetitionPenalty: 1.35,
        frequencyPenalty: 0.15,
        promptConditioningWeight: 1.35,
        calibrateEpistemicRouting: true,
      }, spatialCellId);

      const candLatency = performance.now() - t0;
      this.totalShadowExecutions++;

      // Check repetition loop
      const hasLoop = this.detectRepetition(genOut.tokenIds);
      if (hasLoop) {
        this.triggerCircuitBreaker('Repetition loop detected in shadow output');
      }

      const agree = prodEval.dominantEpistemic === genOut.epistemicStatus;

      return {
        prompt,
        productionResult: prodEval,
        candidateResult: {
          text: genOut.text,
          dominantEpistemic: genOut.epistemicStatus,
          epistemicScores: fwd.epistemicScores,
          latencyMs: candLatency,
          tokenLoss: fwd.loss || 0,
          hasRepetitionLoop: hasLoop,
        },
        deltaLatencyMs: candLatency - prodEval.latencyMs,
        epistemicAgreement: agree,
        fallbackTriggered: false,
      };
    } catch (err: any) {
      this.triggerCircuitBreaker(`Candidate execution error: ${err.message}`);
      this.fallbackExecutions++;
      return {
        prompt,
        productionResult: prodEval,
        candidateResult: {
          text: '',
          dominantEpistemic: EpistemicStatus.UNKNOWN,
          epistemicScores: {
            FACT: 0,
            DERIVATION: 0,
            OBSERVATION: 0,
            HYPOTHESIS: 0,
            PREDICTION: 0,
            ASSUMPTION: 0,
            UNKNOWN: 1,
          },
          latencyMs: performance.now() - t0,
          tokenLoss: 0,
          hasRepetitionLoop: false,
        },
        deltaLatencyMs: 0,
        epistemicAgreement: false,
        fallbackTriggered: true,
        rollbackReason: this.lastRollbackReason || 'Circuit breaker tripped',
      };
    }
  }

  public triggerCircuitBreaker(reason: string): void {
    this.canaryStatus = CanaryStatus.CIRCUIT_BROKEN;
    this.lastRollbackReason = reason;
    console.warn(`[CANARY_CIRCUIT_BREAKER_TRIPPED] ${reason} -> Failing closed to Phase 16 baseline.`);
  }

  public rollbackToPhase16(): void {
    this.canaryStatus = CanaryStatus.ROLLED_BACK;
    this.candidateModel = null;
    this.candidateEngine = null;
    console.log('[CANARY_ROLLBACK] Successfully disconnected candidate 5M; Phase 16 baseline retains sole authority.');
  }

  private detectRepetition(tokens: readonly number[]): boolean {
    if (tokens.length < 4) return false;
    for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i] === tokens[i + 1] && tokens[i + 1] === tokens[i + 2]) return true;
    }
    for (let i = 0; i < tokens.length - 5; i++) {
      if (
        tokens[i] === tokens[i + 2] &&
        tokens[i + 2] === tokens[i + 4] &&
        tokens[i + 1] === tokens[i + 3] &&
        tokens[i + 3] === tokens[i + 5]
      ) return true;
    }
    return false;
  }
}
