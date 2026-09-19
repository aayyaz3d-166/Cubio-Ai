/**
 * CubiO — Universal Spatial Operating Environment
 * Step 66: Checkpoint/Resume & Fault-Tolerant Training Types
 *
 * Master specifications for:
 * - 7-Component Holistic Checkpoint State (Weights, Optimizer, Scheduler, Cursor, RNG, 369, Provenance)
 * - Exact Deterministic Resumption (sigma^2 = 0.0)
 * - Automated 5-Class Failure Recovery (Node, GPU OOM, RAM Pressure, Network Timeout, Storage Corruption)
 * - Content-Addressed Storage (CAS) Integration & Merkle Trees
 * - 2GB Edge Working-Set Constraints (<= 512 MB RSS, <= 16 MB buffer)
 * - Scientific Classification Invariants (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';
import { ModelScaleTier } from '../pretraining_scheduler/types';

// ─── 1. 7-COMPONENT HOLISTIC CHECKPOINT STATE ───────────────────────────────

export interface ModelWeightsState {
  readonly scale: ModelScaleTier;
  readonly parameterCount: number;
  readonly precision: 'INT8' | 'INT4' | 'FP16' | 'FP32';
  readonly weightsBufferCid: string;          // CAS CID for tensor weights
  readonly tensorLayerCount: number;
  readonly weightsChecksum: string;
}

export interface OptimizerStateRecord {
  readonly algorithm: 'ADAMW' | 'LION' | 'SGD';
  readonly currentStep: number;
  readonly learningRate: number;
  readonly momentum1Cid: string;              // CAS CID for 1st moment m_t
  readonly momentum2Cid: string;              // CAS CID for 2nd moment v_t
  readonly gradientAccumulationCounter: number;
  readonly optimizerStateChecksum: string;
}

export interface SchedulerStateRecord {
  readonly scheduleType: string;
  readonly activeStep: number;
  readonly activeLearningRate: number;
  readonly currentPhase: string;
  readonly totalSteps: number;
  readonly schedulerChecksum: string;
}

export interface DatasetCursorState {
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly currentBatchIndex: number;
  readonly currentSampleOffset: number;
  readonly currentEpoch: number;
  readonly totalTokensConsumed: number;
  readonly cursorChecksum: string;
}

export interface RNGStateRecord {
  readonly masterSeed: number;
  readonly sequenceCallIndex: number;
  readonly stateVector: readonly number[];
  readonly rngChecksum: string;
}

export interface Harmonic369StateRecord {
  readonly spatialCoordinates: readonly [number, number, number]; // [x, y, z] in [0, 1]^3
  readonly digitalRootAccumulator: number;
  readonly vortexDoublingPhase: number;       // 0 to 5 in {1, 2, 4, 8, 7, 5}
  readonly triadicResonanceNode: 3 | 6 | 9;
  readonly harmonicChecksum: string;
}

export interface MerkleProvenanceRecord {
  readonly checkpointId: string;
  readonly parentCheckpointId?: string;
  readonly stepIndex: number;
  readonly lossValue: number;
  readonly gradientNorm: number;
  readonly stateMerkleRoot: string;
  readonly casRootCid: string;
  readonly timestamp: number;
}

export interface HolisticCheckpointRecord {
  readonly checkpointId: string;
  readonly stepIndex: number;
  readonly weightsState: ModelWeightsState;
  readonly optimizerState: OptimizerStateRecord;
  readonly schedulerState: SchedulerStateRecord;
  readonly datasetCursor: DatasetCursorState;
  readonly rngState: RNGStateRecord;
  readonly harmonic369State: Harmonic369StateRecord;
  readonly provenance: MerkleProvenanceRecord;
  readonly totalSizeBytes: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}

// ─── 2. FAILURE MODES & RECOVERY ────────────────────────────────────────────

export type FailureClass =
  | 'NODE_WORKER_FAILURE'
  | 'GPU_OOM_FAILURE'
  | 'RAM_PRESSURE_FAILURE'
  | 'NETWORK_TIMEOUT_FAILURE'
  | 'STORAGE_CORRUPTION_FAILURE';

export interface FailureIncident {
  readonly incidentId: string;
  readonly failureType: FailureClass;
  readonly failedRankOrResource: string;
  readonly failureMessage: string;
  readonly occurredAtStep: number;
  readonly timestamp: number;
}

export interface RecoveryAction {
  readonly incidentId: string;
  readonly recoveryStrategy:
    | 'HOT_SWAP_WORKER'
    | 'SHRINK_MICRO_BATCH_AND_OFFLOAD'
    | 'CAS_RAM_PAGING_DRAIN'
    | 'QUORUM_RECONCILIATION'
    | 'ROLLBACK_TO_PREVIOUS_VALID_CAS_CHECKPOINT';
  readonly restoredFromCheckpointId: string;
  readonly resumeStepIndex: number;
  readonly executionTimeMs: number;
  readonly isSuccess: boolean;
}

// ─── 3. RESUME VERIFICATION ─────────────────────────────────────────────────

export interface DeterministicResumeProof {
  readonly checkpointId: string;
  readonly referenceRunLossTrace: readonly number[];
  readonly resumedRunLossTrace: readonly number[];
  readonly lossTraceVariance: number;          // sigma^2
  readonly isBitForBitConsistent: boolean;     // sigma^2 === 0.0
  readonly proofHash: string;
}

// ─── 4. TELEMETRY ───────────────────────────────────────────────────────────

export interface FaultToleranceTelemetry {
  readonly activeCheckpointId: string;
  readonly currentStep: number;
  readonly totalCheckpointsSaved: number;
  readonly totalFailuresDetected: number;
  readonly totalRecoveriesExecuted: number;
  readonly meanRecoveryLatencyMs: number;
  readonly residentMemoryBytes: number;        // process.memoryUsage().rss
  readonly bufferMemoryBytes: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly classification: ResultClassification;
}
