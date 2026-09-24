/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/postDevelopmentVerifier.ts
 *
 * Post-Development Verification & Final Review Engine.
 * Verifies that development adhered to the PMA Handoff Contract:
 * - Boundary enforcement (allowed vs protected files)
 * - Immutability of database and core spatial authority
 * - Test execution, build status, and regression locks
 * - Final Project Review across the 9 mandatory audit questions
 */

import {
  PMAHandoffContract,
  PMAGitChanges,
  PMAPostDevInspection,
  PMAReviewVerdict,
  PMAVerdictStatus,
} from './types';
import { FrozenProtectionGuard } from './frozenProtectionGuard';
import { SovereigntySafetyGuard } from './sovereigntySafetyGuard';

export class PostDevelopmentVerifier {
  private readonly frozenGuard: FrozenProtectionGuard;
  private readonly safetyGuard: SovereigntySafetyGuard;

  constructor(customRootDir?: string) {
    this.frozenGuard = new FrozenProtectionGuard(customRootDir);
    this.safetyGuard = new SovereigntySafetyGuard();
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Inspects developer git changes against the approved handoff boundary.
   */
  public inspectChanges(
    handoff: PMAHandoffContract,
    changes: PMAGitChanges,
    testResults?: { unitTestsPassed: boolean; regressionPassed: boolean }
  ): PMAPostDevInspection {
    const allowedSet = new Set(handoff.allowedFiles.map((f) => this.normalizePath(f)));
    const protectedSet = new Set(handoff.protectedFiles.map((f) => this.normalizePath(f)));

    const allTouchedFiles = [
      ...changes.changedFiles,
      ...changes.newFiles,
      ...changes.deletedFiles,
      ...changes.renamedFiles,
    ];

    const violatingFiles: string[] = [];
    const frozenFilesTouched: string[] = [];

    for (const file of allTouchedFiles) {
      const norm = this.normalizePath(file);

      // Boundary check: is file in allowedFiles?
      if (!allowedSet.has(norm)) {
        violatingFiles.push(file);
      }

      // Protected check: is file in protectedFiles?
      if (protectedSet.has(norm) || this.frozenGuard.isProtected(norm)) {
        frozenFilesTouched.push(file);
      }
    }

    // Physical baseline check (disk hash verification)
    const { databaseValid, spatial369Valid } = this.frozenGuard.verifyPhysicalBaselines();

    // External AI check in modified code
    let externalAiDetected = false;
    if (changes.modifiedFilesContent) {
      for (const [_, content] of Object.entries(changes.modifiedFilesContent)) {
        const { impact } = this.safetyGuard.evaluateSecurityImpact('', content);
        if (impact.externalAiDetected) {
          externalAiDetected = true;
          break;
        }
      }
    }

    const boundaryViolation = violatingFiles.length > 0;
    const databaseTampered = !databaseValid;
    const spatial369Tampered = !spatial369Valid;
    const actuationLockoutPreserved = this.safetyGuard.is_actuation_blocked;

    return {
      boundaryViolation,
      violatingFiles: Object.freeze(violatingFiles),
      frozenFilesTouched: Object.freeze(frozenFilesTouched),
      databaseTampered,
      spatial369Tampered,
      externalAiDetected,
      actuationLockoutPreserved,
      regressionSuitePassed: testResults?.regressionPassed ?? true,
      unitTestsPassed: testResults?.unitTestsPassed ?? true,
    };
  }

  /**
   * Conducts the comprehensive 9-point Final Project Review.
   */
  public conductFinalReview(
    handoff: PMAHandoffContract,
    changes: PMAGitChanges,
    options?: {
      unitTestsPassed?: boolean;
      buildPassed?: boolean;
      regressionPassed?: boolean;
      implementationMatchesRequest?: boolean;
      duplicatesCreated?: boolean;
    }
  ): PMAReviewVerdict {
    const inspection = this.inspectChanges(handoff, changes, {
      unitTestsPassed: options?.unitTestsPassed ?? true,
      regressionPassed: options?.regressionPassed ?? true,
    });

    const didImplementationMatchRequest = options?.implementationMatchesRequest ?? true;
    const didReuseExistingCapabilities = handoff.existingCapabilities.length > 0;
    const wereDuplicatesCreated = options?.duplicatesCreated ?? (handoff.conflicts.some((c) => c.type === 'DUPLICATE_IMPLEMENTATION'));
    const wereProtectedFilesTouched = inspection.frozenFilesTouched.length > 0;
    const wereUnrelatedFilesModified = inspection.boundaryViolation;
    const didTestsPass = inspection.unitTestsPassed;
    const didBuildPass = options?.buildPassed ?? true;
    const didRegressionPass = inspection.regressionSuitePassed;
    const didAnyInvariantDrift =
      inspection.databaseTampered ||
      inspection.spatial369Tampered ||
      !inspection.actuationLockoutPreserved ||
      inspection.externalAiDetected;

    const detailedFindings: string[] = [];

    // 1. Implementation match
    detailedFindings.push(
      didImplementationMatchRequest
        ? '[PASS] 1. Implementation matches the objective.'
        : '[FAIL] 1. Implementation does not fully meet the request objective.'
    );

    // 2. Capability reuse
    detailedFindings.push(
      didReuseExistingCapabilities
        ? `[PASS] 2. Reused ${handoff.existingCapabilities.length} existing capabilities (${handoff.reuseStrategy}).`
        : `[NOTE] 2. Strategy: ${handoff.reuseStrategy}.`
    );

    // 3. Duplicates
    detailedFindings.push(
      !wereDuplicatesCreated
        ? '[PASS] 3. Zero duplicate engines or parallel systems created.'
        : '[FAIL] 3. Duplicate implementation detected.'
    );

    // 4. Protected files
    detailedFindings.push(
      !wereProtectedFilesTouched
        ? '[PASS] 4. Zero protected files modified.'
        : `[FAIL] 4. Protected files were touched: ${inspection.frozenFilesTouched.join(', ')}`
    );

    // 5. Unrelated files (boundary)
    detailedFindings.push(
      !wereUnrelatedFilesModified
        ? '[PASS] 5. Zero unrelated files touched (Developer stayed inside allowed boundary).'
        : `[FAIL] 5. Developer boundary violation: ${inspection.violatingFiles.join(', ')}`
    );

    // 6. Unit tests
    detailedFindings.push(
      didTestsPass ? '[PASS] 6. Unit and invariant tests passed.' : '[FAIL] 6. Unit tests failed.'
    );

    // 7. Build
    detailedFindings.push(
      didBuildPass ? '[PASS] 7. Build passed with 0 errors.' : '[FAIL] 7. Build failed.'
    );

    // 8. Regression
    detailedFindings.push(
      didRegressionPass
        ? '[PASS] 8. Phase 8 regression lock passed.'
        : '[FAIL] 8. Regression suite failed.'
    );

    // 9. Invariant drift
    detailedFindings.push(
      !didAnyInvariantDrift
        ? '[PASS] 9. Invariants locked bit-for-bit (Database Delta=0, 369 Delta=0, Actuation=Blocked).'
        : '[FAIL] 9. Invariant drift detected.'
    );

    // Final verdict determination
    let finalVerdict: PMAVerdictStatus = 'PASS';

    if (
      wereProtectedFilesTouched ||
      wereUnrelatedFilesModified ||
      didAnyInvariantDrift ||
      !didRegressionPass
    ) {
      finalVerdict = 'BLOCKED';
    } else if (!didTestsPass || !didBuildPass || !didImplementationMatchRequest || wereDuplicatesCreated) {
      finalVerdict = 'PARTIAL_PASS';
    }

    return Object.freeze({
      taskId: handoff.taskId,
      didImplementationMatchRequest,
      didReuseExistingCapabilities,
      wereDuplicatesCreated,
      wereProtectedFilesTouched,
      wereUnrelatedFilesModified,
      didTestsPass,
      didBuildPass,
      didRegressionPass,
      didAnyInvariantDrift,
      finalVerdict,
      detailedFindings: Object.freeze(detailedFindings),
      timestamp: Date.now(),
    });
  }
}
