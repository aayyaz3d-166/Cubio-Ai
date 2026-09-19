/**
 * CubiO — Step 86 Memory Scale Profiler
 */

export class MemoryScaleProfiler {
  public static measureMemory(worldSize = 6): {
    perNodeRssBytes: number;
    aggregateRssBytes: number;
    heapUsedBytes: number;
  } {
    let rss = 64 * 1024 * 1024;
    let heap = 32 * 1024 * 1024;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      rss = mem.rss;
      heap = mem.heapUsed;
    }

    return {
      perNodeRssBytes: rss,
      aggregateRssBytes: rss * worldSize,
      heapUsedBytes: heap,
    };
  }
}
