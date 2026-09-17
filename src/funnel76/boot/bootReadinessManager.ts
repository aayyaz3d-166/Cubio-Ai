/**
 * 3D Memory Studio — Funnel 76
 * Boot Readiness Manager
 *
 * Verifies that all required dependencies are ready before permitting READY / ACTIVE transitions.
 */

import { BootDependencyManager } from './bootDependencyManager';

export class BootReadinessManager {
  public verifyReadiness(dependencyManager: BootDependencyManager): { ready: boolean; error?: string } {
    if (!dependencyManager.areRequiredDependenciesReady()) {
      const failed = dependencyManager.getFailedDependency();
      if (failed) {
        return {
          ready: false,
          error: `Required dependency '${failed.label}' (${failed.id}) failed: ${failed.error || 'Unknown error'}`,
        };
      }
      return {
        ready: false,
        error: 'Not all required boot dependencies have completed readiness checks.',
      };
    }

    return { ready: true };
  }
}
