/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 54: Training Anomaly Detector
 *
 * Evaluates real-time loss, gradients, RAM, and throughput to detect instabilities.
 */

import {
  TrainingAnomalyType,
  TrainingHealthTelemetry,
} from './types';

export class TrainingAnomalyDetector {
  private lossHistory: number[] = [];

  /**
   * Detects anomalies from a single step's telemetry.
   */
  public detect(telemetry: TrainingHealthTelemetry): { anomaly: TrainingAnomalyType; reason: string } {
    this.lossHistory.push(telemetry.loss);

    // 1. Check for gradient explosion
    if (telemetry.gradNorm > 5.0 || isNaN(telemetry.gradNorm) || !isFinite(telemetry.gradNorm)) {
      return {
        anomaly: 'GRADIENT_EXPLOSION',
        reason: `Gradient norm exceeded safe threshold: ${telemetry.gradNorm.toFixed(4)}`,
      };
    }

    // 2. Check for RAM pressure on 2GB device
    if (telemetry.residentRAMBytes > 400 * 1024 * 1024) {
      return {
        anomaly: 'RAM_PRESSURE_WARNING',
        reason: `Resident RAM (${(telemetry.residentRAMBytes / (1024 * 1024)).toFixed(1)} MB) approaching 512 MB ceiling`,
      };
    }

    // 3. Check for sudden loss explosion / divergence
    if (this.lossHistory.length >= 3) {
      const prevLoss = this.lossHistory[this.lossHistory.length - 2];
      if (telemetry.loss > prevLoss * 2.5 && telemetry.loss > 0.5) {
        return {
          anomaly: 'LOSS_DIVERGENCE',
          reason: `Loss spiked from ${prevLoss.toFixed(4)} to ${telemetry.loss.toFixed(4)}`,
        };
      }
    }

    // 4. Check for throughput stall
    if (telemetry.tokensPerSecond < 10) {
      return {
        anomaly: 'THROUGHPUT_STALL',
        reason: `Throughput stalled below 10 tokens/sec (${telemetry.tokensPerSecond.toFixed(1)} tokens/sec)`,
      };
    }

    return {
      anomaly: 'HEALTHY',
      reason: 'All telemetry within nominal operating bounds',
    };
  }

  public reset(): void {
    this.lossHistory = [];
  }
}
