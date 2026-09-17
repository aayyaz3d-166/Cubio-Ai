/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 15: Virtual Compute Fabric (VCF) Types & Contracts
 *
 * Master specifications for Virtual Hardware Models:
 * vCPU, vGPU, vLanes, Virtual VRAM, Tensor Runtime, Scheduler, Kernels, and Interchangeable Backends.
 *
 * Invariant: 100% deterministic software simulation, reproducible seeds (369001000),
 * and zero fabricated hardware claims.
 */

import { CubiOState } from '../state/types';
import { SuperpositionEnvelope, SuperpositionCandidate } from '../superposition/types';

// ─── 1. TENSOR SYSTEM TYPES ──────────────────────────────────────────────────

export type TensorDType = 'FLOAT32' | 'FLOAT64' | 'INT32' | 'INT16' | 'UINT8';

export interface TensorShape {
  readonly dimensions: readonly number[];
  readonly rank: number;
  readonly elementCount: number;
  readonly strides: readonly number[];
}

export interface TensorBuffer {
  readonly bufferId: string;
  readonly dtype: TensorDType;
  readonly sizeBytes: number;
  readonly data: Float32Array | Float64Array | Int32Array | Uint8Array;
}

// ─── 2. VIRTUAL HARDWARE TYPES ───────────────────────────────────────────────

export type ComputeBackendType = 'SIMULATION' | 'WEBGPU' | 'CUDA';

export interface VcfDeviceProfile {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly backendType: ComputeBackendType;
  readonly cpuCores: number;
  readonly gpuComputeUnits: number;
  readonly vLaneCapacity: number;
  readonly totalVramBytes: number;
  readonly peakFlopsSimulated: number;
  readonly masterSeed: number;
}

export interface VirtualVramStats {
  readonly totalBytes: number;
  readonly allocatedBytes: number;
  readonly freeBytes: number;
  readonly peakAllocatedBytes: number;
  readonly activeBufferCount: number;
  readonly fragmentationRatio: number;
}

// ─── 3. vLANE & WORKGROUP TYPES ──────────────────────────────────────────────

export type VLaneStatus = 'IDLE' | 'EXECUTING' | 'BARRIER' | 'COMPLETED' | 'FAULTED';

export interface VLaneContext {
  readonly laneId: string;
  readonly laneIndex: number;
  readonly candidateState?: CubiOState;
  readonly confidenceWeight: number;
  readonly localRegisters: Float64Array;
  readonly status: VLaneStatus;
  readonly executionCycles: number;
  readonly provenanceHash: string;
}

export interface WorkGroupContext {
  readonly workGroupId: string;
  readonly workGroupIndex: number;
  readonly lanes: readonly VLaneContext[];
  readonly sharedMemory: Float64Array;
  readonly isSynchronized: boolean;
}

// ─── 4. INSTRUCTION & CPU TYPES ──────────────────────────────────────────────

export type VcfOpcode =
  | 'NOP'
  | 'LOAD'
  | 'STORE'
  | 'MOVE'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'FMA'
  | 'COMPARE'
  | 'REDUCE'
  | 'JUMP'
  | 'BARRIER'
  | 'ACTIVATE'
  | 'TRANSFORM'
  | 'COLLAPSE';

export interface VcfInstruction {
  readonly opcode: VcfOpcode;
  readonly destReg?: number;
  readonly srcRegA?: number;
  readonly srcRegB?: number;
  readonly immediate?: number;
  readonly targetStateId?: string;
  readonly metadata?: Record<string, any>;
}

export interface VcfCpuRegisters {
  readonly generalRegisters: Float64Array; // R0 to R15
  readonly pc: number;
  readonly accumulator: number;
  readonly flags: {
    readonly zero: boolean;
    readonly negative: boolean;
    readonly overflow: boolean;
    readonly barrier: boolean;
  };
  readonly cycleCounter: number;
}

// ─── 5. KERNEL & SCHEDULER TYPES ─────────────────────────────────────────────

export interface KernelContext {
  readonly kernelId: string;
  readonly laneIndex: number;
  readonly totalLanes: number;
  readonly globalSeed: number;
  readonly inputs: readonly Float64Array[];
  readonly outputs: Float64Array[];
  readonly customParams?: Record<string, any>;
}

export interface ComputeKernel {
  readonly kernelId: string;
  readonly kernelName: string;
  readonly run: (ctx: KernelContext) => void;
}

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ComputeJob<T = any> {
  readonly jobId: string;
  readonly name: string;
  readonly priority: JobPriority;
  readonly targetDevice: 'CPU' | 'GPU';
  readonly kernel?: ComputeKernel;
  readonly instructions?: readonly VcfInstruction[];
  readonly vLanesRequested?: number;
  readonly payload?: T;
  readonly status: JobStatus;
  readonly submittedAt: number;
  readonly completedAt?: number;
  readonly durationMs?: number;
  readonly simulatedCycles?: number;
  readonly result?: any;
  readonly provenanceHash?: string;
}

// ─── 6. PERFORMANCE & REPORTING TYPES ────────────────────────────────────────

export interface VcfExecutionMetrics {
  readonly totalJobsCompleted: number;
  readonly totalSimulatedCycles: number;
  readonly simulatedParallelEfficiency: number;
  readonly activeVLanes: number;
  readonly peakVramUsageBytes: number;
  readonly executionDurationMs: number;
  readonly bitForBitReproducible: boolean;
}

export interface SuperpositionVcfDispatchResult {
  readonly dispatchId: string;
  readonly sourceEnvelope: SuperpositionEnvelope;
  readonly allocatedVLanesCount: number;
  readonly kernelExecuted: string;
  readonly updatedCandidates: readonly SuperpositionCandidate[];
  readonly resultingEnvelope: SuperpositionEnvelope;
  readonly durationMs: number;
  readonly simulatedCycles: number;
  readonly provenanceHash: string;
}
