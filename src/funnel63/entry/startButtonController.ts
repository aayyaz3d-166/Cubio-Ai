/**
 * 3D Memory Studio — Funnel 63
 * START Button Controller & State
 */

export type StartButtonState = 'IDLE' | 'HOVERED' | 'FOCUSED' | 'ACTIVE' | 'DISABLED';

export class StartButtonController {
  private state: StartButtonState = 'IDLE';
  private isEnabled = true;

  public setHovered(hovered: boolean): void {
    if (!this.isEnabled) return;
    if (this.state === 'ACTIVE') return;
    this.state = hovered ? 'HOVERED' : 'IDLE';
  }

  public setFocused(focused: boolean): void {
    if (!this.isEnabled) return;
    if (this.state === 'ACTIVE') return;
    this.state = focused ? 'FOCUSED' : 'IDLE';
  }

  public triggerActivation(): boolean {
    if (!this.isEnabled || this.state === 'ACTIVE' || this.state === 'DISABLED') {
      return false; // Prevent duplicate activations
    }
    this.state = 'ACTIVE';
    this.isEnabled = false;
    return true;
  }

  public reset(): void {
    this.state = 'IDLE';
    this.isEnabled = true;
  }

  public disable(): void {
    this.state = 'DISABLED';
    this.isEnabled = false;
  }

  public get currentState(): StartButtonState {
    return this.state;
  }

  public get active(): boolean {
    return this.state === 'ACTIVE';
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }
}
