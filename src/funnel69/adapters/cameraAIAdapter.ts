/**
 * 3D Memory Studio — Funnel 69
 * Camera AI Adapter (F61 Integration)
 */

import { CameraCoordinateAdapter } from '../../funnel68/adapters/cameraCoordinateAdapter';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';

export class CameraAIAdapter {
  private readonly cameraCoordAdapter: CameraCoordinateAdapter;

  constructor(cameraEngine?: CameraEngine) {
    this.cameraCoordAdapter = new CameraCoordinateAdapter(cameraEngine);
  }

  public focusState(
    stateId: string,
    position: readonly [number, number, number] = [0, 0, 0],
    radius = 25
  ): boolean {
    if (stateId.toUpperCase().includes('RED')) {
      return false; // Security check
    }
    return this.cameraCoordAdapter.focusPosition(stateId, position, radius);
  }

  public focusCluster(
    clusterId: string,
    center: readonly [number, number, number] = [0, 0, 0],
    radius = 60
  ): boolean {
    if (clusterId.toUpperCase().includes('RED')) {
      return false;
    }
    return this.cameraCoordAdapter.focusPosition(clusterId, center, radius);
  }

  public resetCamera(): boolean {
    return this.cameraCoordAdapter.resetCamera();
  }
}
