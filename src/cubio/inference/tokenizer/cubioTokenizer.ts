/**
 * CubiO — Real Pretrained Model Tokenizer
 * Interfaces with the native BPE tokenizer of the loaded pretrained model.
 */

import { ModelLoader } from '../runtime/modelLoader';

export class CubiOTokenizer {
  public static readonly VOCAB_SIZE = 151643;
  public static readonly BOS_TOKEN = 151644; // <|im_start|>
  public static readonly EOS_TOKEN = 151645; // <|im_end|>
  public static readonly PAD_TOKEN = 151643; // <|endoftext|>

  public static async encodeAsync(text: string): Promise<readonly number[]> {
    const loaded = await ModelLoader.loadPretrainedModel();
    const encoded = await loaded.tokenizer(text);
    const data = Array.from(encoded.input_ids.data as BigInt64Array | Int32Array).map(Number);
    return Object.freeze(data);
  }

  public static encode(text: string): readonly number[] {
    const cached = ModelLoader.getCachedModel();
    if (cached && cached.tokenizer) {
      // If tokenizer is synchronously accessible
      try {
        const encoded = cached.tokenizer(text);
        if (encoded && encoded.input_ids && encoded.input_ids.data) {
          const data = Array.from(encoded.input_ids.data as BigInt64Array | Int32Array).map(Number);
          return Object.freeze(data);
        }
      } catch {
        // fallback to character bytes
      }
    }

    // Basic deterministic utf-8 byte token fallback for initial synchronous checks
    const bytes = Array.from(new TextEncoder().encode(text));
    return Object.freeze([this.BOS_TOKEN, ...bytes, this.EOS_TOKEN]);
  }

  public static async decodeAsync(tokens: readonly number[]): Promise<string> {
    const loaded = await ModelLoader.loadPretrainedModel();
    return loaded.tokenizer.decode(tokens, { skip_special_tokens: true });
  }

  public static decode(tokens: readonly number[]): string {
    const cached = ModelLoader.getCachedModel();
    if (cached && cached.tokenizer) {
      try {
        return cached.tokenizer.decode(tokens, { skip_special_tokens: true });
      } catch {
        // fallback
      }
    }

    const clean = tokens.filter(t => t !== this.BOS_TOKEN && t !== this.EOS_TOKEN && t !== this.PAD_TOKEN);
    try {
      return new TextDecoder().decode(new Uint8Array(clean));
    } catch {
      return clean.join(' ');
    }
  }
}
