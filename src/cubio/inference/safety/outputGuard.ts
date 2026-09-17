/**
 * CUBiO AI — Step 87 & Task 85 Output Guard
 * src/cubio/inference/safety/outputGuard.ts
 *
 * Universal Output Safety Guard & Verification Gateway.
 * Intercepts all textual, analytical, and conversational candidate emissions
 * before release. Permanently blocks hardware actuation commands fail-closed,
 * integrates with NativeSelfVerifier for sovereign hallucination prevention,
 * and preserves 100% backward compatibility for existing runtime callers.
 */

import { NativeSelfVerifier } from '../../language/native/verification/nativeSelfVerifier';
import { VerificationAuditTrail } from '../../language/native/verification/hallucinationVerificationTypes';

export interface OutputGuardOptions {
  readonly tenantId?: string;
  readonly context?: string | readonly string[];
  readonly verifier?: NativeSelfVerifier;
  readonly enableVerification?: boolean;
}

export interface OutputGuardVerdict {
  readonly isSafe: boolean;
  readonly sanitizedText: string;
  readonly violations?: readonly string[];
  readonly auditTrail?: VerificationAuditTrail;
}

export class OutputGuard {
  /**
   * Evaluates candidate output text for safety boundaries, actuation blocks,
   * and optional hallucination verification.
   */
  public static validateOutput(text: string, options?: OutputGuardOptions): OutputGuardVerdict {
    if (!text || typeof text !== 'string') {
      return {
        isSafe: true,
        sanitizedText: '',
      };
    }

    const violations: string[] = [];

    // 1. Permanent Hardware Actuation Guard
    const lower = text.toLowerCase();
    const attemptsActuation =
      (
        /\b(?:actuate hardware|execute physical command|move robotic arm|switch circuit|fire thruster|trigger actuator|control physical motors|drive motor|actuate motor|move motor)\b/i.test(lower) ||
        /\b(?:actionner le matériel|actionner le materiel|déplacer le bras robotique|deplacer le bras robotique|activer actionneur)\b/i.test(lower) ||
        /\b(?:hardware ansteuern|roboterarm bewegen|motor ansteuern|aktor betätigen)\b/i.test(lower) ||
        /ہارڈویئر\s+کو?\s+چلائیں|روبوٹک\s+بازو|موٹر\s+چلائیں/u.test(lower) ||
        /تشغيل\s+الأجهزة|تحريك\s+الذراع\s+الآلية/u.test(lower) ||
        /执行硬件驱动|移动机械臂|触发执行器|控制物理电机/u.test(lower)
      ) &&
      !/\b(?:permanently blocked|cannot actuate|refuses to actuate|lockout|verrouillé|gesperrt|مقفل|محظور|锁定)\b/i.test(lower);

    if (attemptsActuation) {
      violations.push('HARDWARE_ACTUATION_PROHIBITED');
      return {
        isSafe: false,
        sanitizedText:
          '[REFUSAL] Refusal: Hardware actuation is permanently blocked in CUBiO AI sovereign runtime. Advisory and analytical outputs only.',
        violations: Object.freeze(violations),
      };
    }

    // 2. Sovereign Self-Verification Integration (if verifier provided or enabled)
    if (options?.verifier || options?.enableVerification) {
      const verifier = options.verifier ?? new NativeSelfVerifier();
      const auditTrail = verifier.verify(text, {
        tenantId: options.tenantId,
        context: options.context,
      });

      if (!auditTrail.isSafeForEmission) {
        violations.push('HALLUCINATION_OR_CONTRADICTION_INTERCEPTED');
      }

      return {
        isSafe: auditTrail.isSafeForEmission,
        sanitizedText: auditTrail.verifiedResponseText,
        violations: violations.length > 0 ? Object.freeze(violations) : undefined,
        auditTrail,
      };
    }

    return {
      isSafe: true,
      sanitizedText: text,
    };
  }

  /**
   * Explicit pre-emission verification gateway directly wiring NativeSelfVerifier.
   */
  public static verifyAndSanitize(
    text: string,
    options?: {
      verifier?: NativeSelfVerifier;
      tenantId?: string;
      context?: string | readonly string[];
    }
  ): OutputGuardVerdict {
    return OutputGuard.validateOutput(text, {
      ...options,
      enableVerification: true,
    });
  }
}
