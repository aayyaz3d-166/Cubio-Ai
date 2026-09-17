/**
 * 3D Memory Studio — Funnel 76
 * Runtime Boot Adapter (F72 Integration)
 */

import { StudioBootManager as F72BootManager } from '../../funnel72/boot/studioBootManager';

export class RuntimeBootAdapter {
  public async checkReadiness(f72Manager?: F72BootManager): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeManager = f72Manager ?? new F72BootManager();
      if (activeManager.getBootState() !== 'READY') {
        await activeManager.start();
      }
      const isOk = activeManager.getReadyState().isReady;
      return {
        ready: isOk,
        error: isOk ? undefined : 'F72 Runtime activation failed',
      };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Runtime check failed' };
    }
  }
}
