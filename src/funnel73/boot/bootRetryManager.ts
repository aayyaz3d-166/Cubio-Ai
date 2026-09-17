/**
 * 3D Memory Studio — Funnel 73
 * Boot Retry Manager
 *
 * Coordinates automatic (<= 2) and manual retry attempts safely.
 */

export const MAX_AUTOMATIC_RETRIES = 2;

export class BootRetryManager {
  private retryCount = 0;
  private isRetrying = false;

  public getRetryCount(): number {
    return this.retryCount;
  }

  public canRetryAuto(): boolean {
    return this.retryCount < MAX_AUTOMATIC_RETRIES;
  }

  public beginRetry(): boolean {
    if (this.isRetrying) return false;
    this.isRetrying = true;
    this.retryCount++;
    return true;
  }

  public finishRetry(): void {
    this.isRetrying = false;
  }

  public reset(): void {
    this.retryCount = 0;
    this.isRetrying = false;
  }
}
