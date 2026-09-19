/**
 * CubiO — Step 86 Communication Profiler
 */

import { CommunicationProfileEntry } from '../types';

export class CommunicationProfiler {
  private readonly entries: CommunicationProfileEntry[] = [];

  public recordProfile(
    step: number,
    phase: 'ALL_REDUCE' | 'REDUCE_SCATTER' | 'ALL_GATHER' | 'BARRIER',
    durationMs: number,
    transferredBytes: number
  ): CommunicationProfileEntry {
    const bandwidthMBps = parseFloat(((transferredBytes / (1024 * 1024)) / Math.max(0.001, durationMs / 1000)).toFixed(2));
    const entry: CommunicationProfileEntry = Object.freeze({
      step,
      phase,
      durationMs,
      transferredBytes,
      bandwidthMBps,
      overlapWithComputeRatio: 0.85,
    });
    this.entries.push(entry);
    return entry;
  }

  public getProfiles(): readonly CommunicationProfileEntry[] {
    return Object.freeze([...this.entries]);
  }
}
