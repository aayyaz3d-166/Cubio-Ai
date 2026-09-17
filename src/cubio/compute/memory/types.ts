/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 16: Step 11 Memory Virtualization & Adaptive Resource Management Types
 *
 * Master specifications for:
 * - Resource Profiling & Dynamic Budgets (including 2GB CUBIO_LOW_MEMORY_MODE)
 * - Virtual Memory Manager & Virtual Blocks
 * - Multi-Level Logical Cache (L0, L1, L2, L3)
 * - Working-Set Manager (HOT, WARM, COLD tiers)
 * - Compression Engine & Metrics
 * - Tensor Tiling (creation, residency, loading, execution, writeback)
 * - Superposition-Aware Memory Prioritizer
 * - vLane Dependency Resolver & Adaptive Concurrency
 * - Memory Pressure States (NORMAL, PRESSURED, HIGH_PRESSURE, CRITICAL)
 * - Full Observability Metrics
 */

import { CubiOTensor } from '../tensor/tensor';
import { SuperpositionEnvelope, SuperpositionCandidate } from '../../superposition/types';
import { CubiOState } from '../../state/types';

// ─── 1. RESOURCE PROFILER & BUDGET TYPES ─────────────────────────────────────

export type ResourceDetectionMode = 'EXACT' | 'ESTIMATED' | 'UNAVAILABLE';
export type RuntimeEnvironment = 'NODE' | 'BROWSER' | 'UNKNOWN';

export interface CubiOResourceProfile {
  readonly physicalRamBytes: number;
  readonly availableRamBytes: number;
  readonly cpuLogicalCores: number;
  readonly gpuAvailable: boolean;
  readonly gpuMemoryBytes?: number;
  readonly detectionMode: ResourceDetectionMode;
  readonly runtimeEnvironment: RuntimeEnvironment;
}

export type ExecutionPolicyMode = 'STANDARD' | 'CUBIO_LOW_MEMORY_MODE' | 'HIGH_THROUGHPUT';

export interface ResourceBudget {
  readonly mode: ExecutionPolicyMode;
  readonly maxRamWorkingSetBytes: number;
  readonly maxVramWorkingSetBytes: number;
  readonly cacheBudgetBytes: number;
  readonly cacheEvictionThresholdBytes: number;
  readonly maxConcurrentVLanes: number;
  readonly physicalWorkersCount: number;
  readonly tensorTileSizeBytes: number;
  readonly pageSizeBytes: number;
  readonly cpuExecutionBudgetCycles: number;
}

// ─── 2. MEMORY PRESSURE STATES ───────────────────────────────────────────────

export type MemoryPressureState = 'NORMAL' | 'PRESSURED' | 'HIGH_PRESSURE' | 'CRITICAL';

// ─── 3. VIRTUAL MEMORY MANAGER & BLOCK TYPES ─────────────────────────────────

export type BlockResidency = 'RESIDENT_RAM' | 'VIRTUAL_VRAM' | 'COMPRESSED' | 'STORAGE_CAS' | 'EVICTED';

export interface VirtualMemoryBlock {
  readonly blockId: string;
  readonly sizeBytes: number;
  readonly residency: BlockResidency;
  readonly physicalLocation: 'RAM' | 'VRAM' | 'COMPRESSED_CACHE' | 'CAS_STORAGE' | 'NONE';
  readonly isDirty: boolean;
  readonly accessFrequency: number;
  readonly lastAccessedAt: number;
  readonly resonanceScore: number; // 369 harmonic resonance [1..9]
  readonly isPinned: boolean;
  readonly cid?: string; // Content Addressable Storage CID
  readonly data?: Float64Array | Uint8Array;
  readonly checksum: string;
}

// ─── 4. VIRTUAL PAGING & CAS SWAP TYPES ──────────────────────────────────────

export type PageResidenceStatus =
  | 'RESIDENT_RAM'
  | 'VIRTUAL_VRAM'
  | 'PAGED_CAS'
  | 'COMPRESSED'
  | 'EVICTED';

export interface VirtualPage {
  readonly pageId: string;
  readonly pageIndex: number;
  readonly sizeBytes: number;
  readonly status: PageResidenceStatus;
  readonly cid?: string;
  readonly data?: Float64Array | Uint8Array;
  readonly lastAccessedAt: number;
  readonly accessCount: number;
  readonly resonanceIndex: number;
  readonly isPinned: boolean;
  readonly checksum: string;
}

export interface PagingStats {
  readonly totalPagesAllocated: number;
  readonly residentPagesCount: number;
  readonly pagedOutCasCount: number;
  readonly compressedPagesCount: number;
  readonly swapOutOperations: number;
  readonly swapInOperations: number;
  readonly currentResidentBytes: number;
  readonly peakResidentBytes: number;
  readonly casStorageBytes: number;
}

// ─── 5. WORKING-SET & MEMORY TIERS ───────────────────────────────────────────

export type WorkingSetTier = 'HOT' | 'WARM' | 'COLD';
export type EvictionPolicy = 'RESONANCE_AWARE_LRU' | 'STANDARD_LRU' | 'FIFO';

export interface WorkingSetStats {
  readonly activePagesCount: number;
  readonly residentMemoryBytes: number;
  readonly budgetLimitBytes: number;
  readonly utilizationPercentage: number;
  readonly pressureLevel: 'NOMINAL' | 'MODERATE' | 'CRITICAL';
  readonly evictionCount: number;
}

export interface WorkingSetItem {
  readonly blockId: string;
  readonly tier: WorkingSetTier;
  readonly targetType: 'SUPERPOSITION_CANDIDATE' | 'VLANE' | 'TENSOR_TILE' | 'STATE' | 'GENERAL';
  readonly referenceId: string;
  readonly priorityScore: number;
  readonly lastActiveAt: number;
}

// ─── 6. MULTI-LEVEL LOGICAL CACHE (L0, L1, L2, L3) ───────────────────────────

export type LogicalCacheLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface CacheEntry<T = any> {
  readonly key: string;
  readonly level: LogicalCacheLevel;
  readonly data: T;
  readonly sizeBytes: number;
  readonly insertedAt: number;
  readonly lastAccessedAt: number;
  readonly accessCount: number;
  readonly checksum: string;
}

export interface CacheMetrics {
  readonly hitsL0: number;
  readonly hitsL1: number;
  readonly hitsL2: number;
  readonly hitsL3: number;
  readonly misses: number;
  readonly totalLookups: number;
  readonly hitRatio: number;
  readonly evictionsCount: number;
  readonly currentCacheBytes: number;
}

// ─── 7. COMPRESSION TYPES ───────────────────────────────────────────────────

export interface CompressedBlock {
  readonly blockId: string;
  readonly algorithm: 'SPARSE_DELTA_RLE' | 'JSON_COMPACT';
  readonly originalSizeBytes: number;
  readonly compressedSizeBytes: number;
  readonly compressionRatio: number;
  readonly compressedData: Uint8Array | string;
  readonly compressDurationMs: number;
  readonly checksum: string;
}

export interface CompressionMetrics {
  readonly totalCompressions: number;
  readonly totalDecompressions: number;
  readonly totalOriginalBytes: number;
  readonly totalCompressedBytes: number;
  readonly averageCompressionRatio: number;
  readonly totalCompressDurationMs: number;
  readonly totalDecompressDurationMs: number;
}

export interface MemoryCompressor {
  compress(data: Float64Array | Uint8Array, blockId?: string): CompressedBlock;
  decompress(block: CompressedBlock): Float64Array | Uint8Array;
  getMetrics(): CompressionMetrics;
  reset(): void;
}

// ─── 8. TENSOR TILING TYPES ──────────────────────────────────────────────────

export interface TensorTile {
  readonly tileId: string;
  readonly parentTensorId: string;
  readonly tileIndices: readonly number[];
  readonly shape: readonly number[];
  readonly offsets: readonly number[];
  readonly elementCount: number;
  readonly sizeBytes: number;
  readonly isResident: boolean;
  readonly isDirty: boolean;
  readonly data?: Float64Array;
  readonly blockId?: string;
}

export interface TiledTensorDescriptor {
  readonly tensorId: string;
  readonly fullShape: readonly number[];
  readonly tileShape: readonly number[];
  readonly gridDimensions: readonly number[];
  readonly totalTiles: number;
  readonly totalElements: number;
  readonly totalSizeBytes: number;
  readonly tiles: readonly TensorTile[];
}

export interface TensorTileSpec {
  readonly tileId: string;
  readonly originalShape: readonly number[];
  readonly tileShape: readonly number[];
  readonly offsets: readonly number[];
  readonly elementCount: number;
  readonly byteSize: number;
}

export interface TiledMatmulResult {
  readonly outputTensor: CubiOTensor;
  readonly tilesProcessed: number;
  readonly peakMemoryUsedBytes: number;
  readonly unTiledMemoryEstimateBytes: number;
  readonly memorySavingsRatio: number;
  readonly durationMs: number;
  readonly provenanceHash: string;
}

// ─── 9. SUPERPOSITION MEMORY PRIORITY ────────────────────────────────────────

export interface SuperpositionMemoryAllocation {
  readonly candidateId: string;
  readonly stateId: string;
  readonly confidence: number;
  readonly entropy: number;
  readonly resonanceScore: number;
  readonly assignedTier: WorkingSetTier;
  readonly isResident: boolean;
  readonly blockId: string;
}

// ─── 10. vLANE MEMORY RESOLUTION & SCHEDULING ────────────────────────────────

export interface VLaneMemoryRequirement {
  readonly laneIndex: number;
  readonly candidateStateId: string;
  readonly requiredBlockIds: readonly string[];
  readonly estimatedSizeBytes: number;
}

export interface VLaneMemoryResolutionResult {
  readonly laneIndex: number;
  readonly allPagesResident: boolean;
  readonly pagesPagedIn: number;
  readonly memoryAllocatedBytes: number;
}

export interface AdaptiveSchedulePlan {
  readonly totalRequestedLanes: number;
  readonly allocatedConcurrentLanes: number;
  readonly microBatchCount: number;
  readonly lanesPerBatch: number;
  readonly memoryPressureLevel: 'NOMINAL' | 'MODERATE' | 'CRITICAL';
  readonly throttled: boolean;
}

export interface AdaptiveExecutionResult {
  readonly plan: AdaptiveSchedulePlan;
  readonly resultingEnvelope: SuperpositionEnvelope;
  readonly totalCycles: number;
  readonly peakMemoryBytes: number;
  readonly durationMs: number;
  readonly provenanceHash: string;
}

// ─── 11. FULL OBSERVABILITY & REPORT TYPES ───────────────────────────────────

export interface VcfObservabilityMetrics {
  readonly virtualMemoryAllocated: number;
  readonly residentMemory: number;
  readonly workingSetBytes: number;
  readonly cacheBytes: number;
  readonly compressedBytes: number;
  readonly pagedOutBytes: number;
  readonly pageInCount: number;
  readonly pageOutCount: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly evictions: number;
  readonly activeVLanes: number;
  readonly queuedVLanes: number;
  readonly physicalWorkers: number;
  readonly tensorTilesExecuted: number;
  readonly memoryPressure: MemoryPressureState;
  readonly cacheHitRatio: number;
  readonly residencyRatio: number;
  readonly compressionRatio: number;
  readonly virtualToPhysicalRatio: number;
  readonly avgPageInLatencyMs: number;
  readonly avgPageOutLatencyMs: number;
  readonly vLaneUtilization: number;
}

export interface MemoryVirtualizationReport {
  readonly reportId: string;
  readonly timestamp: number;
  readonly profile: CubiOResourceProfile;
  readonly budget: ResourceBudget;
  readonly pagingStats: PagingStats;
  readonly workingSetStats: WorkingSetStats;
  readonly simulatedMemoryEfficiency: number;
  readonly bitForBitDeterminism: boolean;
}
