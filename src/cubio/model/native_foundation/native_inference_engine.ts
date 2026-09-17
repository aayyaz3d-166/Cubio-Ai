/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_inference_engine.ts
 *
 * Sovereign Native Model Inference Engine.
 * Features:
 * - Direct execution on CubiONativeModel weights (zero external dependencies)
 * - Autoregressive greedy and Top-K sampling with temperature
 * - 7-Tier Epistemic projection & non-fact assertion lockout
 * - Latency & local execution telemetry
 * - Fail-closed on actuation or external model calls
 */

import {
  EpistemicStatus,
  NativeInferenceOptions,
  NativeInferenceOutput,
  CUBIO_NATIVE_MODEL_ID,
} from './native_model_types';
import { CubiONativeModel, ModelForwardOutput } from './native_model_architecture';
import { NativeTokenizer } from './native_tokenizer';
import { ExternalModelGuard } from './external_model_guard';

export class FactLockoutViolationError extends Error {
  constructor(message: string) {
    super(`[NON_FACT_LOCKOUT_VIOLATION] ${message}`);
    this.name = 'FactLockoutViolationError';
  }
}

export class NativeInferenceEngine {
  private readonly model: CubiONativeModel;
  private readonly tokenizer: NativeTokenizer;

  constructor(model: CubiONativeModel, tokenizer?: NativeTokenizer) {
    ExternalModelGuard.assertNativeOnly(model.modelId);
    this.model = model;
    this.tokenizer = tokenizer ?? new NativeTokenizer();
  }

  public getModel(): CubiONativeModel {
    return this.model;
  }

  public getTokenizer(): NativeTokenizer {
    return this.tokenizer;
  }

  /**
   * Generates completion text given an input prompt
   */
  public generate(
    prompt: string,
    options: NativeInferenceOptions = {},
    spatialCellId?: number
  ): NativeInferenceOutput {
    const startTime = Date.now();

    // Guard: Fail-closed on external model calls and actuation
    ExternalModelGuard.assertNativeOnly(prompt);
    ExternalModelGuard.assertActuationBlocked(prompt);

    const maxTokens = options.maxTokens ?? 32;
    const temperature = Math.max(0.01, options.temperature ?? 0.7);
    const topK = Math.max(1, options.topK ?? 40);
    const enforceLockout = options.enforceEpistemicLockout ?? true;

    // Tokenize prompt
    const initialTokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const generatedTokens: number[] = [...initialTokens];
    const eosTokenId = this.tokenizer.getSpecialTokenId('EOS');
    const maxSeqLen = this.model.config.maxSeqLen;

    let forwardResult: ModelForwardOutput | null = null;

    for (let step = 0; step < maxTokens; step++) {
      if (generatedTokens.length >= maxSeqLen) break;

      forwardResult = this.model.forward(generatedTokens, { spatialCellId });
      const lastIndex = forwardResult.logits.length - 1;
      const lastLogits = forwardResult.logits[lastIndex];

      // Sample next token using temperature + top-k or greedy
      const nextToken = this.sampleToken(lastLogits, temperature, topK);

      if (nextToken === eosTokenId) {
        break;
      }
      generatedTokens.push(nextToken);
    }

    // Final forward pass for epistemic assessment
    const finalOut = this.model.forward(generatedTokens, { spatialCellId });
    let dominantEpistemic = finalOut.dominantEpistemicStatus;

    // Decode generated tokens only (skip initial prompt tokens)
    const newTokens = generatedTokens.slice(initialTokens.length);
    const decodedText = this.tokenizer.decode(newTokens, { skipSpecialTokens: true });

    // Non-Fact Lockout:
    // If prompt or model output is predictive or hypothetical,
    // it can never assert FACT status.
    if (enforceLockout) {
      const lowerPrompt = prompt.toLowerCase();
      const isPredictiveIntent =
        lowerPrompt.includes('predict') ||
        lowerPrompt.includes('forecast') ||
        lowerPrompt.includes('tomorrow') ||
        lowerPrompt.includes('lottery') ||
        lowerPrompt.includes('might') ||
        lowerPrompt.includes('hypothesis') ||
        lowerPrompt.includes('perhaps');

      if (isPredictiveIntent && dominantEpistemic === EpistemicStatus.FACT) {
        dominantEpistemic = EpistemicStatus.PREDICTION;
      }

      if (
        dominantEpistemic === EpistemicStatus.PREDICTION ||
        dominantEpistemic === EpistemicStatus.HYPOTHESIS ||
        dominantEpistemic === EpistemicStatus.UNKNOWN
      ) {
        if (dominantEpistemic === EpistemicStatus.FACT) {
          dominantEpistemic = EpistemicStatus.PREDICTION;
        }
      }
    }

    const latencyMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      text: decodedText,
      tokenIds: Object.freeze(newTokens),
      epistemicStatus: dominantEpistemic,
      spatialCellRef: spatialCellId,
      latencyMs,
      verifiedLocalNative: true,
      externalModelCalls: 0,
    });
  }

  /**
   * Evaluates prompt epistemic classification without generating full completion
   */
  public classifyEpistemic(prompt: string, spatialCellId?: number): {
    dominantStatus: EpistemicStatus;
    scores: Record<EpistemicStatus, number>;
    isFactAssertionLocked: boolean;
  } {
    ExternalModelGuard.assertNativeOnly(prompt);
    const tokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const forwardOut = this.model.forward(tokens, { spatialCellId });

    return {
      dominantStatus: forwardOut.dominantEpistemicStatus,
      scores: forwardOut.epistemicScores,
      isFactAssertionLocked: forwardOut.isFactAssertionLocked,
    };
  }

  /**
   * Autoregressive token sampling with Top-K and temperature scaling
   */
  private sampleToken(logits: readonly number[], temperature: number, topK: number): number {
    const vocabSize = logits.length;

    // Apply temperature scaling
    const scaledLogits = logits.map((l) => l / temperature);

    // Get top-K indices
    const indexed = scaledLogits.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);
    const topIndices = indexed.slice(0, Math.min(topK, vocabSize));

    // Softmax over top-K
    const maxVal = topIndices[0].val;
    let sumExp = 0;
    const probs = topIndices.map((item) => {
      const p = Math.exp(item.val - maxVal);
      sumExp += p;
      return p;
    });

    if (sumExp === 0) {
      return topIndices[0].idx;
    }

    // Roulette wheel selection
    const r = Math.random() * sumExp;
    let accum = 0;
    for (let i = 0; i < topIndices.length; i++) {
      accum += probs[i];
      if (r <= accum) {
        return topIndices[i].idx;
      }
    }

    return topIndices[0].idx;
  }
}
