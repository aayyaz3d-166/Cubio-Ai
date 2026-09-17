/**
 * 3D Memory Studio - Funnel 12: Validator Engine
 * 
 * Verifies consistency between Funnel 11 selections, binary artifacts,
 * and reconstructed memory structures.
 */

import { CompositeSelectionResult, SelectedCompositeEntry } from '../../funnel11/types/selection';
import { Compact3DArtifactV4 } from '../types/artifact';
import { DecodedMemory } from '../types/decoder';
import { CoverageReport, Funnel12ErrorCode } from '../types/validation';

export interface ValidationCheckResult {
  readonly isValid: boolean;
  readonly errorCodes: readonly Funnel12ErrorCode[];
  readonly issues: readonly string[];
}

/**
 * Validates that an encoded artifact is 100% consistent with Funnel 11's selection
 */
export function validateFunnel11SelectionConsistency(
  selectionResult: CompositeSelectionResult,
  artifact: Compact3DArtifactV4
): ValidationCheckResult {
  const issues: string[] = [];
  const errorCodes: Funnel12ErrorCode[] = [];

  const expectedDefs = selectionResult.selectedEntries.length;
  if (artifact.header.compositeDefCount !== expectedDefs) {
    issues.push(`F11_SELECTION_MISMATCH: Composite definition count mismatch (Expected: ${expectedDefs}, Found: ${artifact.header.compositeDefCount})`);
    errorCodes.push('F11_SELECTION_MISMATCH');
  }

  const expectedRefs = selectionResult.selectedEntries.reduce(
    (sum, e) => sum + e.occurrences.length,
    0
  );
  if (artifact.header.compositeRefCount !== expectedRefs) {
    issues.push(`F11_SELECTION_MISMATCH: Composite reference count mismatch (Expected: ${expectedRefs}, Found: ${artifact.header.compositeRefCount})`);
    errorCodes.push('F11_SELECTION_MISMATCH');
  }

  // Cross-block check
  for (const entry of selectionResult.selectedEntries) {
    for (const occ of entry.occurrences) {
      if (typeof occ.blockId !== 'number' || occ.blockId < 0) {
        issues.push(`CROSS_BLOCK_COMPOSITE: Invalid blockId in occurrence ${occ.occurrenceId}`);
        errorCodes.push('CROSS_BLOCK_COMPOSITE');
      }
    }
  }

  return {
    isValid: issues.length === 0,
    errorCodes,
    issues,
  };
}
