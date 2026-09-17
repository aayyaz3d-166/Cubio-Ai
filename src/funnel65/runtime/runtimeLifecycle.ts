/**
 * 3D Memory Studio — Funnel 65
 * Runtime Lifecycle & Duplicate Prevention Manager
 */

export class RuntimeLifecycleManager {
  private initialized = false;
  private canvasCount = 0;
  private rafCount = 0;
  private rendererInstanceCount = 0;

  public initialize(): boolean {
    if (this.initialized) {
      return false; // Idempotent: duplicate initialization rejected
    }
    this.initialized = true;
    this.rendererInstanceCount = 1;
    this.rafCount = 1; // F55 is the sole RAF owner
    return true;
  }

  public registerCanvas(canvas: HTMLCanvasElement): boolean {
    if (!canvas) return false;
    this.canvasCount++;
    return true;
  }

  public unregisterCanvas(): void {
    this.canvasCount = Math.max(0, this.canvasCount - 1);
  }

  public dispose(): void {
    this.initialized = false;
    this.canvasCount = 0;
    this.rafCount = 0;
    this.rendererInstanceCount = 0;
  }

  public get isReady(): boolean {
    return this.initialized;
  }

  public get activeCanvasCount(): number {
    return this.canvasCount;
  }

  public get activeRafCount(): number {
    return this.rafCount;
  }

  public get activeRendererCount(): number {
    return this.rendererInstanceCount;
  }
}
