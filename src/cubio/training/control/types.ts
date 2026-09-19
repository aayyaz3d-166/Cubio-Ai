/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Step 46 Large-Scale Training Control Plane Types
 *
 * Master specifications for:
 * - 10-State Training Job Lifecycle: CREATED, QUEUED, INITIALIZING, RUNNING, PAUSED,
 *   CHECKPOINTING, RECOVERING, COMPLETED, FAILED, CANCELLED
 * - Registries: Dataset, Model, Worker, Checkpoint, and Experiment
 * - Dynamic Resource Allocation & Straggler/Failure Recovery
 * - Experiment Tracking, Provenance Graphs & Training Run Comparisons
 * - Public Bridge Isolation (Zero internal VCF leakage)
 */

import { ModalityType } from '../../multimodal/types';
import { QuantizationFormat } from '../../compute/quantization/types';
import { EdgeProfileName } from '../../fabric/types';
import { ModelScaleProfile } from '../../model/scaling/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. TRAINING JOB LIFECYCLE ──────────────────────────────────────────────

export type TrainingJobState =
  | 'CREATED'
  | 'QUEUED'
  | 'INITIALIZING'
  | 'RUNNING'
  | 'PAUSED'
  | 'CHECKPOINTING'
  | 'RECOVERING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface TrainingJobConfig {
  readonly jobId: string;
  readonly jobName: string;
  readonly datasetName: string;
  readonly datasetVersion: string;
  readonly modelProfile: ModelScaleProfile;
  readonly totalEpochs: number;
  readonly targetLoss: number;
  readonly checkpointIntervalEpochs: number;
  readonly assignedWorkerNodeIds: readonly string[];
  readonly quantization: QuantizationFormat;
}

export interface TrainingJobRecord {
  readonly jobId: string;
  readonly config: TrainingJobConfig;
  readonly state: TrainingJobState;
  readonly currentEpoch: number;
  readonly currentLoss: number;
  readonly crossModalAccuracy: number;
  readonly latestCheckpointCid?: string;
  readonly startTime: number;
  readonly lastUpdateTime: number;
  readonly jobManifestCid: string;
}

// ─── 2. DATASET & MODEL REGISTRIES ──────────────────────────────────────────

export interface RegisteredDatasetEntry {
  readonly datasetName: string;
  readonly versions: readonly string[];
  readonly totalSamples: number;
  readonly supportedModalities: readonly ModalityType[];
  readonly casManifestCid: string;
  readonly registeredTimestamp: number;
}

export interface RegisteredModelEntry {
  readonly modelId: string;
  readonly modelName: string;
  readonly profile: ModelScaleProfile;
  readonly totalParameters: number;
  readonly defaultQuantization: QuantizationFormat;
  readonly latestCheckpointCid?: string;
  readonly registeredTimestamp: number;
}

// ─── 3. WORKER & RESOURCE ALLOCATION ────────────────────────────────────────

export interface RegisteredWorkerEntry {
  readonly workerId: string;
  readonly hostname: string;
  readonly edgeProfile: EdgeProfileName;
  readonly physicalRamBytes: number;
  readonly physicalVramBytes: number;
  readonly isHealthy: boolean;
  readonly allocatedJobId?: string;
  readonly lastHeartbeatTime: number;
}

export interface ResourceAllocationPlan {
  readonly allocationId: string;
  readonly jobId: string;
  readonly allocatedWorkers: readonly string[];
  readonly totalVirtualRamBytes: number;
  readonly totalVLanes: number;
  readonly is2GBEdgeCompliant: boolean;
}

// ─── 4. CHECKPOINT & EXPERIMENT REGISTRY ────────────────────────────────────

export interface ControlCheckpointEntry {
  readonly checkpointId: string;
  readonly jobId: string;
  readonly epoch: number;
  readonly loss: number;
  readonly accuracy: number;
  readonly casCid: string;
  readonly merkleRoot: string;
  readonly timestamp: number;
}

export interface ExperimentEntry {
  readonly experimentId: string;
  readonly experimentName: string;
  readonly jobIds: readonly string[];
  readonly bestLoss: number;
  readonly bestAccuracy: number;
  readonly totalTrainedTokens: number;
  readonly createdTimestamp: number;
}

// ─── 5. CONTROL PLANE TELEMETRY ─────────────────────────────────────────────

export interface ControlPlaneTelemetry {
  readonly activeJobsCount: number;
  readonly queuedJobsCount: number;
  readonly completedJobsCount: number;
  readonly totalRegisteredWorkers: number;
  readonly healthyWorkersCount: number;
  readonly totalExperimentsTracked: number;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
