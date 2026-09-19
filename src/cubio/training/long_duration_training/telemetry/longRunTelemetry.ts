/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Long-Run Telemetry Aggregator
 *
 * Tracks cumulative metrics across long-duration training runs.
 *
 * Classification: REAL_MEASURED
 */

export class LongRunTelemetry {
  private peakRSS = 0;

  public updateRSS(rss: number): void {
    if (rss > this.peakRSS) {
      this.peakRSS = rss;
    }
  }

  public getPeakRSS(): number {
    return this.peakRSS;
  }
}
