/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 21: Step 15 Adaptive Hardware Acceleration Bridge Types
 *
 * Master specifications for:
 * - Unified Backend Interface (CPU, SIMULATION, WEBGPU, CUDA)
 * - Real Runtime Hardware Discovery & Capability Profiles
 * - Adaptive Deterministic Backend Selection
 * - Memory-Aware Tile Transfers & GPU Pressure Safety
 * - Performance & Transfer Overhead Benchmarking Metrics
 */

import { QuantizationFormat } from '../quantization/types';
import { MemoryPressureState } from '../memory/types';
import { CubiOTensor } from '../tensor/tensor';
import { QuantizedTensor } from '../quantization/quantizedTensor';

export type ComputeBackendType = 'CPU' | 'SIMULATION' | 'WEBGPU' | 'CUDA';

export type BackendOperationType =
  | 'MATMUL'
  | 'DOT'
  | 'REDUCTION'
  | 'QUANTIZED_MATMUL'
  | 'KERNEL'
  | 'SOFTMAX'
  | 'SPATIAL_TRANSFORM';

export interface DeviceCapabilityProfile {
  readonly cpuAvailable: boolean;
  readonly cpuCores: number;
  readonly physicalRamBytes: number;
  readonly availableRamBytes: number;
  readonly simulationAvailable: boolean;
  readonly webGpuAvailable: boolean;
  readonly webGpuAdapterInfo?: string;
  readonly cudaAvailable: boolean;
  readonly cudaDeviceName?: string;
  readonly cudaVramBytes?: number;
  readonly preferredBackend: ComputeBackendType;
  readonly detectionMode: 'EXACT' | 'ESTIMATED';
}

export interface BackendSelectionCriteria {
  readonly operationType: BackendOperationType;
  readonly tensorElementCount: number;
  readonly quantFormat?: QuantizationFormat;
  readonly memoryPressure: MemoryPressureState;
  readonly workloadPriority: 'LOW' | 'NORMAL' | 'HIGH';
  readonly allowGpuFallback: boolean;
}

export interface UnifiedExecutionResult<T = any> {
  readonly result: T;
  readonly executedBackend: ComputeBackendType;
  readonly isGpuAccelerated: boolean;
  readonly executionDurationMs: number;
  readonly transferDurationMs: number;
  readonly totalDurationMs: number;
  readonly memoryAllocatedBytes: number;
  readonly fallbackOccurred: boolean;
  readonly fallbackReason?: string;
  readonly provenanceHash: string;
}

export interface HardwareBridgeBenchmarkResult {
  readonly backend: ComputeBackendType;
  readonly operation: BackendOperationType;
  readonly isAvailable: boolean;
  readonly elementCount: number;
  readonly executionDurationMs: number;
  readonly transferDurationMs: number;
  readonly throughputElementsPerSec: number;
  readonly peakMemoryBytes: number;
  readonly accuracyErrorVsCpu: number;
  readonly determinismVerified: boolean;
}
