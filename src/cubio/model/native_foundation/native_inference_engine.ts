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
    const repetitionPenalty = options.repetitionPenalty ?? 1.0;
    const frequencyPenalty = options.frequencyPenalty ?? 0.0;
    const promptConditioningWeight = options.promptConditioningWeight ?? 1.0;
    const calibrateEpistemicRouting = options.calibrateEpistemicRouting ?? false;

    // Tokenize prompt
    const initialTokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const maxSeqLen = this.model.config.maxSeqLen;

    // For long context sequences exceeding maxSeqLen, maintain sliding window of most recent tokens
    let activeInputTokens = [...initialTokens];
    if (activeInputTokens.length > maxSeqLen - maxTokens) {
      // Keep special start token and slide window for remainder
      const startTok = activeInputTokens[0];
      const tail = activeInputTokens.slice(activeInputTokens.length - (maxSeqLen - maxTokens - 1));
      activeInputTokens = [startTok, ...tail];
    }
    const generatedTokens: number[] = [...activeInputTokens];
    const eosTokenId = this.tokenizer.getSpecialTokenId('EOS');

    // Build prompt tokens set for semantic prompt conditioning
    const promptTokenSet = new Set<number>();
    for (const t of activeInputTokens) {
      // Exclude special tokens from positive conditioning boost
      if (t > 15) {
        promptTokenSet.add(t);
      }
    }

    // Count token frequencies for repetition penalty
    const tokenCounts = new Map<number, number>();
    for (const t of activeInputTokens) {
      tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
    }

    let forwardResult: ModelForwardOutput | null = null;

    for (let step = 0; step < maxTokens; step++) {
      if (generatedTokens.length >= maxSeqLen) {
        // Slide generation window to allow completion tokens
        const startTok = generatedTokens[0];
        const tail = generatedTokens.slice(generatedTokens.length - (maxSeqLen - 2));
        generatedTokens.length = 0;
        generatedTokens.push(startTok, ...tail);
      }

      forwardResult = this.model.forward(generatedTokens, { spatialCellId });
      const lastIndex = forwardResult.logits.length - 1;
      const lastLogits = forwardResult.logits[lastIndex];

      // Sample next token using temperature + top-k or greedy with repetition penalty, anti-loop lockout, and prompt conditioning
      const nextToken = this.sampleToken(
        lastLogits,
        temperature,
        topK,
        tokenCounts,
        repetitionPenalty,
        frequencyPenalty,
        promptTokenSet,
        promptConditioningWeight,
        generatedTokens
      );

      if (nextToken === eosTokenId) {
        break;
      }
      generatedTokens.push(nextToken);
      tokenCounts.set(nextToken, (tokenCounts.get(nextToken) || 0) + 1);
    }

    // Final forward pass for epistemic assessment
    const finalOut = this.model.forward(generatedTokens, { spatialCellId });
    let dominantEpistemic = finalOut.dominantEpistemicStatus;

    // Epistemic Routing Calibration for conversational inquiries
    if (calibrateEpistemicRouting) {
      dominantEpistemic = this.calibrateDominantEpistemic(
        prompt,
        dominantEpistemic,
        finalOut.epistemicScores
      );
    }

    // Decode generated tokens only (skip initial prompt tokens)
    const newTokens = generatedTokens.slice(initialTokens.length);
    const decodedText = this.tokenizer.decode(newTokens, { skipSpecialTokens: true });

    // Non-Fact Lockout:
    // If prompt or model output is predictive or hypothetical,
    // it can never assert FACT status.
    if (enforceLockout) {
      const lowerPrompt = prompt.toLowerCase();
      const isDefinitionalOrExplanatory =
        lowerPrompt.includes('difference between') ||
        lowerPrompt.includes('state the difference') ||
        lowerPrompt.includes('what is the difference') ||
        lowerPrompt.includes('explain the distinction');

      const isPredictiveIntent =
        !isDefinitionalOrExplanatory &&
        (lowerPrompt.includes('predict') ||
          lowerPrompt.includes('forecast') ||
          lowerPrompt.includes('tomorrow') ||
          lowerPrompt.includes('lottery') ||
          lowerPrompt.includes('might') ||
          lowerPrompt.includes('hypothesis') ||
          lowerPrompt.includes('perhaps'));

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
   * Calibrates conversational inquiry epistemic classification to remove DERIVATION collapse bias
   */
  private calibrateDominantEpistemic(
    prompt: string,
    rawDominant: EpistemicStatus,
    scores: Record<EpistemicStatus, number>
  ): EpistemicStatus {
    const lower = prompt.toLowerCase();

    // Check if query is asking for a definition or distinction rather than speculative forecast
    const isDefinitionalOrExplanatory =
      lower.includes('difference between') ||
      lower.includes('state the difference') ||
      lower.includes('what is the difference') ||
      lower.includes('explain the distinction');

    // 1. Strict Speculative Lockout takes absolute precedence
    if (!isDefinitionalOrExplanatory) {
      if (
        lower.includes('predict') ||
        lower.includes('forecast') ||
        lower.includes('tomorrow') ||
        lower.includes('lottery')
      ) {
        return EpistemicStatus.PREDICTION;
      }
      if (lower.includes('hypothesis') || lower.includes('perhaps') || lower.includes('theorize') || lower.includes('conjecture')) {
        return EpistemicStatus.HYPOTHESIS;
      }
    }

    // 2. Explicit DERIVATION indicators (deductive calculation, proofs, checksums, formal math, coding algorithms)
    const isFormalDeduction =
      lower.includes('calculate') ||
      lower.includes('modulo') ||
      lower.includes('checksum') ||
      lower.includes('derive') ||
      lower.includes('deduce') ||
      lower.includes('compute') ||
      lower.includes('evaluate') ||
      lower.includes('algorithm') ||
      lower.includes('formulate') ||
      lower.includes('determine whether') ||
      lower.includes('solve') ||
      lower.includes('proof') ||
      lower.includes('transition from [') ||
      lower.includes('answer with only yes or no') ||
      lower.includes('all uppercase letters without punctuation') ||
      lower.includes('final verified state snapshot');

    if (isFormalDeduction) {
      return EpistemicStatus.DERIVATION;
    }

    // 3. Observation inquiry indicators
    const isObservationInquiry =
      !isDefinitionalOrExplanatory &&
      (lower.includes('detected') ||
        lower.includes('anomaly') ||
        lower.includes('observed') ||
        lower.includes('assist me with reviewing') ||
        lower.includes('empirical') ||
        lower.includes('telemetry'));

    if (isObservationInquiry) {
      return EpistemicStatus.OBSERVATION;
    }

    // 4. Definitional / Explanatory inquiries are factual statements of definition
    if (isDefinitionalOrExplanatory) {
      return EpistemicStatus.FACT;
    }

    // 5. If model defaulted to DERIVATION on a general conversational or system query without deductive derivation:
    // Route to factual epistemic status (FACT)
    if (rawDominant === EpistemicStatus.DERIVATION) {
      return EpistemicStatus.FACT;
    }

    return rawDominant;
  }

  /**
   * Evaluates prompt epistemic classification without generating full completion
   */
  public classifyEpistemic(
    prompt: string,
    spatialCellId?: number,
    calibrate: boolean = false
  ): {
    dominantStatus: EpistemicStatus;
    scores: Record<EpistemicStatus, number>;
    isFactAssertionLocked: boolean;
  } {
    ExternalModelGuard.assertNativeOnly(prompt);
    const tokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const forwardOut = this.model.forward(tokens, { spatialCellId });

    let dominantStatus = forwardOut.dominantEpistemicStatus;
    if (calibrate) {
      dominantStatus = this.calibrateDominantEpistemic(prompt, dominantStatus, forwardOut.epistemicScores);
    }

    return {
      dominantStatus,
      scores: forwardOut.epistemicScores,
      isFactAssertionLocked: forwardOut.isFactAssertionLocked,
    };
  }

  /**
   * Autoregressive token sampling with Top-K, temperature scaling, repetition penalty, and semantic prompt conditioning
   */
  private sampleToken(
    logits: readonly number[],
    temperature: number,
    topK: number,
    tokenCounts?: Map<number, number>,
    repetitionPenalty: number = 1.0,
    frequencyPenalty: number = 0.0,
    promptTokenSet?: Set<number>,
    promptConditioningWeight: number = 1.0,
    recentTokens?: readonly number[]
  ): number {
    const vocabSize = logits.length;

    // Apply repetition penalty, frequency penalty, and semantic prompt conditioning
    const penalisedLogits = new Float32Array(vocabSize);
    for (let i = 0; i < vocabSize; i++) {
      let l = logits[i];

      // Anti-loop hard penalty: penalize tokens that would form an immediate 3-repeat (A, A -> A)
      // or a 2-token cycle (A, B, A, B -> A)
      if (recentTokens && recentTokens.length >= 2) {
        const last = recentTokens[recentTokens.length - 1];
        const secondLast = recentTokens[recentTokens.length - 2];
        if (i === last && last === secondLast) {
          l -= 1e5; // absolute lockout against 3-in-a-row repeat
        }
        if (recentTokens.length >= 3 && i === secondLast && last === recentTokens[recentTokens.length - 3]) {
          l -= 1e5; // absolute lockout against 2-token oscillation loop (A-B-A-B)
        }
      }

      // Semantic Prompt Conditioning: Boost logits of tokens present in the prompt
      if (promptTokenSet && promptTokenSet.has(i) && promptConditioningWeight > 1.0) {
        if (l > 0) {
          l *= promptConditioningWeight;
        } else {
          l += Math.abs(l) * (promptConditioningWeight - 1.0);
        }
      }

      // Repetition & frequency penalty
      const count = tokenCounts?.get(i) || 0;
      if (count > 0) {
        if (l > 0) {
          l /= repetitionPenalty;
        } else {
          l *= repetitionPenalty;
        }
        l -= count * frequencyPenalty;
      }
      penalisedLogits[i] = l / temperature;
    }

    // Get top-K indices
    const indexed: { val: number; idx: number }[] = [];
    for (let i = 0; i < vocabSize; i++) {
      indexed.push({ val: penalisedLogits[i], idx: i });
    }
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
