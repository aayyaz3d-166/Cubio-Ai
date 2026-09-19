/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 54: Dynamic Hyperparameter Tuner
 *
 * Dynamically computes optimal adjustments for Learning Rate, Batch Size, and Quantization.
 */

import {
  TrainingAnomalyType,
  AutonomousTrainingAction,
} from './types';
import { QuantizationFormat } from '../../compute/quantization/types';

export class DynamicHyperparameterTuner {
  /**
   * Derives recommended action and hyperparameter values.
   */
  public static planAdjustment(
    anomaly: TrainingAnomalyType,
    currentLR: number,
    currentBatchSize: number,
    currentPrecision: QuantizationFormat
  ): {
    action: AutonomousTrainingAction;
    adjustedLR: number;
    adjustedBatchSize: number;
    adjustedPrecision: QuantizationFormat;
  } {
    let action: AutonomousTrainingAction = 'NO_ACTION';
    let lr = currentLR;
    let bs = currentBatchSize;
    let prec = currentPrecision;

    switch (anomaly) {
      case 'GRADIENT_EXPLOSION':
        action = 'REDUCE_LEARNING_RATE';
        lr = parseFloat((currentLR * 0.5).toFixed(8));
        break;
      case 'LOSS_DIVERGENCE':
        action = 'RESTART_LAST_STABLE_CHECKPOINT';
        lr = parseFloat((currentLR * 0.25).toFixed(8));
        break;
      case 'RAM_PRESSURE_WARNING':
        action = 'SWITCH_PRECISION_INT4';
        prec = 'INT4';
        bs = Math.max(1, Math.floor(currentBatchSize / 2));
        break;
      case 'THROUGHPUT_STALL':
        action = 'DECREASE_BATCH_SIZE';
        bs = Math.max(1, currentBatchSize - 1);
        break;
      case 'HEALTHY':
        // If healthy, opportunistically increase batch size or checkpoint
        action = 'NO_ACTION';
        break;
    }

    return {
      action,
      adjustedLR: lr,
      adjustedBatchSize: bs,
      adjustedPrecision: prec,
    };
  }
}
