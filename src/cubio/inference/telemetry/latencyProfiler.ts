/**
 * CubiO — Step 87 Latency Profiler
 */

export class LatencyProfiler {
  private startTime = 0;
  private firstTokenTime = 0;
  private tokenTimestamps: number[] = [];

  public start(): void {
    this.startTime = performance.now();
    this.tokenTimestamps = [];
  }

  public recordToken(): void {
    const now = performance.now();
    if (this.tokenTimestamps.length === 0) {
      this.firstTokenTime = now;
    }
    this.tokenTimestamps.push(now);
  }

  public getSummary(): {
    ttftMs: number;
    totalMs: number;
    avgItlMs: number;
  } {
    const totalMs = Math.max(1, performance.now() - this.startTime);
    const ttftMs = this.firstTokenTime > 0 ? this.firstTokenTime - this.startTime : totalMs;
    const tokenCount = this.tokenTimestamps.length;
    const genDuration = Math.max(1, totalMs - ttftMs);
    const avgItlMs = parseFloat((genDuration / Math.max(1, tokenCount)).toFixed(2));

    return {
      ttftMs: parseFloat(ttftMs.toFixed(2)),
      totalMs: parseFloat(totalMs.toFixed(2)),
      avgItlMs,
    };
  }
}
