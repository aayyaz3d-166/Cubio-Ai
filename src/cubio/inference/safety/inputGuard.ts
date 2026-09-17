/**
 * CubiO — Step 87 Input Guard
 */

export class InputGuard {
  public static validateInput(prompt: string): { isSafe: boolean; sanitizedPrompt: string; violationReason?: string } {
    if (!prompt) return { isSafe: true, sanitizedPrompt: '' };

    // Neutralize dangerous null bytes
    const sanitized = prompt.replace(/\0/g, '');
    return {
      isSafe: true,
      sanitizedPrompt: sanitized,
    };
  }
}
