/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 48: Master CubiO Large-Scale Native Trainer
 *
 * Top-level master class providing reproducible native training execution,
 * failover recovery, and 2GB edge working-set enforcement.
 */

import {
  MasterTrainingRunConfig,
  MasterTrainingReport,
} from './types';
import { MasterTrainingOrchestrator } from './trainingOrchestrator';

export class CubiOLargeScaleNativeTrainer {
  private orchestrator: MasterTrainingOrchestrator;

  constructor() {
    this.orchestrator = new MasterTrainingOrchestrator();
  }

  public getOrchestrator(): MasterTrainingOrchestrator {
    return this.orchestrator;
  }

  /**
   * Executes a complete native training run.
   */
  public async executeTrainingRun(config: MasterTrainingRunConfig): Promise<MasterTrainingReport> {
    return this.orchestrator.runMasterPipeline(config);
  }

  public shutdown(): void {
    this.orchestrator.shutdown();
  }
}
