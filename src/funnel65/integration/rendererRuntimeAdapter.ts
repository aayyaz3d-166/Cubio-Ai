/**
 * 3D Memory Studio — Funnel 65
 * Renderer Runtime Adapter
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';

export class RendererRuntimeAdapter {
  constructor(public readonly rendererHost: MemoryRendererHost) {}

  public isRendererValid(): boolean {
    return this.rendererHost !== undefined && this.rendererHost.capabilities !== undefined;
  }

  public getQuality(): string {
    return this.rendererHost.capabilities.recommendedQuality;
  }
}
