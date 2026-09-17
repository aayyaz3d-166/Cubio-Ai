/**
 * 3D Memory Studio — Funnel 73
 * Boot Timeout Manager
 *
 * Enforces per-phase (<= 10s) and global (<= 30s) timeouts to guarantee
 * the application never hangs indefinitely in a loading state.
 */

import { BootPhase } from '../types';
import { DEFAULT_PHASE_TIMEOUT_MS, DEFAULT_GLOBAL_TIMEOUT_MS } from './bootPhase';

export class BootTimeoutManager {
  public async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = DEFAULT_PHASE_TIMEOUT_MS,
    phaseName: BootPhase | string = 'UNKNOWN'
  ): Promise<T> {
    let timerId: any;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(
          new Error(
            `Boot phase "${phaseName}" timed out after ${(timeoutMs / 1000).toFixed(1)}s.`
          )
        );
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

  public getGlobalTimeoutMs(): number {
    return DEFAULT_GLOBAL_TIMEOUT_MS;
  }
}
