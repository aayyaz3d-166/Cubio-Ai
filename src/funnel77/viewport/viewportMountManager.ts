/**
 * 3D Memory Studio — Funnel 77
 * Viewport Mount Manager
 *
 * Coordinates canvas attachment with F55 renderer host.
 * Guarantees zero duplicate attachments and handles safe detachment.
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';

export class ViewportMountManager {
  private attachedCanvas: HTMLCanvasElement | null = null;
  private attachedHost: MemoryRendererHost | null = null;

  public attachCanvas(canvas: HTMLCanvasElement, host: MemoryRendererHost): boolean {
    if (this.attachedCanvas === canvas && this.attachedHost === host) {
      return true; // Idempotent
    }

    if (this.attachedCanvas && this.attachedCanvas !== canvas) {
      this.detachCanvas();
    }

    if ((host as any).isDisposed) {
      return false;
    }

    host.attach(canvas);
    host.start();

    this.attachedCanvas = canvas;
    this.attachedHost = host;
    return true;
  }

  public detachCanvas(): void {
    if (this.attachedHost) {
      try {
        this.attachedHost.pause();
      } catch {
        // Safe disposal
      }
    }
    this.attachedCanvas = null;
    this.attachedHost = null;
  }

  public isAttached(): boolean {
    return this.attachedCanvas !== null && this.attachedHost !== null;
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.attachedCanvas;
  }

  public getHost(): MemoryRendererHost | null {
    return this.attachedHost;
  }
}
