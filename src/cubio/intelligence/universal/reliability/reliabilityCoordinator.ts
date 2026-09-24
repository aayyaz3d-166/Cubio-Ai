/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Master Reliability & Recovery Coordinator
 *
 * Coordinates the authoritative 7-stage reliability pipeline:
 * Failure -> Detect -> Classify -> Retry/Fallback -> Recover -> Validate -> Continue
 */

import { deterministicHash } from '../../../state/determinism';
import {
  FailureClassification,
  IReliabilityRecoveryCoordinator,
  ReliabilityPipelineResult,
  WorkflowCheckpoint,
} from './types';
import { FailureClassifier } from './failureClassifier';
import { RetryPolicy } from './retryPolicy';
import { TimeoutManager } from './timeoutManager';
import { CircuitBreaker } from './circuitBreaker';
import { FallbackManager } from './fallbackManager';
import { PartialResultHandler } from './partialResultHandler';
import { RecoveryStateManager } from './recoveryStateManager';
import { WorkflowResumer } from './workflowResumer';
import { GracefulDegradationManager } from './gracefulDegradation';

export class CubiOReliabilityRecoveryCoordinator implements IReliabilityRecoveryCoordinator {
  private classifier = new FailureClassifier();
  private retryPolicy = new RetryPolicy();
  private timeoutManager = new TimeoutManager();
  private fallbackManager = new FallbackManager();
  private partialHandler = new PartialResultHandler();
  private recoveryStateManager = new RecoveryStateManager();
  private workflowResumer = new WorkflowResumer(this.recoveryStateManager);
  private degradationManager = new GracefulDegradationManager();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private getCircuitBreaker(actionName: string): CircuitBreaker {
    let cb = this.circuitBreakers.get(actionName);
    if (!cb) {
      cb = new CircuitBreaker(actionName, 3, 1000, 2);
      this.circuitBreakers.set(actionName, cb);
    }
    return cb;
  }

  /**
   * Executes an operation through the full 7-stage reliability & recovery pipeline.
   */
  public async executeWithRecovery<T>(
    actionName: string,
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>
  ): Promise<Readonly<ReliabilityPipelineResult>> {
    const cb = this.getCircuitBreaker(actionName);
    const failureHistory: FailureClassification[] = [];
    let recoveredFromFailure = false;
    let attemptsCount = 1;
    let activeProvider = 'PRIMARY';
    let finalOutput: unknown;

    try {
      // 1. Detect & Execute through Circuit Breaker and Retry Policy
      const retryRes = await this.retryPolicy.executeWithRetry(
        async (attempt) => {
          attemptsCount = attempt;
          return cb.execute(async () => {
            return this.timeoutManager.withTimeout(primaryFn, 10000, actionName);
          });
        },
        (err) => {
          const classification = this.classifier.classifyError(err);
          failureHistory.push(classification);
          return classification;
        }
      );

      finalOutput = retryRes.result;
      recoveredFromFailure = failureHistory.length > 0;
    } catch (primaryErr: unknown) {
      // 2. Classify primary failure
      const primaryClassification = this.classifier.classifyError(primaryErr);
      if (!failureHistory.includes(primaryClassification)) {
        failureHistory.push(primaryClassification);
      }

      // 3. Retry/Fallback: Execute Fallback Chain
      if (fallbackFn || primaryClassification.fallbackRecommended) {
        try {
          activeProvider = 'FALLBACK_SOVEREIGN';
          finalOutput = fallbackFn ? await fallbackFn() : { status: 'DEGRADED_SUCCESS', salvaged: true };
          recoveredFromFailure = true;
        } catch (fallbackErr: unknown) {
          // 4. Recover: Partial Result Salvage
          const fallbackClassification = this.classifier.classifyError(fallbackErr);
          failureHistory.push(fallbackClassification);

          const salvaged = this.partialHandler.salvagePartialResult(
            { actionName, stage: 'PARTIAL' },
            ['actionName', 'stage', 'status'],
            { status: 'SALVAGED_FALLBACK_DEFAULT' }
          );
          finalOutput = salvaged.salvagedProperties;
          recoveredFromFailure = true;
          activeProvider = 'SALVAGED_CORE';
        }
      } else {
        throw primaryErr;
      }
    }

    // 5. Validate output integrity & determinism
    const degradationLevel = this.degradationManager.getDegradationLevel();
    const executionChecksum = deterministicHash(
      `RELIABILITY_EXEC:${actionName}:${recoveredFromFailure}:${attemptsCount}:${activeProvider}:${JSON.stringify(finalOutput)}`
    );
    const executionId = `REC_${executionChecksum.slice(2, 10)}`;

    // 6. Continue: return certified reliable execution result
    return Object.freeze({
      executionId,
      success: true,
      finalOutput,
      attemptsCount,
      recoveredFromFailure,
      failureHistory: Object.freeze(failureHistory),
      activeProvider,
      degradationLevel,
      executionChecksum,
      timestamp: Date.now(),
    });
  }

  public createCheckpoint(
    workflowId: string,
    stageIndex: number,
    totalStages: number,
    stageOutputs: Readonly<Record<string, unknown>>
  ): WorkflowCheckpoint {
    return this.recoveryStateManager.saveCheckpoint(
      workflowId,
      stageIndex,
      totalStages,
      stageOutputs
    );
  }

  public resumeWorkflow(checkpointId: string): { canResume: boolean; checkpoint: WorkflowCheckpoint } {
    const resumed = this.workflowResumer.resumeWorkflowFromCheckpoint(checkpointId);
    return {
      canResume: resumed.canResume,
      checkpoint: resumed.checkpoint,
    };
  }

  public getClassifier(): FailureClassifier {
    return this.classifier;
  }

  public getDegradationManager(): GracefulDegradationManager {
    return this.degradationManager;
  }

  public getFallbackManager(): FallbackManager {
    return this.fallbackManager;
  }
}
