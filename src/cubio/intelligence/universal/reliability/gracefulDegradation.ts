/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Graceful Degradation Manager
 *
 * Controls dynamic fidelity reduction under degraded network, compute, or provider conditions.
 */

import { DegradationLevel } from './types';

export class GracefulDegradationManager {
  private currentLevel: DegradationLevel = 'FULL_FIDELITY';

  public setDegradationLevel(level: DegradationLevel): void {
    this.currentLevel = level;
  }

  public getDegradationLevel(): DegradationLevel {
    return this.currentLevel;
  }

  public adaptExecutionParameters(originalParams: Record<string, unknown>): Record<string, unknown> {
    switch (this.currentLevel) {
      case 'FULL_FIDELITY':
        return { ...originalParams, renderQuality: 'PBR_ULTRA', maxTokens: 4096, cacheEnabled: true };
      case 'OPTIMIZED_FIDELITY':
        return { ...originalParams, renderQuality: 'PBR_MEDIUM', maxTokens: 2048, cacheEnabled: true };
      case 'LIGHTWEIGHT_CORE':
        return { ...originalParams, renderQuality: 'FLAT_WIREFRAME', maxTokens: 1024, cacheEnabled: true };
      case 'OFFLINE_SOVEREIGN':
        return { ...originalParams, renderQuality: 'TOPOLOGICAL_ASCII', maxTokens: 512, cacheEnabled: true, offlineOnly: true };
    }
  }
}
