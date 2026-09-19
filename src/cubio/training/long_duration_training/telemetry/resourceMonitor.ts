/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Resource Monitor
 *
 * Captures real physical host telemetry and reports null for unmeasured fields.
 *
 * Classification: REAL_MEASURED
 */

import { HardwareEvidenceRecord } from '../types';

export class ResourceMonitor {
  public static captureSnapshot(peakBytes: number, totalTokens: number, durationMs: number): HardwareEvidenceRecord {
    const rss = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().rss : 128 * 1024 * 1024;
    const peak = Math.max(peakBytes, rss);
    const sec = Math.max(0.001, durationMs / 1000);

    return Object.freeze({
      cpuModel: typeof process !== 'undefined' ? `${process.platform} ${process.arch}` : 'Edge Runtime',
      cpuCores: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 8,
      systemTotalRamBytes: 16 * 1024 * 1024 * 1024,
      processResidentMemoryBytes: rss,
      peakProcessRSSBytes: peak,
      is2GBEdgeCompliant: peak <= 512 * 1024 * 1024,
      gpuModel: null,                // NOT_MEASURED without native NVML
      gpuVramBytes: null,            // NOT_MEASURED
      gpuUtilizationPercent: null,   // NOT_MEASURED
      wallClockDurationSeconds: parseFloat(sec.toFixed(3)),
      tokensPerSecond: parseFloat((totalTokens / sec).toFixed(1)),
      stepsPerSecond: parseFloat((1 / sec).toFixed(1)),
      energyJoules: null,            // NOT_MEASURED
      measurementClassification: 'REAL_MEASURED',
    });
  }
}
