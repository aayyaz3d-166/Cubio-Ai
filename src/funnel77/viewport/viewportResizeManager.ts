/**
 * 3D Memory Studio — Funnel 77
 * Viewport Resize Manager
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';

export interface ViewportDimensions {
  readonly width: number;
  readonly height: number;
}

export class ViewportResizeManager {
  private currentDimensions: ViewportDimensions = { width: 800, height: 600 };

  public resize(
    width: number,
    height: number,
    host?: MemoryRendererHost | null,
    camera?: CameraEngine | null
  ): void {
    const validWidth = Math.max(10, Math.floor(width));
    const validHeight = Math.max(10, Math.floor(height));

    this.currentDimensions = { width: validWidth, height: validHeight };

    if (host && !(host as any).isDisposed) {
      host.resize(validWidth, validHeight);
    }
  }

  public getDimensions(): ViewportDimensions {
    return this.currentDimensions;
  }
}
