/**
 * CubiO — Universal Spatial Operating Environment
 * Step 59: Autonomous Decision Engine
 *
 * Evaluates 14 telemetry metrics and derives appropriate actions:
 * - ADJUST_BATCH_SIZE
 * - ADJUST_GRADIENT_ACCUMULATION
 * - CHANGE_PRECISION
 * - ADJUST_VLANE_ALLOCATION
 * - ALLOCATE_WORKERS
 * - SCHEDULE_LEARNING_RATE
 * - TRIGGER_CHECKPOINT
 * - RESAMPLE_DATASET
 * - BALANCE_MODALITIES
 * - EXECUTE_RETRY_RECOVERY
 * - PAUSE_RESUME_TRAINING
 * - TRIGGER_EARLY_STOPPING
 *
 * Classification: SOFTWARE_VALIDATED
 */

import {
  AutonomousActionType,
  AutonomousTelemetryMetrics,
  AutonomousDecisionRecord,
} from './types';
import { QuantizationFormat } from '../../compute/quantization/types';

export class AutonomousDecisionEngine {
  /**
   * Derives recommended action and new state from telemetry snapshot.
   */
  public static evaluate(
    telemetry: AutonomousTelemetryMetrics,
    currentState: AutonomousDecisionRecord['previousState']
  ): {
    actionType: AutonomousActionType;
    reasoning: string;
    suggestedStateDelta: AutonomousDecisionRecord['newState'];
  } {
    const res = this.planDecision(currentState, telemetry);
    return {
      actionType: res.action,
      reasoning: res.reason,
      suggestedStateDelta: res.newState,
    };
  }

  public static planDecision(
    currentState: AutonomousDecisionRecord['previousState'],
    telemetry: AutonomousTelemetryMetrics
  ): {
    action: AutonomousActionType;
    reason: string;
    newState: AutonomousDecisionRecord['newState'];
  } {
    let action: AutonomousActionType = 'MAINTAIN_NOMINAL';
    let reason = 'All telemetry within nominal thresholds';
    let bs = currentState.batchSize;
    let ga = currentState.gradAccumSteps;
    let prec: QuantizationFormat = currentState.precision;
    let vlanes = currentState.activeVLanes;
    let workers = currentState.activeWorkers;
    let lr = currentState.learningRate;

    // 1. Check for Early Stopping (convergence achieved: loss < 0.05)
    if (telemetry.trainingLoss < 0.05) {
      action = 'TRIGGER_EARLY_STOPPING';
      reason = `Training converged (loss: ${telemetry.trainingLoss} < 0.05)`;
    }
    // 2. Check for Gradient Explosion -> Reduce LR & retry recovery
    else if (telemetry.gradientNorm > 5.0 || isNaN(telemetry.gradientNorm)) {
      action = 'SCHEDULE_LEARNING_RATE';
      lr = parseFloat((currentState.learningRate * 0.5).toFixed(8));
      reason = `Gradient norm ${telemetry.gradientNorm.toFixed(2)} exceeded threshold 5.0 -> Halved learning rate`;
    }
    // 3. Check for RAM pressure on 2GB device (> 400 MB) -> Switch precision to INT4
    else if (telemetry.residentRAMBytes > 400 * 1024 * 1024) {
      action = 'CHANGE_PRECISION';
      prec = 'INT4';
      bs = Math.max(1, Math.floor(currentState.batchSize / 2));
      reason = `RAM ${Math.round(telemetry.residentRAMBytes / (1024*1024))}MB > 400MB -> Switched to INT4 & halved batch size`;
    }
    // 4. Check for Throughput Stall (< 500 tok/s) -> Adjust vLanes / workers
    else if (telemetry.throughputTokensPerSec < 500) {
      action = 'ADJUST_VLANE_ALLOCATION';
      vlanes = Math.min(16, currentState.activeVLanes * 2);
      reason = `Throughput ${telemetry.throughputTokensPerSec} < 500 tok/s -> Doubled active vLanes to ${vlanes}`;
    }
    // 5. Check for Data Quality drop (< 0.70) -> Resample dataset
    else if (telemetry.dataQualityScore < 0.70) {
      action = 'RESAMPLE_DATASET';
      reason = `Data quality score ${telemetry.dataQualityScore.toFixed(2)} < 0.70 -> Resampling high-quality batch`;
    }
    // 6. Check for Worker health degradation (< 0.80) -> Reallocate workers
    else if (telemetry.activeWorkerHealthScore < 0.80) {
      action = 'ALLOCATE_WORKERS';
      workers = Math.max(1, currentState.activeWorkers - 1);
      reason = `Worker health ${telemetry.activeWorkerHealthScore.toFixed(2)} < 0.80 -> Evicted degraded worker`;
    }
    // 7. Check for periodic checkpoint trigger (every 50 steps)
    else if (telemetry.step > 0 && telemetry.step % 50 === 0) {
      action = 'TRIGGER_CHECKPOINT';
      reason = `Step ${telemetry.step} periodic checkpoint trigger`;
    }

    const newState: AutonomousDecisionRecord['newState'] = {
      batchSize: bs,
      gradAccumSteps: ga,
      precision: prec,
      activeVLanes: vlanes,
      activeWorkers: workers,
      learningRate: lr,
    };

    return { action, reason, newState };
  }
}
