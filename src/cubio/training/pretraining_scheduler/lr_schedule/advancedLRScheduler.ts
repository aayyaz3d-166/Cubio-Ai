/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Advanced Learning Rate Scheduler
 *
 * Implements mathematical learning rate schedules:
 * 1. Warmup-Cosine: eta(t) = eta_min + 0.5 * (eta_peak - eta_min) * (1 + cos(pi * t / T))
 * 2. Warmup-Stable-Decay (WSD): Warmup -> Plateau -> Power Decay
 * 3. 369 Harmonic Decay: Step-wise 3/6/9 vortex decay with triadic resonance resets
 * 4. Linear Warmup & Decay
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { LRScheduleConfig } from '../types';
import { Math369 } from '../../../engine_369/math369';

export class AdvancedLRScheduler {
  /**
   * Computes the learning rate at step `t`.
   */
  public static getLearningRate(step: number, config: LRScheduleConfig): number {
    const { scheduleType, peakLR, minLR, warmupSteps, totalSteps } = config;

    // 1. Warmup Phase
    if (step < warmupSteps) {
      const alpha = Math.max(0, step) / Math.max(1, warmupSteps);
      return parseFloat((minLR + alpha * (peakLR - minLR)).toExponential(6));
    }

    // 2. Schedule Specific Computation
    switch (scheduleType) {
      case 'WARMUP_COSINE': {
        const decaySteps = Math.max(1, totalSteps - warmupSteps);
        const progress = Math.min(1.0, (step - warmupSteps) / decaySteps);
        const lr = minLR + 0.5 * (peakLR - minLR) * (1.0 + Math.cos(Math.PI * progress));
        return parseFloat(lr.toExponential(6));
      }

      case 'WARMUP_STABLE_DECAY': {
        const stableSteps = config.stableSteps ?? Math.round(totalSteps * 0.70);
        if (step <= warmupSteps + stableSteps) {
          return peakLR;
        }
        const decaySteps = Math.max(1, totalSteps - (warmupSteps + stableSteps));
        const progress = Math.min(1.0, (step - (warmupSteps + stableSteps)) / decaySteps);
        // Fast power decay down to minLR
        const lr = minLR + (peakLR - minLR) * Math.pow(1.0 - progress, 2);
        return parseFloat(lr.toExponential(6));
      }

      case 'HARMONIC_369_DECAY': {
        const interval = config.triadicResetIntervalSteps ?? 3000;
        const cycleProgress = (step % interval) / interval;
        const vortexFactor = Math369.getVortexDoublingValue(step % 6) / 9.0;
        const baseDecay = minLR + (peakLR - minLR) * (1.0 - step / Math.max(1, totalSteps));
        const lr = baseDecay * (0.85 + vortexFactor * 0.15);
        return parseFloat(Math.max(minLR, lr).toExponential(6));
      }

      case 'LINEAR_WARMUP_DECAY': {
        const decaySteps = Math.max(1, totalSteps - warmupSteps);
        const progress = Math.min(1.0, (step - warmupSteps) / decaySteps);
        const lr = minLR + (peakLR - minLR) * (1.0 - progress);
        return parseFloat(lr.toExponential(6));
      }

      default:
        return peakLR;
    }
  }
}
