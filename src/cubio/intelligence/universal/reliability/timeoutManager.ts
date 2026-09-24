/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Timeout Manager
 *
 * Implements strict per-operation execution deadlines.
 */

export class TimeoutManager {
  public async withTimeout<T>(
    promiseFn: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'Operation'
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`TIMEOUT: ${operationName} exceeded execution deadline of ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promiseFn(), timeoutPromise]);
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
