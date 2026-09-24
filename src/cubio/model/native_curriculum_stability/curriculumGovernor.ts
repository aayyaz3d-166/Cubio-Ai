/**
 * CUBiO AI — Task 167: Native Curriculum & Training Stability
 * src/cubio/model/native_curriculum_stability/curriculumGovernor.ts
 *
 * Numerical Stability & Stage Progression Governor:
 * - Detects loss spikes (> 2.5x threshold) and non-finite loss/gradients fail-closed.
 * - Enforces prerequisite stage completion and probe validation before unlocking stages.
 * - Computes L2 gradient norms and applies deterministic norm clipping per stage.
 * - Enforces permanent hardware actuation lockout (IS_ACTUATION_BLOCKED === true).
 * - Rejects prohibited foreign ML frameworks and foreign pretrained weights.
 */

import {
  IS_ACTUATION_BLOCKED,
  CurriculumStage,
  CURRICULUM_STAGE_SEQUENCE,
  CurriculumStageMetrics,
  PROHIBITED_FOREIGN_TRAINING_FRAMEWORKS,
  CurriculumDivergenceError,
  CurriculumStageProgressionError,
  CurriculumActuationBlockedError,
  CurriculumForeignFrameworkError,
  CurriculumStabilityError,
} from './types';

export class CurriculumGovernor {
  /**
   * Asserts permanent hardware actuation lockout.
   * Throws CurriculumActuationBlockedError if any physical actuation is requested.
   */
  public static assertActuationLockout(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new CurriculumActuationBlockedError('Safety lock corrupted: IS_ACTUATION_BLOCKED is false');
    }

    if (directive) {
      const lower = directive.toLowerCase();
      const forbiddenTerms = [
        'actuate',
        'motor',
        'servo',
        'robot',
        'relay',
        'solenoid',
        'pneumatic',
        'arm',
        'gripper',
        'hardware_execute',
        'gpio',
      ];
      for (const term of forbiddenTerms) {
        if (lower.includes(term)) {
          throw new CurriculumActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Validates framework identifier to ensure zero foreign framework infiltration.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const normalized = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_TRAINING_FRAMEWORKS) {
      if (normalized.includes(prohibited)) {
        throw new CurriculumForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Validates step loss for finite bounds and spike detection.
   * Fails closed with CurriculumDivergenceError if current loss explodes > maxAllowedLossSpikeFactor * prevLoss.
   */
  public static validateStepLoss(
    stage: CurriculumStage,
    step: number,
    currentLoss: number,
    prevLoss: number,
    maxAllowedLossSpikeFactor: number
  ): void {
    if (!Number.isFinite(currentLoss) || Number.isNaN(currentLoss) || currentLoss < 0) {
      throw new CurriculumDivergenceError(
        stage,
        step,
        prevLoss,
        currentLoss,
        Infinity
      );
    }

    if (prevLoss > 0.0001) {
      const ratio = currentLoss / prevLoss;
      if (ratio > maxAllowedLossSpikeFactor) {
        throw new CurriculumDivergenceError(
          stage,
          step,
          prevLoss,
          currentLoss,
          ratio
        );
      }
    }
  }

  /**
   * Computes L2 Frobenius norm across 2D gradient matrices.
   */
  public static computeL2Norm(matrix: number[][]): number {
    let sumSq = 0;
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      for (let j = 0; j < row.length; j++) {
        const val = row[j];
        if (!Number.isFinite(val) || Number.isNaN(val)) {
          throw new CurriculumStabilityError(
            `Non-finite gradient encountered in computeL2Norm at index [${i}, ${j}]`,
            'GRADIENT_NON_FINITE'
          );
        }
        sumSq += val * val;
      }
    }
    return Math.sqrt(sumSq);
  }

  /**
   * Applies deterministic L2 gradient clipping to prevent exploding updates.
   */
  public static clipGradients(
    matrix: number[][],
    maxNorm: number
  ): { clippedMatrix: number[][]; originalNorm: number; wasClipped: boolean } {
    const norm = this.computeL2Norm(matrix);
    if (norm <= maxNorm || norm === 0) {
      return {
        clippedMatrix: matrix,
        originalNorm: norm,
        wasClipped: false,
      };
    }

    const scale = maxNorm / norm;
    const clipped: number[][] = [];
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      const newRow = new Array(row.length);
      for (let j = 0; j < row.length; j++) {
        newRow[j] = row[j] * scale;
      }
      clipped.push(newRow);
    }

    return {
      clippedMatrix: clipped,
      originalNorm: norm,
      wasClipped: true,
    };
  }

  /**
   * Enforces strict sequential progression across the curriculum stages.
   * Stage N+1 cannot execute unless Stage N is completed, converged, and passed its validation probes.
   */
  public static assertStageProgression(
    requestedStage: CurriculumStage,
    completedStageMetrics: ReadonlyMap<CurriculumStage, CurriculumStageMetrics>
  ): void {
    const targetIdx = CURRICULUM_STAGE_SEQUENCE.indexOf(requestedStage);
    if (targetIdx === -1) {
      throw new CurriculumStabilityError(`Unknown curriculum stage: ${requestedStage}`);
    }

    // Stage 1 has no prerequisites
    if (targetIdx === 0) {
      return;
    }

    // Every preceding stage must have been completed, converged, and passed validation
    for (let i = 0; i < targetIdx; i++) {
      const prereqStage = CURRICULUM_STAGE_SEQUENCE[i];
      const metrics = completedStageMetrics.get(prereqStage);

      if (!metrics) {
        throw new CurriculumStageProgressionError(
          requestedStage,
          prereqStage,
          'Stage has not been executed yet'
        );
      }

      if (!metrics.converged) {
        throw new CurriculumStageProgressionError(
          requestedStage,
          prereqStage,
          `Stage did not converge (deltaLoss: ${metrics.deltaLoss.toFixed(4)})`
        );
      }

      if (!metrics.probeResult.passed) {
        throw new CurriculumStageProgressionError(
          requestedStage,
          prereqStage,
          `Validation probe failed: accuracy ${metrics.probeResult.accuracy.toFixed(3)} < threshold ${metrics.probeResult.threshold.toFixed(3)}`
        );
      }
    }
  }
}
