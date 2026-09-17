/**
 * 3D Memory Studio — Funnel 76
 * Renderer Boot Adapter (F55 Integration)
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';

export class RendererBootAdapter {
  public async checkReadiness(host?: MemoryRendererHost): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeHost = host ?? new MemoryRendererHost();
      activeHost.initialize();
      return { ready: true };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Renderer check failed' };
    }
  }
}
