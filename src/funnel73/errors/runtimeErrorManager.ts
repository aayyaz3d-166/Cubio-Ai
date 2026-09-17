/**
 * 3D Memory Studio — Funnel 73
 * Runtime Error Manager
 */

export interface CapturedRuntimeError {
  component?: string;
  phase?: string;
  message: string;
  timestamp: number;
}

export class RuntimeErrorManager {
  private lastError: CapturedRuntimeError | null = null;

  public captureError(error: Error, info?: any): CapturedRuntimeError {
    const captured: CapturedRuntimeError = {
      message: error.message || 'Unknown React Runtime Exception',
      component: info?.componentStack ? info.componentStack.split('\n')[1]?.trim() : 'StudioComponent',
      timestamp: Date.now(),
    };
    this.lastError = captured;
    return captured;
  }

  public getLastError(): CapturedRuntimeError | null {
    return this.lastError;
  }

  public clear(): void {
    this.lastError = null;
  }
}
