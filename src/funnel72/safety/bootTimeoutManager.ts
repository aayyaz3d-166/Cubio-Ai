/**
 * 3D Memory Studio — Funnel 72
 * Boot Timeout Manager
 *
 * Enforces strict per-stage timeouts so that the Studio never hangs in an infinite loading state.
 */

export class BootTimeoutManager {
  public async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    stageName: string
  ): Promise<T> {
    let timerId: any;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`Stage "${stageName}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }
}
