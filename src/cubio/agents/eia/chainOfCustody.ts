/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/chainOfCustody.ts
 *
 * Chain-of-custody engine.
 * Validates monotonic RX0 -> RX5 lifecycle transitions, generates
 * cryptographic step hashes, and detects skipped stages, out-of-order
 * actions, and broken hash links.
 */

import * as crypto from 'crypto';
import { EIAChainOfCustodyStep, EIAStageTransition, EIADiscrepancy } from './types';

export const RX_STAGE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  0: 'RX0_BIRTH',
  1: 'RX1_SUPERPOSITION',
  2: 'RX2_INTERACTION',
  3: 'RX3_AWARENESS',
  4: 'RX4_EVOLUTION',
  5: 'RX5_EXIT',
});

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class EIAChainOfCustody {
  private readonly steps: EIAChainOfCustodyStep[] = [];

  /**
   * Appends a new verified step to the chain-of-custody.
   */
  public addStep(params: {
    stage: number;
    action: string;
    actor: string;
    inputHash: string;
    outputHash: string;
    timestamp?: number;
  }): EIAChainOfCustodyStep {
    const stepIndex = this.steps.length;
    const stage = Math.max(0, Math.min(5, Math.floor(params.stage)));
    const stageName = RX_STAGE_NAMES[stage] || `RX${stage}`;
    const timestamp = params.timestamp || Date.now();

    const previousStepHash =
      this.steps.length === 0
        ? GENESIS_HASH
        : this.steps[this.steps.length - 1].stepHash;

    const payload = `${previousStepHash}:${stepIndex}:${stage}:${params.action}:${params.actor}:${params.inputHash}:${params.outputHash}`;
    const stepHash = crypto.createHash('sha256').update(payload).digest('hex');

    const step: EIAChainOfCustodyStep = Object.freeze({
      stepIndex,
      stage,
      stageName,
      action: params.action,
      actor: params.actor,
      inputHash: params.inputHash,
      outputHash: params.outputHash,
      previousStepHash,
      stepHash,
      timestamp,
    });

    this.steps.push(step);
    return step;
  }

  public getSteps(): readonly EIAChainOfCustodyStep[] {
    return Object.freeze([...this.steps]);
  }

  /**
   * Validates a stage transition for strict monotonicity.
   */
  public static validateTransition(
    fromStage: number,
    toStage: number,
    agentId: string = 'UNKNOWN_AGENT'
  ): {
    readonly isMonotonic: boolean;
    readonly transition: EIAStageTransition;
    readonly error?: string;
  } {
    const isMonotonic = toStage >= fromStage && toStage <= fromStage + 1;
    const payload = `${fromStage}->${toStage}:${agentId}`;
    const transitionHash = crypto.createHash('sha256').update(payload).digest('hex');

    const transition: EIAStageTransition = Object.freeze({
      fromStage,
      toStage,
      transitionHash,
      timestamp: Date.now(),
      agentId,
      isMonotonic,
    });

    if (!isMonotonic) {
      if (toStage < fromStage) {
        return {
          isMonotonic: false,
          transition,
          error: `OUT_OF_ORDER: Cannot regress from RX${fromStage} to RX${toStage}`,
        };
      }
      if (toStage > fromStage + 1) {
        return {
          isMonotonic: false,
          transition,
          error: `STAGE_SKIPPED: Transition from RX${fromStage} to RX${toStage} skips intermediate stages`,
        };
      }
    }

    return { isMonotonic: true, transition };
  }

  /**
   * Verifies an entire chain of custody steps for integrity, continuity, and monotonicity.
   */
  public static verifyChain(steps: readonly EIAChainOfCustodyStep[]): {
    readonly isValid: boolean;
    readonly discrepancies: readonly EIADiscrepancy[];
  } {
    const discrepancies: EIADiscrepancy[] = [];

    if (steps.length === 0) {
      return { isValid: true, discrepancies: Object.freeze([]) };
    }

    let previousHash = GENESIS_HASH;
    let highestStage = -1;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // 1. Sequence index continuity
      if (step.stepIndex !== i) {
        discrepancies.push({
          discrepancyId: `DISC_SEQ_${i}`,
          severity: 'CRITICAL',
          type: 'OUT_OF_ORDER',
          description: `Chain step index mismatch: expected ${i}, found ${step.stepIndex}`,
          targetReference: `step[${i}]`,
          expected: String(i),
          actual: String(step.stepIndex),
        });
      }

      // 2. Chained previous hash check
      if (step.previousStepHash !== previousHash) {
        discrepancies.push({
          discrepancyId: `DISC_PREV_HASH_${i}`,
          severity: 'CRITICAL',
          type: 'HASH_MISMATCH',
          description: `Chain-of-custody broken at step ${i}: previousStepHash does not match preceding stepHash`,
          targetReference: `step[${i}].previousStepHash`,
          expected: previousHash,
          actual: step.previousStepHash,
        });
      }

      // 3. Recomputed step hash verification
      const payload = `${step.previousStepHash}:${step.stepIndex}:${step.stage}:${step.action}:${step.actor}:${step.inputHash}:${step.outputHash}`;
      const expectedStepHash = crypto.createHash('sha256').update(payload).digest('hex');

      if (step.stepHash !== expectedStepHash) {
        discrepancies.push({
          discrepancyId: `DISC_STEP_HASH_${i}`,
          severity: 'CRITICAL',
          type: 'HASH_MISMATCH',
          description: `Tampered step hash at step ${i}`,
          targetReference: `step[${i}].stepHash`,
          expected: expectedStepHash,
          actual: step.stepHash,
        });
      }

      // 4. Monotonic stage progression (same stage or stage + 1 allowed)
      if (step.stage < highestStage) {
        discrepancies.push({
          discrepancyId: `DISC_REGRESSION_${i}`,
          severity: 'CRITICAL',
          type: 'OUT_OF_ORDER',
          description: `Stage regression detected at step ${i}: RX${step.stage} occurred after RX${highestStage}`,
          targetReference: `step[${i}].stage`,
          expected: `>= ${highestStage}`,
          actual: String(step.stage),
        });
      } else if (step.stage > highestStage + 1 && highestStage !== -1) {
        discrepancies.push({
          discrepancyId: `DISC_SKIP_${i}`,
          severity: 'CRITICAL',
          type: 'STAGE_SKIPPED',
          description: `Stage skipped at step ${i}: jumped from RX${highestStage} to RX${step.stage}`,
          targetReference: `step[${i}].stage`,
          expected: `RX${highestStage + 1}`,
          actual: `RX${step.stage}`,
        });
      }

      highestStage = Math.max(highestStage, step.stage);
      previousHash = step.stepHash;
    }

    return {
      isValid: discrepancies.length === 0,
      discrepancies: Object.freeze(discrepancies),
    };
  }
}
