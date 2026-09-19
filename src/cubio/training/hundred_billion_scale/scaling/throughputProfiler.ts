/**
 * CubiO — Step 86 Throughput Profiler
 */

export class ThroughputProfiler {
  public static computeThroughput(totalTokens: number, elapsedMs: number, worldSize = 6): {
    globalTokensPerSec: number;
    perNodeTokensPerSec: number;
  } {
    const elapsedSec = Math.max(0.001, elapsedMs / 1000);
    const globalTokensPerSec = parseFloat((totalTokens / elapsedSec).toFixed(2));
    const perNodeTokensPerSec = parseFloat((globalTokensPerSec / worldSize).toFixed(2));

    return {
      globalTokensPerSec,
      perNodeTokensPerSec,
    };
  }
}
