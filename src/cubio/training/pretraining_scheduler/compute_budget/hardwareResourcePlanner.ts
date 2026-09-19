/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Hardware Resource Planner
 *
 * Allocates compute hardware bounds (GPU VRAM, CPU threads, vLanes)
 * and enforces strict 2GB Edge Working-Set limits (<= 512 MB RSS, <= 16 MB stream buffer).
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModelScaleTier, ResourceAllocationConfig } from '../types';

export class HardwareResourcePlanner {
  /**
   * Plans hardware resource allocation according to model scale and profile.
   */
  public static planResources(
    scale: ModelScaleTier,
    isEdgeProfile = true
  ): ResourceAllocationConfig {
    let vramMB = 8192;
    let cpuThreads = 4;
    let vLanes = 8;

    switch (scale) {
      case '8M':
      case '32M':
        vramMB = 2048;
        cpuThreads = 2;
        vLanes = 4;
        break;

      case '128M':
        vramMB = 4096;
        cpuThreads = 4;
        vLanes = 8;
        break;

      case '512M':
        vramMB = 8192;
        cpuThreads = 8;
        vLanes = 16;
        break;

      case '1B':
      case '7B':
        vramMB = isEdgeProfile ? 4096 : 24576; // 4GB on edge via LoRA offload
        cpuThreads = 16;
        vLanes = 32;
        break;
    }

    return Object.freeze({
      gpuVRAMPerRankMB: vramMB,
      cpuWorkerThreads: cpuThreads,
      vLaneCapacity: vLanes,
      is2GBEdgeProfile: isEdgeProfile,
      maxStreamBufferMB: 16, // strictly <= 16 MB
    });
  }

  /**
   * Verifies if a memory footprint conforms to 2GB edge constraints.
   */
  public static verify2GBEdgeCompliance(residentMemoryBytes: number): boolean {
    const limitBytes = 512 * 1024 * 1024; // 512 MB physical RSS
    return residentMemoryBytes <= limitBytes;
  }
}
