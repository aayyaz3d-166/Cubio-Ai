/**
 * 3D Memory Studio — Funnel 76
 * Landing Boot Adapter (F63/F74 Integration)
 */

import { LandingLifecycleManager } from '../../funnel74/lifecycle/landingLifecycleManager';

export class LandingBootAdapter {
  public async checkReadiness(manager?: LandingLifecycleManager): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeManager = manager ?? new LandingLifecycleManager();
      if (!activeManager.stateMachine.isActive()) {
        activeManager.createEngine();
        activeManager.initializeEngine();
      }
      const isAct = activeManager.stateMachine.isActive();
      return {
        ready: isAct,
        error: isAct ? undefined : 'Landing engine failed to reach ACTIVE state',
      };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Landing check failed' };
    }
  }
}
