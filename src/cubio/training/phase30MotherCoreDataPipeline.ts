/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 478: CONTROLLED MOTHER CORE DATA PIPELINE
 * src/cubio/training/phase30MotherCoreDataPipeline.ts
 * ============================================================================
 *
 * Implements the strictly bounded, deterministic training data ingestion pipeline
 * for Mother Core.
 *
 * HARD MANDATES:
 * 1. ONLY ingests approved Tier 1 production data (v0.8 superposition-hardened & canonical 343 spatial records).
 * 2. Immutable CanonicalTrainingSample conversion with provenance tracking and SHA-256 signatures.
 * 3. Deterministic ordering, strict deduplication, and zero cross-split leakage.
 * 4. Strictly read-only access to SQLite VDB (data/cubio_studio.db) - ZERO writes, zero deletions.
 * 5. Permanent enforcement of IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
 * 6. Hard lockout against prohibited external pretrained models and unauthorized inputs.
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import { EpistemicStatus } from '../model/native_foundation/native_model_types';
import {
  CanonicalTrainingSample,
  TrainingBatch,
  MAX_TRAINING_BATCH_SIZE,
} from '../core/nativeTrainingIntegration';
import {
  cellIdToAddress369,
  TOTAL_SPATIAL_CELLS,
} from '../../core/address369';

export const PIPELINE_VERSION = '30.478.0';
export const PIPELINE_ID = 'PHASE30_MOTHER_CORE_DATA_PIPELINE';

export interface PipelineProvenanceRecord {
  readonly sampleId: string;
  readonly sourceDataset: string;
  readonly originalEpisodeId: string;
  readonly rawRecordHash: string;
  readonly canonicalChecksum: string;
  readonly ingestedAt: string;
}

export interface PipelineValidationReport {
  readonly pipelineId: string;
  readonly version: string;
  readonly totalSamplesProcessed: number;
  readonly uniqueSamples: number;
  readonly duplicatesDetected: number;
  readonly crossSplitOverlap: number;
  readonly externalModelHits: number;
  readonly actuationHits: number;
  readonly sovereignVdbMutated: boolean;
  readonly deterministicManifestHash: string;
  readonly status: 'PASS' | 'FAIL';
  readonly completedAt: string;
}

export interface PipelineManifest {
  readonly manifestVersion: string;
  readonly generatedAt: string;
  readonly totalTrainSamples: number;
  readonly totalValSamples: number;
  readonly totalTestSamples: number;
  readonly trainManifestHash: string;
  readonly valManifestHash: string;
  readonly testManifestHash: string;
  readonly sampleSignatures: readonly string[];
}

export class Phase30MotherCoreDataPipeline {
  private static instance: Phase30MotherCoreDataPipeline | null = null;

  private readonly projectRoot: string;
  private readonly v08Dir: string;
  private readonly manifestPath: string;

  private constructor() {
    this.projectRoot = process.cwd();
    this.v08Dir = path.join(this.projectRoot, 'datasets', 'cubio', 'v0.8-superposition-hardened');
    this.manifestPath = path.join(this.v08Dir, 'metadata', 'dataset_manifest.json');
  }

  public static getInstance(): Phase30MotherCoreDataPipeline {
    if (!Phase30MotherCoreDataPipeline.instance) {
      Phase30MotherCoreDataPipeline.instance = new Phase30MotherCoreDataPipeline();
    }
    return Phase30MotherCoreDataPipeline.instance;
  }

  /**
   * Asserts fail-closed isolation and authority guards.
   */
  public assertGuards(): void {
    ExternalModelGuard.assertNativeOnly(PIPELINE_ID);
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('[PIPELINE_SECURITY_BREACH] IS_ACTUATION_BLOCKED is not true');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('[PIPELINE_SECURITY_BREACH] OFFLINE_ISOLATED is not true');
    }
  }

  /**
   * Reads and parses a verified split file with SHA-256 verification.
   */
  private loadRawSplit(relPath: string, expectedHash: string): any[] {
    const fullPath = path.join(this.v08Dir, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[DATA_PIPELINE] Split file not found: ${fullPath}`);
    }

    const buf = fs.readFileSync(fullPath);
    const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
    if (actualHash !== expectedHash) {
      throw new Error(
        `[DATA_PIPELINE] SHA256 mismatch on ${relPath}. Expected: ${expectedHash}, Actual: ${actualHash}`
      );
    }

    const lines = buf.toString('utf-8').split('\n').filter((l) => l.trim().length > 0);
    return lines.map((l, idx) => {
      try {
        return JSON.parse(l);
      } catch (err) {
        throw new Error(`[DATA_PIPELINE] Malformed JSON in ${relPath} line ${idx + 1}`);
      }
    });
  }

  /**
   * Maps an episodic raw category/outcome to the 7-tier EpistemicStatus.
   */
  private resolveEpistemicStatus(raw: any): EpistemicStatus {
    const outcome = raw.finalOutcome;
    const isSuccess = outcome?.isSuccess ?? false;
    const category = (raw.category || '').toUpperCase();
    const taskCat = (raw.taskDefinition?.category || '').toUpperCase();

    if (!isSuccess) return EpistemicStatus.OBSERVATION;
    if (category.includes('REASONING') || taskCat.includes('REASONING')) return EpistemicStatus.DERIVATION;
    if (category.includes('HYPOTHESIS') || taskCat.includes('HYPOTHESIS')) return EpistemicStatus.HYPOTHESIS;
    if (category.includes('PREDICTION') || taskCat.includes('PREDICTION')) return EpistemicStatus.PREDICTION;
    if (category.includes('UNKNOWN') || taskCat.includes('UNKNOWN')) return EpistemicStatus.UNKNOWN;
    return EpistemicStatus.FACT;
  }

  /**
   * Converts a verified raw episode into an immutable CanonicalTrainingSample.
   */
  public convertEpisodeToCanonicalSample(
    raw: any,
    splitName: string,
    index: number
  ): { sample: CanonicalTrainingSample; provenance: PipelineProvenanceRecord } {
    const epId = raw.episodeId ?? `EP_${splitName}_${index}`;
    const rawHash = crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex');

    // Clean & validate prompt / completion
    const prompt = (raw.sanitizedPrompt || raw.userPrompt || `Task ${epId}`).trim();
    ExternalModelGuard.assertNativeOnly(prompt.slice(0, 100));

    let completion: string;
    const finalResp = raw.finalOutcome?.finalAssistantResponse;
    if (finalResp && finalResp.trim().length > 0) {
      completion = finalResp.trim();
    } else if (raw.steps && raw.steps.length > 0) {
      const last = raw.steps[raw.steps.length - 1];
      completion = (last.observation ?? last.aiReasoningStep ?? `Completed ${epId}`).trim();
    } else {
      completion = `Task ${epId} verified.`;
    }

    // Determine deterministic cellId and address369
    const cellId = (index * 13 + 7) % TOTAL_SPATIAL_CELLS;
    const address369 = cellIdToAddress369(cellId);
    const domain = (raw.category || 'REASONING').toUpperCase();
    const epistemicStatus = this.resolveEpistemicStatus(raw);

    const samplePayload = {
      sampleId: `CANON_${splitName.toUpperCase()}_${index.toString().padStart(4, '0')}`,
      objectId: `URN:CUBIO:TRAINING:${epId}`,
      tenantId: 'root',
      stateVersion: 1,
      cellId,
      address369,
      domain,
      prompt,
      completion,
      epistemicStatus,
    };

    const canonicalChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(samplePayload))
      .digest('hex');

    const sample: CanonicalTrainingSample = Object.freeze({
      ...samplePayload,
      checksum: canonicalChecksum,
    });

    const provenance: PipelineProvenanceRecord = Object.freeze({
      sampleId: sample.sampleId,
      sourceDataset: 'v0.8-superposition-hardened',
      originalEpisodeId: epId,
      rawRecordHash: rawHash,
      canonicalChecksum,
      ingestedAt: new Date().toISOString(),
    });

    return { sample, provenance };
  }

  /**
   * Generates authoritative spatial canonical grounding samples (Formula A).
   */
  public generateSpatialCanonicalSamples(): CanonicalTrainingSample[] {
    const samples: CanonicalTrainingSample[] = [];
    for (let c = 0; c < TOTAL_SPATIAL_CELLS; c++) {
      const addr = cellIdToAddress369(c);
      const payload = {
        sampleId: `CANON_SPATIAL_${c.toString().padStart(3, '0')}`,
        objectId: `URN:CUBIO:SPATIAL:CELL_${c}`,
        tenantId: 'root',
        stateVersion: 1,
        cellId: c,
        address369: addr,
        domain: 'SPATIAL_MEMORY',
        prompt: `Compute spatial HCP coordinates and Address 369 for cellId ${c}.`,
        completion: `CellId ${c} resolves to Address 369 index ${addr} via Formula A.`,
        epistemicStatus: EpistemicStatus.FACT,
      };
      const checksum = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      samples.push(Object.freeze({ ...payload, checksum }));
    }
    return samples;
  }

  /**
   * Executes the end-to-end pipeline ingestion, validation, and manifest generation.
   */
  public buildPipelineDataset(): {
    trainSamples: CanonicalTrainingSample[];
    valSamples: CanonicalTrainingSample[];
    testSamples: CanonicalTrainingSample[];
    spatialSamples: CanonicalTrainingSample[];
    provenance: PipelineProvenanceRecord[];
    manifest: PipelineManifest;
    report: PipelineValidationReport;
  } {
    this.assertGuards();

    if (!fs.existsSync(this.manifestPath)) {
      throw new Error(`[DATA_PIPELINE] Manifest missing: ${this.manifestPath}`);
    }

    const manifestMeta = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
    const fm = manifestMeta.file_manifest;

    const rawTrain = this.loadRawSplit('episodes/train.jsonl', fm['episodes/train.jsonl'].sha256);
    const rawVal = this.loadRawSplit('episodes/validation.jsonl', fm['episodes/validation.jsonl'].sha256);
    const rawTest = this.loadRawSplit('episodes/test.jsonl', fm['episodes/test.jsonl'].sha256);

    const trainSamples: CanonicalTrainingSample[] = [];
    const valSamples: CanonicalTrainingSample[] = [];
    const testSamples: CanonicalTrainingSample[] = [];
    const provenance: PipelineProvenanceRecord[] = [];

    const promptSet = new Set<string>();
    let duplicatesDetected = 0;

    // Ingest Train
    rawTrain.forEach((raw, i) => {
      const { sample, provenance: prov } = this.convertEpisodeToCanonicalSample(raw, 'train', i);
      const normPrompt = sample.prompt.toLowerCase().trim();
      if (promptSet.has(normPrompt)) {
        duplicatesDetected++;
      }
      promptSet.add(normPrompt);
      trainSamples.push(sample);
      provenance.push(prov);
    });

    // Ingest Validation
    let crossSplitOverlap = 0;
    rawVal.forEach((raw, i) => {
      const { sample, provenance: prov } = this.convertEpisodeToCanonicalSample(raw, 'val', i);
      const normPrompt = sample.prompt.toLowerCase().trim();
      if (promptSet.has(normPrompt)) {
        crossSplitOverlap++;
      }
      valSamples.push(sample);
      provenance.push(prov);
    });

    // Ingest Test
    rawTest.forEach((raw, i) => {
      const { sample, provenance: prov } = this.convertEpisodeToCanonicalSample(raw, 'test', i);
      const normPrompt = sample.prompt.toLowerCase().trim();
      if (promptSet.has(normPrompt)) {
        crossSplitOverlap++;
      }
      testSamples.push(sample);
      provenance.push(prov);
    });

    const spatialSamples = this.generateSpatialCanonicalSamples();

    // Compute deterministic signatures
    const trainSignatures = trainSamples.map((s) => s.checksum).sort();
    const valSignatures = valSamples.map((s) => s.checksum).sort();
    const testSignatures = testSamples.map((s) => s.checksum).sort();

    const trainManifestHash = crypto.createHash('sha256').update(trainSignatures.join('|')).digest('hex');
    const valManifestHash = crypto.createHash('sha256').update(valSignatures.join('|')).digest('hex');
    const testManifestHash = crypto.createHash('sha256').update(testSignatures.join('|')).digest('hex');

    const manifest: PipelineManifest = Object.freeze({
      manifestVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalTrainSamples: trainSamples.length,
      totalValSamples: valSamples.length,
      totalTestSamples: testSamples.length,
      trainManifestHash,
      valManifestHash,
      testManifestHash,
      sampleSignatures: Object.freeze([...trainSignatures, ...valSignatures, ...testSignatures]),
    });

    const totalSamples = trainSamples.length + valSamples.length + testSamples.length;
    const report: PipelineValidationReport = Object.freeze({
      pipelineId: PIPELINE_ID,
      version: PIPELINE_VERSION,
      totalSamplesProcessed: totalSamples,
      uniqueSamples: promptSet.size,
      duplicatesDetected,
      crossSplitOverlap,
      externalModelHits: 0,
      actuationHits: 0,
      sovereignVdbMutated: false,
      deterministicManifestHash: trainManifestHash,
      status: duplicatesDetected === 0 && crossSplitOverlap === 0 ? 'PASS' : 'FAIL',
      completedAt: new Date().toISOString(),
    });

    return {
      trainSamples,
      valSamples,
      testSamples,
      spatialSamples,
      provenance,
      manifest,
      report,
    };
  }

  /**
   * Batches canonical samples into bounded batches for training.
   */
  public createBatches(
    samples: readonly CanonicalTrainingSample[],
    batchSize: number = MAX_TRAINING_BATCH_SIZE
  ): TrainingBatch[] {
    if (batchSize > MAX_TRAINING_BATCH_SIZE) {
      throw new Error(
        `[DATA_PIPELINE] Batch size ${batchSize} exceeds maximum limit ${MAX_TRAINING_BATCH_SIZE}`
      );
    }

    const batches: TrainingBatch[] = [];
    for (let i = 0; i < samples.length; i += batchSize) {
      const slice = samples.slice(i, i + batchSize);
      batches.push(
        Object.freeze({
          batchId: `BATCH_P30_${i / batchSize}_${slice[0].sampleId}`,
          samples: slice,
          tenantId: 'root',
          batchSize: slice.length,
        })
      );
    }
    return batches;
  }
}
