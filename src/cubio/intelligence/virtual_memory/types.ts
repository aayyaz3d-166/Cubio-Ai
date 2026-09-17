/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F16: CubiO Intelligence Virtual Memory Engine (Types & Contracts)
 *
 * Master specification for tiered spatial virtual memory management (L1, L2, L3),
 * transparent page-fault swapping, LRU/resonance eviction, and resource optimization.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';

export type VirtualMemoryTier = 'L1_HOT_RAM' | 'L2_WARM_PAGE' | 'L3_COLD_STORE';

export interface VirtualStatePage {
  readonly pageId: string;
  readonly dimension: CubiODimension;
  readonly stateIds: readonly string[];
  readonly states: readonly CubiOState[];
  readonly isDirty: boolean;
  readonly lastAccessedAt: number;
  readonly accessCount: number;
  readonly rawSizeBytes: number;
  readonly compressedSizeBytes: number;
  readonly pageChecksum: string;
}

export interface VirtualMemoryConfig {
  readonly maxL1States: number; // Maximum states resident in L1 Hot RAM
  readonly maxL2Pages: number; // Maximum pages resident in L2 Warm cache
  readonly pageSize: number; // Default states per page (e.g. 10)
  readonly evictionPolicy: 'LRU' | 'RESONANCE_CLOCK' | 'SPATIAL_CLUSTER';
  readonly compressionEnabled: boolean;
}

export interface VirtualMemoryStats {
  readonly totalManagedStates: number;
  readonly l1HotStatesCount: number;
  readonly l2WarmPagesCount: number;
  readonly l3ColdPagesCount: number;
  readonly totalPageFaults: number;
  readonly totalHits: number;
  readonly totalMisses: number;
  readonly hitRatio: number; // 0.0 .. 1.0
  readonly physicalMemorySavedPercentage: number; // e.g. 75.5%
  readonly statsChecksum: string;
}

export interface PageFaultEvent {
  readonly faultId: string;
  readonly stateId: string;
  readonly sourceTier: VirtualMemoryTier;
  readonly destinationTier: 'L1_HOT_RAM';
  readonly latencyMs: number;
  readonly timestamp: number;
}
