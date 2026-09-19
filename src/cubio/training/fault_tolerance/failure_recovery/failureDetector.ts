/**
 * CubiO — Universal Spatial Operating Environment
 * Step 66: Failure Detector
 *
 * Continuously monitors pretraining health and detects 5 failure modes:
 * 1. NODE_WORKER_FAILURE (Heartbeat timeout)
 * 2. GPU_OOM_FAILURE (Allocation trap)
 * 3. RAM_PRESSURE_FAILURE (Process RSS > 480 MB limit)
 * 4. NETWORK_TIMEOUT_FAILURE (AllReduce sync stall)
 * 5. STORAGE_CORRUPTION_FAILURE (Merkle checksum mismatch)
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { FailureClass, FailureIncident } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class FailureDetector {
  private incidents: FailureIncident[] = [];

  /**
   * Evaluates system metrics and detects failure incidents.
   */
  public evaluateHealth(
    stepIndex: number,
    telemetry: {
      workerHeartbeatAgeMs: number;
      isGPUOOM: boolean;
      residentMemoryBytes: number;
      networkLatencyMs: number;
      isStorageCorrupt: boolean;
    }
  ): FailureIncident | null {
    let failureType: FailureClass | null = null;
    let message = '';
    let resource = 'CLUSTER_SYSTEM';

    if (telemetry.workerHeartbeatAgeMs > 10000) {
      failureType = 'NODE_WORKER_FAILURE';
      message = `Worker heartbeat lost (${telemetry.workerHeartbeatAgeMs}ms > 10000ms threshold)`;
      resource = 'WORKER_NODE_3';
    } else if (telemetry.isGPUOOM) {
      failureType = 'GPU_OOM_FAILURE';
      message = 'GPU Out of Memory allocation trap encountered during backward pass';
      resource = 'ACCELERATOR_RANK_0';
    } else if (telemetry.residentMemoryBytes > 480 * 1024 * 1024) {
      failureType = 'RAM_PRESSURE_FAILURE';
      message = `Process RSS memory critical (${(telemetry.residentMemoryBytes / (1024 * 1024)).toFixed(1)}MB > 480MB)`;
      resource = 'PHYSICAL_RAM';
    } else if (telemetry.networkLatencyMs > 5000) {
      failureType = 'NETWORK_TIMEOUT_FAILURE';
      message = `AllReduce collective communication timeout (${telemetry.networkLatencyMs}ms > 5000ms)`;
      resource = 'MESH_NETWORK';
    } else if (telemetry.isStorageCorrupt) {
      failureType = 'STORAGE_CORRUPTION_FAILURE';
      message = 'Storage block corruption detected via Merkle proof checksum mismatch';
      resource = 'CAS_STORAGE_VOLUME';
    }

    if (failureType) {
      const iHash = deterministicHash(`INCIDENT:${failureType}:${stepIndex}:${Date.now()}`);
      const incident: FailureIncident = Object.freeze({
        incidentId: `INC_${failureType.slice(0, 4)}_${iHash.slice(2, 10)}`,
        failureType,
        failedRankOrResource: resource,
        failureMessage: message,
        occurredAtStep: stepIndex,
        timestamp: Date.now(),
      });

      this.incidents.push(incident);
      return incident;
    }

    return null;
  }

  public getIncidentHistory(): readonly FailureIncident[] {
    return Object.freeze([...this.incidents]);
  }

  public clear(): void {
    this.incidents.length = 0;
  }
}
