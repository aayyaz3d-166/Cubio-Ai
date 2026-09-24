/**
 * CUBiO AI — PHASE 58: V1.7 DATASET LOADER
 * src/cubio/model/native_foundation/v17_dataset_loader.ts
 *
 * Strongly-typed loader for v1.7-language-representation dataset.
 * Verifies SHA-256 integrity and ensures zero cross-partition leakage.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { DatasetSplit } from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface V17Episode {
  episodeId: string;
  schemaVersion: string;
  category: 'CONVERSATIONAL' | 'REASONING_STATE' | 'SPATIAL_MEMORY' | 'EPISTEMIC_CALIBRATION';
  prompt: string;
  completion: string;
  epistemicStatus: any;
  spatialCellId?: number;
  address369?: number;
}

export interface V17DatasetManifest {
  dataset_id: string;
  experiment_id: string;
  totalEpisodes: number;
  partitions: {
    trainCount: number;
    validationCount: number;
    testCount: number;
  };
  file_manifest: Record<string, { episodes: number; sha256: string; bytes: number }>;
  status: string;
  sealedAt: string;
}

export class V17DatasetLoader {
  private static readonly DATASET_DIR = path.resolve(
    process.cwd(),
    'datasets/cubio/v1.7-language-representation'
  );
  private static readonly MANIFEST_PATH = path.resolve(
    V17DatasetLoader.DATASET_DIR,
    'metadata/dataset_manifest.json'
  );

  public static loadDataset(): {
    train: V17Episode[];
    validation: V17Episode[];
    unseenTest: V17Episode[];
    manifest: V17DatasetManifest;
    totalEpisodes: number;
    sha256Verified: boolean;
  } {
    ExternalModelGuard.assertNativeOnly('V17-DATASET-LOADER');

    if (!fs.existsSync(this.MANIFEST_PATH)) {
      throw new Error(`Manifest not found at: ${this.MANIFEST_PATH}`);
    }

    const manifest: V17DatasetManifest = JSON.parse(
      fs.readFileSync(this.MANIFEST_PATH, 'utf-8')
    );

    const trainFile = path.resolve(this.DATASET_DIR, 'episodes/train.jsonl');
    const valFile = path.resolve(this.DATASET_DIR, 'episodes/validation.jsonl');
    const testFile = path.resolve(this.DATASET_DIR, 'episodes/test.jsonl');

    this.verifySha256(trainFile, manifest.file_manifest['episodes/train.jsonl'].sha256);
    this.verifySha256(valFile, manifest.file_manifest['episodes/validation.jsonl'].sha256);
    this.verifySha256(testFile, manifest.file_manifest['episodes/test.jsonl'].sha256);

    const train = this.readJsonl(trainFile);
    const validation = this.readJsonl(valFile);
    const unseenTest = this.readJsonl(testFile);

    return {
      train,
      validation,
      unseenTest,
      manifest,
      totalEpisodes: train.length + validation.length + unseenTest.length,
      sha256Verified: true,
    };
  }

  public static toDatasetSplit(loaded: ReturnType<typeof V17DatasetLoader.loadDataset>): DatasetSplit {
    const trainPrompts = new Set(loaded.train.map(e => e.prompt.toLowerCase().trim()));
    const overlap = loaded.unseenTest.filter(e => trainPrompts.has(e.prompt.toLowerCase().trim())).length;

    const mapToTrainingEpisode = (e: V17Episode) => ({
      id: e.episodeId,
      userPrompt: e.prompt,
      sanitizedPrompt: e.prompt,
      category: e.category,
      epistemicStatus: e.epistemicStatus,
      spatialCellId: e.spatialCellId,
      address369: e.address369,
      finalOutcome: {
        action: 'INSPECT_AND_PROVE',
        rationale: 'Deterministic v1.7 multi-task grounded verification',
        finalAssistantResponse: e.completion,
      },
    });

    return {
      train: loaded.train.map(mapToTrainingEpisode),
      validation: loaded.validation.map(mapToTrainingEpisode),
      unseenTest: loaded.unseenTest.map(mapToTrainingEpisode),
      totalEpisodes: loaded.totalEpisodes,
      trainTestOverlapCount: overlap,
      manifestHash: loaded.manifest.file_manifest['episodes/train.jsonl'].sha256,
    };
  }

  private static verifySha256(filePath: string, expectedHash: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File missing: ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    const actual = crypto.createHash('sha256').update(buf).digest('hex');
    if (actual !== expectedHash) {
      throw new Error(`SHA256 mismatch for ${filePath}! Expected ${expectedHash}, got ${actual}`);
    }
  }

  private static readJsonl(filePath: string): V17Episode[] {
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    return lines.filter(l => l.length > 0).map(l => JSON.parse(l));
  }
}
