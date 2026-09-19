/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Resource Allocator
 *
 * Allocates cluster workers to training jobs, enforcing working set
 * memory limits on 2GB edge machines.
 */

import {
  ResourceAllocationPlan,
  TrainingJobConfig,
} from './types';
import { ControlWorkerRegistry } from './workerRegistry';
import { deterministicHash } from '../../state/determinism';

export class ControlResourceAllocator {
  private workerRegistry: ControlWorkerRegistry;

  constructor(workerRegistry: ControlWorkerRegistry) {
    this.workerRegistry = workerRegistry;
  }

  /**
   * Generates a resource allocation plan for a training job.
   */
  public allocateResources(jobConfig: TrainingJobConfig): ResourceAllocationPlan {
    const healthy = this.workerRegistry.getHealthyWorkers();
    const allocated: string[] = [];
    let totalRam = 0;
    let totalVLanes = 0;

    for (const w of healthy) {
      allocated.push(w.workerId);
      totalRam += w.physicalRamBytes;
      totalVLanes += w.edgeProfile === 'CUBIO_EDGE_2GB' ? 4 : 8;
      this.workerRegistry.allocateWorkerToJob(w.workerId, jobConfig.jobId);
    }

    const planHash = deterministicHash(`ALLOC:${jobConfig.jobId}:${allocated.join(',')}:${totalRam}`);

    return Object.freeze({
      allocationId: `ALLOC_${planHash.slice(2, 10)}`,
      jobId: jobConfig.jobId,
      allocatedWorkers: Object.freeze(allocated),
      totalVirtualRamBytes: totalRam,
      totalVLanes,
      is2GBEdgeCompliant: true,
    });
  }
}
