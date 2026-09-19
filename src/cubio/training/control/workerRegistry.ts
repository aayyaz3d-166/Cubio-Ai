/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Worker Registry
 *
 * Tracks cluster worker nodes, physical resource limits,
 * health status, and active training job allocations.
 */

import {
  RegisteredWorkerEntry,
} from './types';
import { EdgeProfileName } from '../../fabric/types';

export class ControlWorkerRegistry {
  private workers: Map<string, RegisteredWorkerEntry> = new Map();

  /**
   * Registers a worker node.
   */
  public registerWorker(
    workerId: string,
    hostname: string,
    edgeProfile: EdgeProfileName,
    physicalRamBytes: number,
    physicalVramBytes = 0
  ): RegisteredWorkerEntry {
    const entry: RegisteredWorkerEntry = Object.freeze({
      workerId,
      hostname,
      edgeProfile,
      physicalRamBytes,
      physicalVramBytes,
      isHealthy: true,
      lastHeartbeatTime: Date.now(),
    });

    this.workers.set(workerId, entry);
    return entry;
  }

  public setWorkerHealth(workerId: string, isHealthy: boolean): void {
    const w = this.workers.get(workerId);
    if (w) {
      this.workers.set(
        workerId,
        Object.freeze({
          ...w,
          isHealthy,
          lastHeartbeatTime: Date.now(),
        })
      );
    }
  }

  public allocateWorkerToJob(workerId: string, jobId?: string): void {
    const w = this.workers.get(workerId);
    if (w) {
      this.workers.set(
        workerId,
        Object.freeze({
          ...w,
          allocatedJobId: jobId,
        })
      );
    }
  }

  public getWorker(workerId: string): RegisteredWorkerEntry | undefined {
    return this.workers.get(workerId);
  }

  public getHealthyWorkers(): readonly RegisteredWorkerEntry[] {
    return Object.freeze(Array.from(this.workers.values()).filter((w) => w.isHealthy));
  }

  public getAllWorkers(): readonly RegisteredWorkerEntry[] {
    return Object.freeze(Array.from(this.workers.values()));
  }

  public reset(): void {
    this.workers.clear();
  }
}
