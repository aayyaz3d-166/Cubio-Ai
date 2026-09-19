/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Step 42 Native Training Scale-Up & Dataset Pipeline Types
 *
 * Master specifications for:
 * - Streaming Dataset Records & Modality Ingestion (Text, Image, Audio, 3D)
 * - Deterministic Dataset Normalization & Schema Validation
 * - Content-Addressable Deduplication & CAS Hashing
 * - Deterministic Train/Val/Test Splitting & Sharding
 * - Memory-Bounded Streaming Loader with Backpressure Control
 * - Dataset Statistics & 369 Harmonic Distributions
 * - Checkpoint / Resume State Machine for Interrupted Data Pipelines
 * - 2GB Edge Working-Set Bound (<= 512 MB physical RSS)
 */

import { ModalityType, CubiOMultimodalState } from '../../multimodal/types';
import { LargeScaleSample } from '../../large_scale_training/types';
import { QuantizationFormat } from '../../compute/quantization/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. RAW & NORMALIZED DATASET RECORDS ────────────────────────────────────

export interface RawDatasetRecord {
  readonly recordId: string;
  readonly modality: ModalityType;
  readonly rawContent: any;
  readonly semanticConcept: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface NormalizedDatasetRecord {
  readonly recordId: string;
  readonly modality: ModalityType;
  readonly normalizedContent: any;
  readonly semanticConcept: string;
  readonly digitalRoot369: number;
  readonly harmonicWeight: number;
  readonly casCid: string;
  readonly checksum: string;
  readonly byteSize: number;
  readonly timestamp: number;
}

// ─── 2. DATASET SPLITS & SHARDS ─────────────────────────────────────────────

export type DatasetSplitType = 'TRAIN' | 'VALIDATION' | 'TEST';

export interface DatasetSplitConfig {
  readonly trainRatio: number;      // e.g. 0.8
  readonly validationRatio: number; // e.g. 0.1
  readonly testRatio: number;       // e.g. 0.1
  readonly randomSeed: number;
}

export interface PipelineDatasetShard {
  readonly shardId: string;
  readonly datasetVersionId: string;
  readonly split: DatasetSplitType;
  readonly shardIndex: number;
  readonly totalShards: number;
  readonly sampleCount: number;
  readonly casRootCid: string;
  readonly merkleRoot: string;
  readonly byteSize: number;
}

// ─── 3. DATASET VERSIONING & MANIFEST ───────────────────────────────────────

export interface DatasetVersionManifest {
  readonly datasetName: string;
  readonly versionTag: string; // e.g. 'v1.0.0'
  readonly totalRecords: number;
  readonly uniqueRecordsCount: number;
  readonly duplicatesSuppressed: number;
  readonly totalBytes: number;
  readonly splits: {
    readonly trainCount: number;
    readonly valCount: number;
    readonly testCount: number;
  };
  readonly casManifestCid: string;
  readonly merkleRoot: string;
  readonly createdTimestamp: number;
}

// ─── 4. STREAMING & BACKPRESSURE ────────────────────────────────────────────

export interface StreamingBufferConfig {
  readonly maxPrefetchSamples: number; // e.g. 16 samples in RAM buffer
  readonly highWatermark: number;      // Pause reader when buffer >= 16
  readonly lowWatermark: number;       // Resume reader when buffer <= 4
  readonly maxResidentBytes: number;   // Max RAM buffer (e.g. 32 MB)
}

export interface BackpressureMetrics {
  readonly currentBufferedCount: number;
  readonly currentBufferedBytes: number;
  readonly isReaderPaused: boolean;
  readonly samplesYielded: number;
  readonly bufferUtilizationRatio: number;
}

// ─── 5. DATASET STATISTICS & 369 DISTRIBUTIONS ──────────────────────────────

export interface DatasetStatisticsReport {
  readonly datasetName: string;
  readonly totalSamples: number;
  readonly modalityDistribution: Readonly<Record<ModalityType, number>>;
  readonly digitalRootFrequencies: Readonly<Record<number, number>>; // 1..9
  readonly harmonicBalanceScore: number; // 0.0 - 1.0 (triadic alignment)
  readonly meanByteSizePerSample: number;
  readonly totalStorageBytes: number;
  readonly deduplicationSavingsRatio: number;
}

// ─── 6. DATASET CHECKPOINT & RESUME ─────────────────────────────────────────

export interface DatasetCheckpointState {
  readonly checkpointId: string;
  readonly datasetVersionId: string;
  readonly currentSplit: DatasetSplitType;
  readonly currentShardIndex: number;
  readonly processedRecordCursor: number;
  readonly processedSampleIds: readonly string[];
  readonly casSnapshotCid: string;
  readonly timestamp: number;
}
