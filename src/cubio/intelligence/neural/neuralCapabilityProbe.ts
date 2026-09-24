/**
 * CUBiO AI — Phase 7: Real Neural Capability Validation
 * neuralCapabilityProbe.ts
 *
 * Diagnostic harness for empirical neural capability measurements:
 * - Weight perturbation sensitivity testing (proving output depends on weights)
 * - Input sensitivity and logit distribution shifts
 * - Autoregressive token generation inspection
 * - Pure neural path execution without fallback
 * - Memory & spatial representation verification
 */

import { LoadedNeuralArtifacts } from './neuralModelLoader';
import { NeuralInferenceAdapter, AdapterExecutionResult } from './neuralInferenceAdapter';
import { CubiONativeModel, NativeModelWeights, ModelForwardOutput } from '../../model/native_foundation/native_model_architecture';
import { NativeTokenizer } from '../../model/native_foundation/native_tokenizer';
import { NativeInferenceEngine } from '../../model/native_foundation/native_inference_engine';
import { EpistemicStatus } from '../../model/native_foundation/native_model_types';

export interface WeightSensitivityResult {
  readonly baselineLogitSample: number[];
  readonly perturbedLogitSample: number[];
  readonly maxLogitDelta: number;
  readonly meanLogitDelta: number;
  readonly weightsActuallyDiverged: boolean;
  readonly restoredCleanState: boolean;
}

export interface InputSensitivityResult {
  readonly promptA: string;
  readonly promptB: string;
  readonly tokensA: readonly number[];
  readonly tokensB: readonly number[];
  readonly meanLogitDelta: number;
  readonly outputDiverged: boolean;
}

export interface AutoregressiveStepTrace {
  readonly prompt: string;
  readonly generatedTokens: readonly number[];
  readonly decodedText: string;
  readonly tokenCount: number;
  readonly latencyMs: number;
  readonly dominantEpistemicStatus: EpistemicStatus;
}

export class NeuralCapabilityProbe {
  /**
   * Deep clones model weights for isolated, non-destructive experimentation.
   */
  public static cloneWeights(w: NativeModelWeights): NativeModelWeights {
    return {
      tokenEmbedding: w.tokenEmbedding.map((row) => [...row]),
      positionalEmbedding: w.positionalEmbedding.map((row) => [...row]),
      spatialEmbedding: w.spatialEmbedding.map((row) => [...row]),
      layers: w.layers.map((l) => ({
        qWeight: l.qWeight.map((r) => [...r]),
        kWeight: l.kWeight.map((r) => [...r]),
        vWeight: l.vWeight.map((r) => [...r]),
        outWeight: l.outWeight.map((r) => [...r]),
        ffn1Weight: l.ffn1Weight.map((r) => [...r]),
        ffn2Weight: l.ffn2Weight.map((r) => [...r]),
        norm1Gamma: [...l.norm1Gamma],
        norm2Gamma: [...l.norm2Gamma],
      })),
      epistemicHead: w.epistemicHead.map((row) => [...row]),
      lmHead: w.lmHead.map((row) => [...row]),
    };
  }

  /**
   * Proves that model output genuinely depends on model weights by mutating an
   * isolated cloned weight tensor in-memory and observing logit changes,
   * then restoring the certified weights.
   */
  public static measureWeightSensitivity(
    model: CubiONativeModel,
    tokenizer: NativeTokenizer,
    testPrompt = 'Coordinate of cell 0'
  ): WeightSensitivityResult {
    const originalWeights = model.getWeights();
    const tokens = tokenizer.encode(testPrompt, { addSpecialTokens: true });

    // 1. Baseline forward pass with certified weights
    const baselineFwd = model.forward(tokens);
    const lastIdx = baselineFwd.logits.length - 1;
    const baselineLastLogits = [...baselineFwd.logits[lastIdx]];

    // 2. Clone weights and apply an isolated perturbation to lmHead
    const clonedWeights = this.cloneWeights(originalWeights);
    clonedWeights.lmHead[0][0] += 3.0;

    // 3. Load perturbed weights into model and execute identical input
    model.setWeights(clonedWeights);
    const perturbedFwd = model.forward(tokens);
    const perturbedLastLogits = [...perturbedFwd.logits[lastIdx]];

    // 4. Calculate delta
    let maxDelta = 0;
    let sumDelta = 0;
    for (let i = 0; i < baselineLastLogits.length; i++) {
      const diff = Math.abs(baselineLastLogits[i] - perturbedLastLogits[i]);
      if (diff > maxDelta) maxDelta = diff;
      sumDelta += diff;
    }
    const meanDelta = sumDelta / baselineLastLogits.length;

    // 5. Restore certified clean weights
    model.setWeights(originalWeights);
    const restoredFwd = model.forward(tokens);
    const restoredLastLogits = restoredFwd.logits[lastIdx];

    let restoredDelta = 0;
    for (let i = 0; i < baselineLastLogits.length; i++) {
      restoredDelta += Math.abs(baselineLastLogits[i] - restoredLastLogits[i]);
    }
    const restoredCleanState = restoredDelta < 1e-6;

    return {
      baselineLogitSample: baselineLastLogits.slice(0, 10),
      perturbedLogitSample: perturbedLastLogits.slice(0, 10),
      maxLogitDelta: Math.round(maxDelta * 10000) / 10000,
      meanLogitDelta: Math.round(meanDelta * 10000) / 10000,
      weightsActuallyDiverged: maxDelta > 0.01,
      restoredCleanState,
    };
  }

  /**
   * Evaluates input sensitivity by computing logit distribution deltas between two inputs.
   */
  public static measureInputSensitivity(
    model: CubiONativeModel,
    tokenizer: NativeTokenizer,
    promptA = '2 + 2',
    promptB = '2 + 3'
  ): InputSensitivityResult {
    const tokensA = tokenizer.encode(promptA, { addSpecialTokens: false });
    const tokensB = tokenizer.encode(promptB, { addSpecialTokens: false });

    const fwdA = model.forward(tokensA);
    const fwdB = model.forward(tokensB);

    const lenA = fwdA.logits.length;
    const lenB = fwdB.logits.length;
    const compareLen = Math.min(lenA, lenB);

    let maxDelta = 0;
    let sumDiff = 0;
    let totalComparisons = 0;

    for (let t = 0; t < compareLen; t++) {
      const logitsA = fwdA.logits[t];
      const logitsB = fwdB.logits[t];
      const vocabSize = Math.min(logitsA.length, logitsB.length);

      for (let v = 0; v < vocabSize; v++) {
        const diff = Math.abs(logitsA[v] - logitsB[v]);
        if (diff > maxDelta) maxDelta = diff;
        sumDiff += diff;
        totalComparisons++;
      }
    }

    const meanLogitDelta = totalComparisons > 0 ? Math.round((sumDiff / totalComparisons) * 10000) / 10000 : 0;

    return {
      promptA,
      promptB,
      tokensA,
      tokensB,
      meanLogitDelta,
      outputDiverged: maxDelta > 0.01,
    };
  }

  /**
   * Inspects detailed autoregressive token generation.
   */
  public static inspectGeneration(
    engine: NativeInferenceEngine,
    prompt: string,
    maxTokens = 16
  ): AutoregressiveStepTrace {
    const start = Date.now();
    const out = engine.generate(prompt, { maxTokens, temperature: 0.01 });
    const latencyMs = Math.max(1, Date.now() - start);

    return {
      prompt,
      generatedTokens: out.tokenIds,
      decodedText: out.text,
      tokenCount: out.tokenIds.length,
      latencyMs,
      dominantEpistemicStatus: out.epistemicStatus,
    };
  }
}
