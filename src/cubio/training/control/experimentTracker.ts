/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Experiment Tracker
 *
 * Groups training runs into experiments, tracks loss curves, token counts,
 * and performs side-by-side experiment comparisons.
 */

import {
  ExperimentEntry,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class ControlExperimentTracker {
  private experiments: Map<string, ExperimentEntry> = new Map();

  /**
   * Registers a new experiment tracking record.
   */
  public registerExperiment(
    experimentName: string,
    jobIds: readonly string[],
    bestLoss = 0.05,
    bestAccuracy = 0.94,
    totalTrainedTokens = 500000
  ): ExperimentEntry {
    const expHash = deterministicHash(`EXP:${experimentName}:${jobIds.join(',')}`);
    const entry: ExperimentEntry = Object.freeze({
      experimentId: `EXP_${expHash.slice(2, 10)}`,
      experimentName,
      jobIds: Object.freeze([...jobIds]),
      bestLoss,
      bestAccuracy,
      totalTrainedTokens,
      createdTimestamp: Date.now(),
    });

    this.experiments.set(entry.experimentId, entry);
    return entry;
  }

  public getExperiment(experimentId: string): ExperimentEntry | undefined {
    return this.experiments.get(experimentId);
  }

  public compareExperiments(expIdA: string, expIdB: string): {
    winnerId: string;
    lossDelta: number;
    accuracyDelta: number;
  } {
    const a = this.experiments.get(expIdA);
    const b = this.experiments.get(expIdB);
    if (!a || !b) {
      throw new Error(`Invalid experiment IDs for comparison: ${expIdA}, ${expIdB}`);
    }

    const lossDelta = parseFloat((a.bestLoss - b.bestLoss).toFixed(4));
    const accDelta = parseFloat((a.bestAccuracy - b.bestAccuracy).toFixed(4));
    const winnerId = a.bestLoss <= b.bestLoss ? a.experimentId : b.experimentId;

    return {
      winnerId,
      lossDelta,
      accuracyDelta: accDelta,
    };
  }

  public getAllExperiments(): readonly ExperimentEntry[] {
    return Object.freeze(Array.from(this.experiments.values()));
  }

  public reset(): void {
    this.experiments.clear();
  }
}
