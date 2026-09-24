/**
 * CubiO — Step 88 Context Isolation Verifier
 */

import { ContextManager } from '../context/contextManager';

export class ContextIsolationVerifier {
  public static verifyCrossSessionIsolation(
    contextManager: ContextManager,
    sessionAId: string,
    sessionBId: string
  ): {
    isIsolated: boolean;
    sessionAHistoryLength: number;
    sessionBHistoryLength: number;
    crossLeakageDetected: boolean;
  } {
    const sessionA = contextManager.getOrCreateSession(sessionAId);
    const sessionB = contextManager.getOrCreateSession(sessionBId);

    const userMessagesA = sessionA.getHistory().filter((m) => m.role === 'user');
    const userMessagesB = sessionB.getHistory().filter((m) => m.role === 'user');

    // Check if any unique user prompt from A leaked into B
    const aUserPrompts = new Set(userMessagesA.map((m) => m.content));
    let leak = false;

    for (const mb of userMessagesB) {
      if (aUserPrompts.has(mb.content) && sessionAId !== sessionBId) {
        leak = true;
        break;
      }
    }

    return {
      isIsolated: !leak && sessionA !== sessionB,
      sessionAHistoryLength: sessionA.getHistory().length,
      sessionBHistoryLength: sessionB.getHistory().length,
      crossLeakageDetected: leak,
    };
  }
}
