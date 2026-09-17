/**
 * 3D Memory Studio — Funnel 55
 * Controlled Real-Time Render Loop
 *
 * Single RAF loop with universal Node/Browser compatibility, safe delta clamping,
 * and leak-free cancellation.
 */

const safeRaf =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (cb: (t: number) => void) =>
        (setTimeout(() => cb(performance.now()), 16) as unknown as number);

const safeCaf =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);

export class RendererLoop {
  private rafId: number | null = null;
  private running = false;
  private paused = false;
  private lastTime = 0;
  private elapsedTimeMs = 0;
  private tickCallback: ((deltaMs: number, timeMs: number) => void) | null = null;

  public start(onTick: (deltaMs: number, timeMs: number) => void): void {
    if (this.running) return;

    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.tickCallback = onTick;

    const loop = (currentTime: number) => {
      if (!this.running) return;

      if (!this.paused) {
        const rawDelta = currentTime - this.lastTime;
        // Clamp delta to prevent browser tab sleep jumps (max 50ms)
        const deltaMs = Math.min(50, Math.max(1, rawDelta));
        this.elapsedTimeMs += deltaMs;
        this.lastTime = currentTime;

        if (this.tickCallback) {
          try {
            this.tickCallback(deltaMs, this.elapsedTimeMs);
          } catch {
            // Guard against uncaught tick errors crashing RAF
          }
        }
      } else {
        this.lastTime = currentTime;
      }

      this.rafId = safeRaf(loop);
    };

    this.rafId = safeRaf(loop);
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
    }
  }

  public stop(): void {
    this.running = false;
    this.paused = false;
    if (this.rafId !== null) {
      safeCaf(this.rafId);
      this.rafId = null;
    }
    this.tickCallback = null;
  }

  public get isRunning(): boolean {
    return this.running;
  }

  public get isPaused(): boolean {
    return this.paused;
  }

  public get elapsedMs(): number {
    return this.elapsedTimeMs;
  }
}
