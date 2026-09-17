/**
 * CubiO — Real Pretrained Detokenizer
 * Transforms generated token IDs into natural language text via the pretrained model's native tokenizer.
 */

import { CubiOTokenizer } from '../tokenizer/cubioTokenizer';

export class Detokenizer {
  public static detokenizeStream(
    tokenIds: readonly number[],
    accumulatedText: string,
    _promptText?: string
  ): {
    nextChunk: string;
    fullText: string;
  } {
    if (tokenIds.length === 0) {
      return { nextChunk: '', fullText: accumulatedText };
    }

    const latestToken = tokenIds[tokenIds.length - 1];
    if (latestToken === CubiOTokenizer.EOS_TOKEN || latestToken === CubiOTokenizer.PAD_TOKEN) {
      return { nextChunk: '', fullText: accumulatedText };
    }

    const nextChunk = CubiOTokenizer.decode([latestToken]);
    const fullText = accumulatedText + nextChunk;

    return {
      nextChunk,
      fullText,
    };
  }

  public static detokenize(tokenIds: readonly number[]): string {
    return CubiOTokenizer.decode(tokenIds).trim();
  }
}
