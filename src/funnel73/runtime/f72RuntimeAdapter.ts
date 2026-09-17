/**
 * 3D Memory Studio — Funnel 73
 * F72 Runtime Adapter
 *
 * Inspects and invokes F72 StudioBootManager runtime activation.
 */

import { StudioBootManager } from '../../funnel72/boot/studioBootManager';

export class F72RuntimeAdapter {
  private bootManager: StudioBootManager;

  constructor(bootManager?: StudioBootManager) {
    this.bootManager = bootManager ?? new StudioBootManager();
  }

  public async activateF72(): Promise<{ success: boolean; isDegraded: boolean; error?: string }> {
    try {
      const readyState = await this.bootManager.start();
      if (readyState.isFailed) {
        return {
          success: false,
          isDegraded: false,
          error: `F72 failed on stages: ${readyState.failedStages.join(', ')}`,
        };
      }
      return {
        success: true,
        isDegraded: readyState.isDegraded,
      };
    } catch (err: any) {
      return {
        success: false,
        isDegraded: false,
        error: err?.message || 'F72 activation failed.',
      };
    }
  }

  public getBootManager(): StudioBootManager {
    return this.bootManager;
  }
}
