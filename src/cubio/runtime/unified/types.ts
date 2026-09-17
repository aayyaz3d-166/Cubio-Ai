/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 22: Step 16 Unified Runtime & Ultra-Low-Memory Edge Execution Types
 *
 * Master contracts for:
 * - Runtime Profiles (CUBIO_AUTO, CUBIO_EDGE_2GB, CUBIO_4GB, CUBIO_8GB, CUBIO_HIGH_THROUGHPUT)
 * - 7-Stage Runtime Lifecycle (DISCOVER -> CONFIGURE -> ALLOCATE -> EXECUTE -> ADAPT -> CHECKPOINT -> RELEASE)
 * - Logical vs Physical Resource Accounting (LOGICAL_WORKLOAD / PHYSICAL_WORKING_SET)
 * - Resource Autopilot Policies & Failure Resilience
 * - Deterministic Checkpointing & Provenance
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { SearchStrategyMode } from '../../compute/search/types';
import { MemoryPressureState, ExecutionPolicyMode } from '../../compute/memory/types';
import { DeviceCapabilityProfile, ComputeBackendType } from '../../compute/backends/types';
import { CubiOState } from '../../state/types';
import { EnvAction, EnvObservation } from '../../learning/env/types';

// ─── 1. RUNTIME PROFILES & LIFECYCLE ────────────────────────────────────────

export type RuntimeProfileName =
  | 'CUBIO_AUTO'
  | 'CUBIO_EDGE_2GB'
  | 'CUBIO_4GB'
  | 'CUBIO_8GB'
  | 'CUBIO_HIGH_THROUGHPUT';

export type RuntimeLifecycleState =
  | 'UNINITIALIZED'
  | 'DISCOVER'
  | 'CONFIGURE'
  | 'ALLOCATE'
  | 'EXECUTE'
  | 'ADAPT'
  | 'CHECKPOINT'
  | 'RELEASE'
  | 'SHUTDOWN';

export interface UnifiedRuntimeConfig {
  readonly profileName: RuntimeProfileName;
  readonly maxRamWorkingSetBytes: number;
  readonly cacheBudgetBytes: number;
  readonly maxActiveVLanes: number;
  readonly defaultQuantization: QuantizationFormat;
  readonly searchStrategy: SearchStrategyMode;
  readonly maxSearchDepth: number;
  readonly branchingFactor: number;
  readonly enablePredictivePrefetch: boolean;
  readonly enableAutoPilot: boolean;
  readonly allowGpuAcceleration: boolean;
  readonly masterSeed: number;
}

// ─── 2. LOGICAL VS PHYSICAL RESOURCE ACCOUNTING ─────────────────────────────

export interface LogicalResourceMetrics {
  readonly logicalStatesCount: number;
  readonly logicalTensorsCount: number;
  readonly logicalBranchesCount: number;
  readonly logicalVLanesCount: number;
  readonly totalSearchNodesCount: number;
  readonly logicalMemoryManagedBytes: number;
}

export interface PhysicalResourceMetrics {
  readonly residentRamBytes: number;
  readonly deviceVramBytes: number;
  readonly casStorageBytes: number;
  readonly compressedRamBytes: number;
  readonly bytesCopied: number;
  readonly cpuCoresUsed: number;
  readonly gpuUtilizationPercent: number;
}

export interface UnifiedRuntimeMetrics {
  readonly logical: LogicalResourceMetrics;
  readonly physical: PhysicalResourceMetrics;
  readonly logicalPhysicalRatio: number;
  readonly cacheHitRatio: number;
  readonly deduplicationRatio: number;
  readonly throughputNodesPerSec: number;
  readonly memoryPressure: MemoryPressureState;
  readonly failureRecoveryRate: number;
  readonly activeBackend: ComputeBackendType;
  readonly lifecycleState: RuntimeLifecycleState;
  readonly uptimeMs: number;
}

// ─── 3. CHECKPOINT & RECOVERY ───────────────────────────────────────────────

export interface RuntimeCheckpoint {
  readonly checkpointId: string;
  readonly timestamp: number;
  readonly config: UnifiedRuntimeConfig;
  readonly metrics: UnifiedRuntimeMetrics;
  readonly stateChecksum: string;
  readonly provenanceHash: string;
}

// ─── 4. END-TO-END WORKLOAD RESULTS ─────────────────────────────────────────

export interface EndToEndWorkloadResult {
  readonly executionId: string;
  readonly chosenAction: EnvAction;
  readonly selectedState: CubiOState;
  readonly searchNodesCreated: number;
  readonly searchNodesPruned: number;
  readonly searchDurationMs: number;
  readonly activeQuantization: QuantizationFormat;
  readonly executedBackend: ComputeBackendType;
  readonly memoryAllocatedBytes: number;
  readonly isBudgetRespected: boolean;
  readonly provenanceHash: string;
}
