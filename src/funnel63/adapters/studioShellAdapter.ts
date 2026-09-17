/**
 * 3D Memory Studio — Funnel 63
 * Studio Shell Adapter
 *
 * Connects F63 Landing Entry completion to the F62 Studio Shell.
 */

import { StudioCoordinator } from '../../funnel62/integration/studioCoordinator';

export class StudioShellAdapter {
  public notifyEntryComplete(coordinator: StudioCoordinator): void {
    coordinator.sessionState.currentScreen = 'STUDIO';
    coordinator.sessionState.isTransitioning = false;
  }
}
