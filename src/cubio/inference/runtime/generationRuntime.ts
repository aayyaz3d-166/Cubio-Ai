/**
 * CubiO — Real Autoregressive Generation Runtime
 * Executes real streaming generation using the loaded pretrained model and ONNX tensors.
 */

import { ModelLoader } from './modelLoader';
import { CubiOTokenizer } from '../tokenizer/cubioTokenizer';
import { InferenceGenerationConfig, InferenceStreamChunk } from '../types';
import { CUBIO_SYSTEM_PROMPT } from '../../intelligence/universal/llm/systemPrompt';

export class GenerationRuntime {
  public static async *generateStream(
    _promptTokens: readonly number[],
    promptText: string,
    _weights?: readonly number[],
    config: InferenceGenerationConfig = {},
    messages?: readonly { role: string; content: string }[]
  ): AsyncGenerator<InferenceStreamChunk, void, unknown> {
    const loaded = await ModelLoader.loadPretrainedModel();
    if (!loaded.isLoaded || !loaded.generator) {
      throw new Error('[NATIVE_INFERENCE_NOT_YET_AVAILABLE] External model execution is eradicated. Status: NATIVE_INFERENCE_NOT_YET_AVAILABLE.');
    }
    const tokenizer = loaded.tokenizer;
    const generator = loaded.generator;

    // Default CPU token limit: 32 tokens (ensures completion well within 15s UI timeout)
    const maxNewTokens = config.maxNewTokens || 32;
    const temp = config.temperature ?? 0.7;
    const doSample = temp > 0.01;

    // Format chat prompt using standard ChatML delimiters with deterministic CUBiO system instruction
    let formattedPrompt = `<|im_start|>system\n${CUBIO_SYSTEM_PROMPT}<|im_end|>\n`;
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const role = msg.role.toLowerCase() === 'assistant' ? 'assistant' : msg.role.toLowerCase() === 'system' ? 'system' : 'user';
        if (msg.content) {
          formattedPrompt += `<|im_start|>${role}\n${msg.content}<|im_end|>\n`;
        }
      }
    } else {
      formattedPrompt += `<|im_start|>user\n${promptText}<|im_end|>\n`;
    }
    formattedPrompt += `<|im_start|>assistant\n`;

    const queue: InferenceStreamChunk[] = [];
    let isDone = false;
    let stepIndex = 0;
    const t0 = performance.now();
    let firstTokenTimestamp = 0;

    const generationPromise = (async () => {
      try {
        await generator(formattedPrompt, {
          max_new_tokens: maxNewTokens,
          temperature: temp,
          do_sample: doSample,
          callback_function: (beams: any) => {
            const tokenIds = beams[0].output_token_ids;
            const latestToken = Number(tokenIds[tokenIds.length - 1]);

            if (stepIndex === 0) {
              firstTokenTimestamp = performance.now();
            }

            const isEOS = latestToken === CubiOTokenizer.EOS_TOKEN || latestToken === 151643;
            let textPiece = tokenizer.decode([latestToken]);
            if (textPiece === '<|im_end|>' || textPiece === '<|endoftext|>') {
              textPiece = '';
            }

            const chunk: InferenceStreamChunk = {
              chunkId: `chunk_${stepIndex}_${latestToken}`,
              textChunk: textPiece,
              tokenIndex: stepIndex,
              tokenId: latestToken,
              isFinal: isEOS,
              finishReason: isEOS ? 'stop' : undefined,
              ttftMs: stepIndex === 0 ? Math.max(1, firstTokenTimestamp - t0) : undefined,
              latencyMs: Math.max(1, performance.now() - t0),
            };

            stepIndex++;
            queue.push(chunk);
          },
        });
      } finally {
        isDone = true;
      }
    })();

    // Yield queued chunks as they arrive from the generator
    while (!isDone || queue.length > 0) {
      if (queue.length > 0) {
        const item = queue.shift()!;
        yield item;
        if (item.isFinal) {
          break;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }

    await generationPromise;
  }
}
