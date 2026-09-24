/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/segmentationGovernor.ts
 *
 * Safety & Resource Governor for Context Segmentation:
 * - Permanent hardware actuation lockout fail-closed.
 * - Static sovereignty checks against foreign chunking/tokenization libraries.
 * - Enforces stream length and chunk count ceilings.
 */

import {
  IS_ACTUATION_BLOCKED,
  PROHIBITED_SEGMENTATION_LIBRARIES,
  SegmentationActuationBlockedError,
  SegmentationForeignFrameworkError,
  SegmentationError,
} from './types.js';

export const MAX_STREAM_CHARS = 10_000_000; // 10 million characters (~2.5M tokens)
export const MAX_CHUNKS_PER_DOCUMENT = 10_000;

export class SegmentationGovernor {
  private static readonly ACTUATION_DIRECTIVE_PATTERN =
    /\b(actuate|motor|relay|solenoid|valve|gpio|hardware_override|physical_drive|stepper|arm_move|fire_thruster|switch_circuit)\b/i;

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(text?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new SegmentationActuationBlockedError('GLOBAL_LOCKOUT_DISABLED_VIOLATION');
    }

    if (text && this.ACTUATION_DIRECTIVE_PATTERN.test(text)) {
      throw new SegmentationActuationBlockedError(text);
    }
  }

  /**
   * Asserts framework sovereignty by rejecting prohibited foreign libraries.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const normalized = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_SEGMENTATION_LIBRARIES) {
      if (normalized.includes(prohibited)) {
        throw new SegmentationForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Asserts stream size and chunk counts stay within bounded envelopes.
   */
  public static assertStreamBudget(charLength: number, expectedChunks?: number): void {
    if (charLength > MAX_STREAM_CHARS) {
      throw new SegmentationError(
        `Stream length ${charLength.toLocaleString()} exceeds max budget of ${MAX_STREAM_CHARS.toLocaleString()} characters.`,
        'STREAM_CAPACITY_EXCEEDED'
      );
    }

    if (expectedChunks !== undefined && expectedChunks > MAX_CHUNKS_PER_DOCUMENT) {
      throw new SegmentationError(
        `Chunk count ${expectedChunks.toLocaleString()} exceeds max document limit of ${MAX_CHUNKS_PER_DOCUMENT.toLocaleString()}.`,
        'CHUNK_COUNT_EXCEEDED'
      );
    }
  }
}
