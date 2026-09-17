/**
 * 3D Memory Studio — Funnel 76
 * Boot Timeout Manager
 *
 * Enforces per-dependency (<= 10s) and global (<= 30s) timeouts to guarantee
 * no infinite spinner or silent hanging.
 */

export const DEFAULT_DEP_TIMEOUT_MS = 10000;
export const DEFAULT_GLOBAL_TIMEOUT_MS = 30000;

export class BootTimeoutManager {
  public async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = DEFAULT_DEP_TIMEOUT_MS,
    errorMessage: string = 'Operation timed out.'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(errorMessage));
        }
      }, timeoutMs);

      operation()
        .then((result) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(result);
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}
