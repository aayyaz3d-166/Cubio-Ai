/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Model Registry
 *
 * Tracks registered model scale profiles, parameter counts,
 * and production checkpoint references.
 */

import {
  RegisteredModelEntry,
} from './types';
import { ModelScaleProfile } from '../../model/scaling/types';
import { ModelConfigRegistry } from '../../model/scaling/modelConfig';
import { ParameterEstimator } from '../../model/scaling/parameterEstimator';

export class ControlModelRegistry {
  private models: Map<string, RegisteredModelEntry> = new Map();

  /**
   * Registers a model scale profile in the control plane.
   */
  public registerModel(
    modelId: string,
    modelName: string,
    profile: ModelScaleProfile
  ): RegisteredModelEntry {
    const cfg = ModelConfigRegistry.getProfile(profile);
    const params = ParameterEstimator.estimate(cfg);

    const entry: RegisteredModelEntry = Object.freeze({
      modelId,
      modelName,
      profile,
      totalParameters: params.totalParameters,
      defaultQuantization: cfg.defaultQuantization,
      registeredTimestamp: Date.now(),
    });

    this.models.set(modelId, entry);
    return entry;
  }

  public updateModelCheckpoint(modelId: string, checkpointCid: string): void {
    const m = this.models.get(modelId);
    if (m) {
      this.models.set(
        modelId,
        Object.freeze({
          ...m,
          latestCheckpointCid: checkpointCid,
        })
      );
    }
  }

  public getModel(modelId: string): RegisteredModelEntry | undefined {
    return this.models.get(modelId);
  }

  public getAllModels(): readonly RegisteredModelEntry[] {
    return Object.freeze(Array.from(this.models.values()));
  }

  public reset(): void {
    this.models.clear();
  }
}
