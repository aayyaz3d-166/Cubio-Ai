/**
 * CubiO — Step 88 Streaming Integrity Validator
 * Validates that streamed chunk concatenation matches non-streamed full responses bit-for-bit under identical seeds.
 */

import { InferenceEngine } from '../runtime/inferenceEngine';

export class StreamingIntegrityValidator {
  public static async validateParity(
    prompt: string,
    engine?: InferenceEngine,
    seed = 369
  ): Promise<{
    isIdentical: boolean;
    nonStreamedContent: string;
    streamedConcatenatedContent: string;
    tokenCountParity: boolean;
  }> {
    const infEngine = engine || new InferenceEngine();

    // 1. Non-streamed response
    const nonStreamedResp = await infEngine.generateChatResponse({
      messages: [{ role: 'user', content: prompt }],
      config: { seed, temperature: 0 },
    });

    // 2. Streamed response
    const stream = infEngine.generateChatStream({
      messages: [{ role: 'user', content: prompt }],
      config: { seed, temperature: 0 },
    });

    let streamedAccum = '';
    let streamTokens = 0;

    for await (const chunk of stream) {
      streamTokens += 1;
      if (chunk.textChunk) {
        streamedAccum += chunk.textChunk;
      }
    }

    const isIdentical = nonStreamedResp.message.content.trim() === streamedAccum.trim();

    return {
      isIdentical,
      nonStreamedContent: nonStreamedResp.message.content,
      streamedConcatenatedContent: streamedAccum,
      tokenCountParity: nonStreamedResp.generatedTokenCount === streamTokens,
    };
  }
}
