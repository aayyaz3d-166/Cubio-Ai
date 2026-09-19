/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 48: Master Training Ledger
 *
 * Appends immutable step records, tracking training/validation loss,
 * gradient norms, token throughput, and real physical memory footprints.
 */

import {
  TrainingLedgerEntry,
  TrainingPhaseType,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class MasterTrainingLedger {
  private entries: TrainingLedgerEntry[] = [];

  /**
   * Appends a training step entry to the immutable ledger.
   */
  public recordStep(
    runId: string,
    epoch: number,
    phase: TrainingPhaseType,
    trainLoss: number,
    valLoss: number,
    gradientNorm: number,
    learningRate: number,
    throughputSamplesPerSec: number,
    tokensPerSec: number,
    syncLatencyMs: number,
    residentRamBytes: number,
    isSyntheticData = false
  ): TrainingLedgerEntry {
    const stepIndex = this.entries.length + 1;
    const stepHash = deterministicHash(
      `STEP:${runId}:${epoch}:${phase}:${stepIndex}:${trainLoss}:${valLoss}:${gradientNorm}`
    );

    const entry: TrainingLedgerEntry = Object.freeze({
      stepId: `STEP_${stepHash.slice(2, 10)}`,
      runId,
      epoch,
      phase,
      trainLoss,
      valLoss,
      gradientNorm,
      learningRate,
      throughputSamplesPerSec,
      tokensPerSec,
      syncLatencyMs,
      residentRamBytes,
      isSyntheticData,
      checksum: `0x${stepHash}`,
      timestamp: Date.now(),
    });

    this.entries.push(entry);
    return entry;
  }

  public getEntries(): readonly TrainingLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  public getEntriesForPhase(phase: TrainingPhaseType): readonly TrainingLedgerEntry[] {
    return Object.freeze([...this.entries.filter((e) => e.phase === phase)]);
  }

  public reset(): void {
    this.entries = [];
  }
}
