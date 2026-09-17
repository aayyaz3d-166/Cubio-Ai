/**
 * 3D Memory Studio — Funnel 65
 * Runtime Visibility Manager
 */

import { RuntimeScreen } from '../types';

export class RuntimeVisibilityManager {
  private screen: RuntimeScreen = 'LANDING';

  public setScreen(screen: RuntimeScreen): void {
    this.screen = screen;
  }

  public get currentScreen(): RuntimeScreen {
    return this.screen;
  }

  public isLandingVisible(): boolean {
    return this.screen === 'LANDING';
  }

  public isStudioVisible(): boolean {
    return this.screen === 'STUDIO';
  }
}
