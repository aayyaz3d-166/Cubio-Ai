/**
 * CubiO — Step 87 Streaming Controller
 * Formats token stream chunks into Server-Sent Events (SSE) protocol chunks.
 */

import { InferenceStreamChunk } from '../types';

export class StreamingController {
  public static formatSSEChunk(chunk: InferenceStreamChunk): string {
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  public static formatSSEEnd(): string {
    return `data: [DONE]\n\n`;
  }
}
