/**
 * CubiO — Step 87 Context Window Manager
 */

import { ChatMessage } from '../types';
import { CubiOTokenizer } from '../tokenizer/cubioTokenizer';

export class ContextWindow {
  public static readonly MAX_CONTEXT_TOKENS = 8192;

  public static pruneMessages(messages: readonly ChatMessage[], maxTokens = this.MAX_CONTEXT_TOKENS): readonly ChatMessage[] {
    const result: ChatMessage[] = [];
    let currentTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const count = CubiOTokenizer.encode(msg.content).length;
      if (currentTokens + count > maxTokens) {
        break;
      }
      result.unshift(msg);
      currentTokens += count;
    }

    return Object.freeze(result);
  }
}
