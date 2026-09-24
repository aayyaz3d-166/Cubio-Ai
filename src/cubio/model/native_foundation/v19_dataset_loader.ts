/**
 * CUBiO AI — PHASE 66: V1.9 DATASET LOADER
 * src/cubio/model/native_foundation/v19_dataset_loader.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ExternalModelGuard } from './external_model_guard';
import { EpistemicStatus, DatasetSplit } from './native_model_types';

export interface V19Episode {
  episodeId: string;
  schemaVersion: string;
  category: 'CONVERSATIONAL' | 'REASONING_STATE' | 'SPATIAL_MEMORY' | 'EPISTEMIC_CALIBRATION';
  prompt: string;
  completion: string;
  epistemicStatus: EpistemicStatus;
  spatialCellId?: number;
  address369?: number;
}

export interface V19DatasetManifest {
  dataset_id: string;
  experiment_id: string;
  totalEpisodes: number;
  partitions: {
    trainCount: number;
    validationCount: number;
    testCount: number;
  };
  file_manifest: {
    [key: string]: {
      episodes: number;
      sha256: string;
      bytes: number;
    };
  };
  clusters: Record<string, number>;
  cross_split_leakage: string;
  status: string;
  sealedAt: string;
}

export class V19DatasetLoader {
  private static readonly DATASET_DIR = path.resolve(
    process.cwd(),
    'datasets/cubio/v1.9-consolidated-curriculum'
  );
  private static readonly MANIFEST_PATH = path.resolve(
    process.cwd(),
    'datasets/cubio/v1.9-consolidated-curriculum/metadata/dataset_manifest.json'
  );

  public static loadDataset(): {
    train: V19Episode[];
    validation: V19Episode[];
    unseenTest: V19Episode[];
    manifest: V19DatasetManifest;
    totalEpisodes: number;
    sha256Verified: boolean;
  } {
    ExternalModelGuard.assertNativeOnly('V19-DATASET-LOADER');

    if (!fs.existsSync(this.MANIFEST_PATH)) {
      throw new Error(`Manifest not found at: ${this.MANIFEST_PATH}`);
    }

    const manifest: V19DatasetManifest = JSON.parse(
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

  public static toDatasetSplit(loaded: ReturnType<typeof V19DatasetLoader.loadDataset>): DatasetSplit {
    const trainPrompts = new Set(loaded.train.map(e => e.prompt.toLowerCase().trim()));
    const overlap = loaded.unseenTest.filter(e => trainPrompts.has(e.prompt.toLowerCase().trim())).length;

    const mapToTrainingEpisode = (e: V19Episode) => ({
      id: e.episodeId,
      userPrompt: e.prompt,
      sanitizedPrompt: e.prompt,
      category: e.category,
      epistemicStatus: e.epistemicStatus,
      spatialCellId: e.spatialCellId,
      address369: e.address369,
      finalOutcome: {
        action: 'INSPECT_AND_PROVE',
        rationale: 'Deterministic v1.9 consolidated multi-task grounded verification',
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
      throw new Error(`Dataset split file missing: ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
    if (actualHash !== expectedHash) {
      throw new Error(
        `SHA-256 mismatch for ${filePath}. Expected: ${expectedHash}, Actual: ${actualHash}`
      );
    }
  }

  private static readJsonl(filePath: string): V19Episode[] {
    const lines = fs
      .readFileSync(filePath, 'utf-8')
      .trim()
      .split('\n')
      .filter(line => line.length > 0);
    return lines.map(line => JSON.parse(line));
  }
}
