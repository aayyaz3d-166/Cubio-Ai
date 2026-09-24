/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F79: Chaos Fault Injector
 *
 * Simulates real-world chaotic network drops, provider outages, worker timeouts, and aborts.
 */

import { ChaosInjectionMode } from './types';

export class ChaosFaultInjector {
  public async executeUnderChaos<T>(
    mode: ChaosInjectionMode,
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<{ result: T; faultInjected: boolean; wasContained: boolean }> {
    if (mode === 'NONE') {
      const result = await operation();
      return { result, faultInjected: false, wasContained: true };
    }

    // Inject simulated live fault
    try {
      if (mode === 'PROVIDER_CRASH') {
        throw new Error('CHAOS_FAULT: Upstream provider terminated socket abruptly (503 Service Unavailable)');
      }
      if (mode === 'TOOL_PERMISSION_DENY') {
        throw new Error('CHAOS_FAULT: Filesystem mutation rejected: Operation not permitted (EPERM)');
      }
      if (mode === 'WORKER_TIMEOUT') {
        throw new Error('CHAOS_FAULT: Agent worker thread unresponsive: Execution deadline exceeded');
      }
      if (mode === 'SOCKET_DROP') {
        throw new Error('CHAOS_FAULT: ECONNRESET: Connection reset by peer');
      }
      if (mode === 'ABORT_SIGNAL') {
        throw new Error('CHAOS_FAULT: Operation cancelled by sovereign human operator');
      }

      const result = await operation();
      return { result, faultInjected: false, wasContained: true };
    } catch {
      // Execute Sovereign Fallback / Containment
      const result = await fallback();
      return { result, faultInjected: true, wasContained: true };
    }
  }
}
