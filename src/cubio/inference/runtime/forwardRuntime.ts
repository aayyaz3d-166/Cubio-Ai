/**
 * CubiO — Forward Inference Runtime
 * Computes real vocabulary logits from input tokens via NeuralForwardEngine.
 */

import { NeuralForwardEngine } from '../authenticity/neuralForwardEngine';
import { CubiOTokenizer } from '../tokenizer/cubioTokenizer';

export class ForwardRuntime {
  public static async computeLogitsAsync(
    inputTokens: readonly number[],
    temperature = 0.7
  ): Promise<number[]> {
    const { logits } = await NeuralForwardEngine.forwardPassAsync(inputTokens, temperature);
    return logits;
  }

  public static computeLogits(
    inputTokens: readonly number[],
    _weights?: readonly number[],
    _vocabSize = CubiOTokenizer.VOCAB_SIZE
  ): number[] {
    const { logits } = NeuralForwardEngine.forwardPass(inputTokens);
    return logits;
  }
}
