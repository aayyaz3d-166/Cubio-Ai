/**
 * 3D Memory Studio — Funnel 73
 * Runtime Diagnostics Logger & Inspector
 */

import { BootPhase } from '../types';

export class RuntimeDiagnosticsLogger {
  private isEnabled: boolean;

  constructor(isEnabled: boolean = false) {
    this.isEnabled = isEnabled;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public logPhase(phase: BootPhase): void {
    if (this.isEnabled) {
      console.log(`[F73][BOOT] ${phase}`);
    }
  }

  public logError(phase: BootPhase, message: string): void {
    if (this.isEnabled) {
      console.error(`[F73][ERROR] phase=${phase} message=${message}`);
    }
  }
}
