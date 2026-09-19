/**
 * CubiO — Universal Spatial Operating Environment
 * Step 66: Failure Simulation Harness
 *
 * Simulates and stress-tests all 5 failure modes:
 * - Worker node crash
 * - Accelerator GPU OOM
 * - Process RAM pressure threshold
 * - Network AllReduce timeout
 * - Storage block corruption
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { FailureClass, RecoveryAction } from '../types';
import { FailureDetector } from './failureDetector';
import { FaultRecoveryOrchestrator } from './faultRecoveryOrchestrator';

export class FailureSimulationHarness {
  private detector: FailureDetector;
  private orchestrator: FaultRecoveryOrchestrator;

  constructor(detector: FailureDetector, orchestrator: FaultRecoveryOrchestrator) {
    this.detector = detector;
    this.orchestrator = orchestrator;
  }

  /**
   * Injects a synthetic failure and executes automated recovery.
   */
  public simulateFailureAndRecover(
    failureType: FailureClass,
    stepIndex: number
  ): { incidentId: string; recoveryAction: RecoveryAction } {
    const telemetry = {
      workerHeartbeatAgeMs: failureType === 'NODE_WORKER_FAILURE' ? 15000 : 50,
      isGPUOOM: failureType === 'GPU_OOM_FAILURE',
      residentMemoryBytes: failureType === 'RAM_PRESSURE_FAILURE' ? 500 * 1024 * 1024 : 200 * 1024 * 1024,
      networkLatencyMs: failureType === 'NETWORK_TIMEOUT_FAILURE' ? 8000 : 20,
      isStorageCorrupt: failureType === 'STORAGE_CORRUPTION_FAILURE',
    };

    const incident = this.detector.evaluateHealth(stepIndex, telemetry);
    if (!incident) {
      throw new Error(`Failed to simulate incident for ${failureType}`);
    }

    const recoveryAction = this.orchestrator.recover(incident);

    return {
      incidentId: incident.incidentId,
      recoveryAction,
    };
  }
}
