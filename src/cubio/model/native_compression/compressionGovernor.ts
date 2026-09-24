/**
 * CUBiO AI — Task 175: Context Compression & Summarization
 * src/cubio/model/native_compression/compressionGovernor.ts
 *
 * Resource Governor & Safety Enforcer:
 * - Permanent Hardware Actuation Lockout fail-closed (`IS_ACTUATION_BLOCKED = true`).
 * - Canonical VDB Non-Replacement Invariant: prohibits replacing canonical records with lossy summaries.
 * - Resource limits and ratio governance.
 */

import {
  IS_ACTUATION_BLOCKED,
  CompressedRepresentation,
  CompressionActuationBlockedError,
  LossyCanonicalReplacementError,
  CompressionError,
} from './types.js';

export class CompressionGovernor {
  private static readonly PROHIBITED_ACTUATION_DIRECTIVES = [
    'actuate hardware',
    'control motor',
    'drive stepper',
    'robotics_move',
    'fire thruster',
    'actuate physical',
  ];

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(content?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new CompressionActuationBlockedError('IS_ACTUATION_BLOCKED invariant is false.');
    }
    if (content) {
      const lower = content.toLowerCase();
      for (const term of this.PROHIBITED_ACTUATION_DIRECTIVES) {
        if (lower.includes(term)) {
          throw new CompressionActuationBlockedError(`Prohibited hardware directive detected: "${term}"`);
        }
      }
    }
  }

  /**
   * Asserts that canonical persistent VDB facts are NEVER overwritten by lossy summaries
   * unless source references are strictly preserved.
   */
  public static assertCanonicalReferencePreservation(
    summary: CompressedRepresentation,
    targetObjectId: string
  ): void {
    if (!summary.isCanonicalFactPreserved || summary.sourceReferences.length === 0) {
      throw new LossyCanonicalReplacementError(
        targetObjectId,
        'Attempted to link or replace canonical persistent memory without preserving underlying source references and checksums.'
      );
    }
    const matchingRef = summary.sourceReferences.find(r => r.objectId === targetObjectId);
    if (!matchingRef) {
      throw new LossyCanonicalReplacementError(
        targetObjectId,
        `Target objectId "${targetObjectId}" is not referenced in summary source references.`
      );
    }
  }

  /**
   * Validates compression ratio bounds.
   */
  public static assertValidRatio(ratio: number): void {
    if (ratio <= 0.0 || ratio > 1.0) {
      throw new CompressionError(
        `Invalid compression ratio ${ratio}. Target ratio must be within (0.0, 1.0].`,
        'INVALID_COMPRESSION_RATIO'
      );
    }
  }
}
