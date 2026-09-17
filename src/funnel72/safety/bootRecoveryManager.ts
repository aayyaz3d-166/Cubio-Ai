/**
 * 3D Memory Studio — Funnel 72
 * Boot Recovery Manager
 *
 * Cleans up failed resources and resets state prior to retries.
 * Enforces singleton resource integrity (no second renderer, scene, camera, RAF).
 */

import { StudioBootContext } from '../boot/bootContext';

export class BootRecoveryManager {
  public async prepareForRetry(context: StudioBootContext): Promise<void> {
    // Reset state flags without destroying authoritative singleton canvas/RAF
    context.resetTransientStates();
  }

  public async cleanupOnFailure(context: StudioBootContext): Promise<void> {
    context.resetTransientStates();
  }
}
