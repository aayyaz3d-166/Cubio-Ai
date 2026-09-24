/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F77: Injection Defense Guard
 *
 * Scans and neutralizes adversarial prompt & tool injection attacks.
 */

export class InjectionDefenseGuard {
  private injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s+prompt\s+override/i,
    /drop\s+table/i,
    /<script[\s\S]*?>/i,
    /eval\s*\(/i,
    /process\.env/i,
  ];

  public scanAndNeutralize(payload: string): {
    isSafe: boolean;
    detectedAttacks: readonly string[];
    sanitizedContent: string;
  } {
    const detectedAttacks: string[] = [];
    let sanitizedContent = payload;

    for (const pattern of this.injectionPatterns) {
      if (pattern.test(sanitizedContent)) {
        detectedAttacks.push(`INJECTION_DETECTED: ${pattern.source}`);
        sanitizedContent = sanitizedContent.replace(pattern, '[BLOCKED_INJECTION_PAYLOAD]');
      }
    }

    return {
      isSafe: detectedAttacks.length === 0,
      detectedAttacks: Object.freeze(detectedAttacks),
      sanitizedContent,
    };
  }
}
