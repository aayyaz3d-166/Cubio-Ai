/**
 * CubiO — Step 87 Inference Telemetry
 */

import { InferenceMetrics } from '../types';

export class InferenceTelemetry {
  private static totalRequests = 0;
  private static totalLatencySum = 0;
  private static fallbackCount = 0;

  public static recordRequest(metrics: InferenceMetrics, wasFallback = false): void {
    this.totalRequests += 1;
    this.totalLatencySum += metrics.totalLatencyMs;
    if (wasFallback) {
      this.fallbackCount += 1;
    }
  }

  public static getStats(): {
    totalRequests: number;
    avgLatencyMs: number;
    fallbackCount: number;
  } {
    return {
      totalRequests: this.totalRequests,
      avgLatencyMs: this.totalRequests > 0 ? parseFloat((this.totalLatencySum / this.totalRequests).toFixed(2)) : 0,
      fallbackCount: this.fallbackCount,
    };
  }
}
