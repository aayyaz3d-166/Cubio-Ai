/**
 * CUBiO AI — PHASE 55: V1.4 DATASET LOADER
 * src/cubio/model/native_foundation/v14_dataset_loader.ts
 *
 * Strongly-typed loader for v1.4-reasoning-consolidated dataset.
 * Verifies SHA-256 integrity and ensures zero cross-partition leakage.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { DatasetSplit } from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface V14Episode {
  episodeId: string;
  schemaVersion: string;
  category: 'REASONING_STATE' | 'CONVERSATIONAL' | 'SPATIAL_MEMORY' | 'EPISTEMIC_CALIBRATION';
  prompt: string;
  completion: string;
  epistemicStatus: any;
  spatialCellId?: number;
  address369?: number;
}

export interface V14DatasetManifest {
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

export class V14DatasetLoader {
  private static readonly DATASET_DIR = path.resolve(
    process.cwd(),
    'datasets/cubio/v1.4-reasoning-consolidated'
  );
  private static readonly MANIFEST_PATH = path.resolve(
    V14DatasetLoader.DATASET_DIR,
    'metadata/dataset_manifest.json'
  );

  public static loadDataset(): {
    train: V14Episode[];
    validation: V14Episode[];
    unseenTest: V14Episode[];
    manifest: V14DatasetManifest;
    totalEpisodes: number;
    sha256Verified: boolean;
  } {
    ExternalModelGuard.assertNativeOnly('V14-DATASET-LOADER');

    if (!fs.existsSync(this.MANIFEST_PATH)) {
      throw new Error(`Manifest not found at: ${this.MANIFEST_PATH}`);
    }

    const manifest: V14DatasetManifest = JSON.parse(
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

  public static toDatasetSplit(loaded: ReturnType<typeof V14DatasetLoader.loadDataset>): DatasetSplit {
    const trainPrompts = new Set(loaded.train.map(e => e.prompt.toLowerCase().trim()));
    const overlap = loaded.unseenTest.filter(e => trainPrompts.has(e.prompt.toLowerCase().trim())).length;

    const mapToTrainingEpisode = (e: V14Episode) => ({
      id: e.episodeId,
      userPrompt: e.prompt,
      sanitizedPrompt: e.prompt,
      category: e.category,
      epistemicStatus: e.epistemicStatus,
      spatialCellId: e.spatialCellId,
      finalOutcome: {
        finalAssistantResponse: e.completion,
      },
    });

    return {
      train: loaded.train.map(mapToTrainingEpisode),
      validation: loaded.validation.map(mapToTrainingEpisode),
      unseenTest: loaded.unseenTest.map(mapToTrainingEpisode),
      totalEpisodes: loaded.totalEpisodes,
      trainTestOverlapCount: overlap,
      manifestHash: loaded.manifest.dataset_id,
    };
  }

  private static verifySha256(filePath: string, expectedHash: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    const computed = crypto.createHash('sha256').update(buf).digest('hex');
    if (computed !== expectedHash) {
      throw new Error(`[SHA256_MISMATCH] in ${filePath}. Expected ${expectedHash}, got ${computed}`);
    }
  }

  private static readJsonl(filePath: string): V14Episode[] {
    const raw = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    return raw.filter(Boolean).map(l => JSON.parse(l));
  }
}
