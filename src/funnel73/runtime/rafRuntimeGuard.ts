/**
 * 3D Memory Studio — Funnel 73
 * RAF Runtime Guard
 *
 * Enforces single animation loop authority (F55) and prevents duplicate requestAnimationFrame loops.
 */

export class RafRuntimeGuard {
  private activeRafCount = 0;

  public verifySingleLoop(): { success: boolean; error?: string } {
    if (this.activeRafCount > 1) {
      return {
        success: false,
        error: `Multiple active animation loops detected (${this.activeRafCount}). F55 is the sole RAF authority.`,
      };
    }
    return { success: true };
  }

  public registerLoop(): void {
    this.activeRafCount++;
  }

  public unregisterLoop(): void {
    if (this.activeRafCount > 0) {
      this.activeRafCount--;
    }
  }
}
