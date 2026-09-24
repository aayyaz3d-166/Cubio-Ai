/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Safety Guardrails
 *
 * Inspects inputs for prompt injection, jailbreaks, malicious payloads, and sandbox bypass attempts.
 */

import { deterministicHash } from '../../../state/determinism';
import { SafetyGuardrailCheckResult } from './types';

export class SafetyGuardrails {
  private injectionPatterns = [
    /ignore all previous instructions/i,
    /bypass security/i,
    /system override/i,
    /drop all tables/i,
    /rm -rf \//i,
    /sudo su/i,
    /format c:/i,
    /disregard system prompt/i,
  ];

  public inspectPrompt(prompt: string): Readonly<SafetyGuardrailCheckResult> {
    const raw = prompt.trim();
    const violations: string[] = [];

    let injectionDetected = false;
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(raw)) {
        injectionDetected = true;
        violations.push(`Prompt Injection Pattern Detected: ${pattern.source}`);
      }
    }

    const toxicityScore = injectionDetected ? 0.95 : 0.01;
    const isSafe = violations.length === 0;

    const checkChecksum = deterministicHash(
      `GUARDRAIL:${raw}:${isSafe}:${injectionDetected}:${toxicityScore}:${violations.length}`
    );

    return Object.freeze({
      isSafe,
      injectionDetected,
      toxicityScore,
      violations: Object.freeze(violations),
      reason: isSafe ? undefined : violations.join('; '),
      checkChecksum,
    });
  }
}
