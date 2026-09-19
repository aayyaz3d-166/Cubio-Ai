/**
 * CubiO — Step 85 Distributed Communication Profiler
 * Profiles inter-node transfer bytes, network latency, bandwidth, and compute-overlap ratios.
 */

import { CommunicationProfileEntry } from '../types';

export class CommunicationProfiler {
  private readonly entries: CommunicationProfileEntry[] = [];

  public recordTransfer(
    step: number,
    phase: 'ALL_REDUCE' | 'REDUCE_SCATTER' | 'ALL_GATHER' | 'BARRIER',
    durationMs: number,
    transferredBytes: number,
    overlapWithComputeRatio = 0.85
  ): CommunicationProfileEntry {
    const bandwidthMBps = durationMs > 0 ? (transferredBytes / (1024 * 1024)) / (durationMs / 1000) : 0;

    const entry: CommunicationProfileEntry = Object.freeze({
      step,
      phase,
      durationMs,
      transferredBytes,
      bandwidthMBps: Math.min(25000, bandwidthMBps), // bounded realistic network bandwidth (e.g. 200Gbps InfiniBand)
      overlapWithComputeRatio,
    });

    this.entries.push(entry);
    return entry;
  }

  public getHistory(): readonly CommunicationProfileEntry[] {
    return Object.freeze([...this.entries]);
  }

  public computeTotalTransferredBytes(): number {
    return this.entries.reduce((acc, e) => acc + e.transferredBytes, 0);
  }

  public computeAverageBandwidthMBps(): number {
    if (this.entries.length === 0) return 0;
    const sum = this.entries.reduce((acc, e) => acc + e.bandwidthMBps, 0);
    return sum / this.entries.length;
  }
}
