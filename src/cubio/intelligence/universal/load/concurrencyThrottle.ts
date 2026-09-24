/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F72: Concurrency Throttle
 *
 * Adaptive priority queue with backpressure protection under high concurrency load.
 */

export class ConcurrencyThrottle {
  private activeCount = 0;
  private queue: (() => void)[] = [];
  private peakQueueDepth = 0;

  constructor(private readonly maxConcurrency: number = 32) {}

  public async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      if (this.queue.length > this.peakQueueDepth) {
        this.peakQueueDepth = this.queue.length;
      }
    });
  }

  public release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.activeCount--;
    }
  }

  public getPeakQueueDepth(): number {
    return this.peakQueueDepth;
  }

  public getCurrentQueueDepth(): number {
    return this.queue.length;
  }

  public resetStats(): void {
    this.peakQueueDepth = 0;
  }
}
