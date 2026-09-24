/**
 * CUBiO AI — PHASE 50: V1.0 EXPANDED CONVERSATIONAL DATASET LOADER
 * src/cubio/model/native_foundation/v10_dataset_loader.ts
 *
 * Reads the canonical v1.0-expanded-conversational JSONL dataset from disk
 * and converts each episode into the native DatasetEpisode contract.
 *
 * INVARIANTS:
 * - Local files ONLY. Zero external model calls.
 * - Cryptographic SHA256 integrity verification against dataset_manifest.json before loading.
 * - Strict train/validation/unseenTest partitioning with 0 overlap (enforced fail-closed).
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { DatasetEpisode, DatasetSplit, EpistemicStatus } from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface V10LoadResult {
  readonly train: readonly DatasetEpisode[];
  readonly validation: readonly DatasetEpisode[];
  readonly unseenTest: readonly DatasetEpisode[];
  readonly totalEpisodes: number;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly sha256Verified: boolean;
}

export class V10DatasetLoader {
  private static readonly DATASET_ROOT = path.join(
    process.cwd(),
    'datasets',
    'cubio',
    'v1.0-expanded-conversational'
  );
  private static readonly MANIFEST_PATH = path.join(
    V10DatasetLoader.DATASET_ROOT,
    'metadata',
    'dataset_manifest.json'
  );

  public static loadDataset(): V10LoadResult {
    ExternalModelGuard.assertNativeOnly('V10_DATASET_LOADER');

    if (!fs.existsSync(V10DatasetLoader.MANIFEST_PATH)) {
      throw new Error(`[V10_LOADER] Manifest not found: ${V10DatasetLoader.MANIFEST_PATH}`);
    }

    const manifestRaw = fs.readFileSync(V10DatasetLoader.MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    const fm = manifest.file_manifest;

    const train = V10DatasetLoader.loadSplitFile(
      'episodes/train.jsonl',
      fm['episodes/train.jsonl'].sha256,
      fm['episodes/train.jsonl'].episodes
    );

    const validation = V10DatasetLoader.loadSplitFile(
      'episodes/validation.jsonl',
      fm['episodes/validation.jsonl'].sha256,
      fm['episodes/validation.jsonl'].episodes
    );

    const unseenTest = V10DatasetLoader.loadSplitFile(
      'episodes/test.jsonl',
      fm['episodes/test.jsonl'].sha256,
      fm['episodes/test.jsonl'].episodes
    );

    const totalEpisodes = train.length + validation.length + unseenTest.length;

    return Object.freeze({
      train: Object.freeze(train),
      validation: Object.freeze(validation),
      unseenTest: Object.freeze(unseenTest),
      totalEpisodes,
      datasetId: manifest.dataset_id,
      datasetVersion: 'v1.0-expanded-conversational',
      sha256Verified: true,
    });
  }

  private static loadSplitFile(
    relPath: string,
    expectedSha256: string,
    expectedCount: number
  ): DatasetEpisode[] {
    const fullPath = path.join(V10DatasetLoader.DATASET_ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[V10_LOADER] Dataset file not found: ${fullPath}`);
    }

    const fileBytes = fs.readFileSync(fullPath);
    const actualHash = createHash('sha256').update(fileBytes).digest('hex');
    if (actualHash !== expectedSha256) {
      throw new Error(
        `[V10_LOADER] SHA256 MISMATCH for ${relPath}: expected ${expectedSha256}, got ${actualHash}`
      );
    }

    const lines = fileBytes.toString('utf-8').trim().split('\n');
    if (lines.length !== expectedCount) {
      throw new Error(
        `[V10_LOADER] Count mismatch for ${relPath}: expected ${expectedCount}, got ${lines.length}`
      );
    }

    const episodes: DatasetEpisode[] = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = JSON.parse(lines[i]);
      episodes.push(
        Object.freeze({
          id: raw.episodeId,
          category: raw.category,
          prompt: raw.prompt,
          completion: raw.completion,
          epistemicStatus: raw.epistemicStatus as EpistemicStatus,
          spatialCellId: raw.spatialCellId,
          address369: raw.address369,
        })
      );
    }
    return episodes;
  }

  public static toDatasetSplit(loaded: V10LoadResult): DatasetSplit {
    const trainPrompts = new Set<string>(loaded.train.map((e) => e.prompt.toLowerCase().trim()));
    const trainHashes = new Set<string>(
      loaded.train.map((e) => createHash('sha256').update(e.prompt).digest('hex'))
    );

    let overlapCount = 0;
    for (const ep of loaded.unseenTest) {
      const norm = ep.prompt.toLowerCase().trim();
      const h = createHash('sha256').update(ep.prompt).digest('hex');
      if (trainPrompts.has(norm) || trainHashes.has(h)) overlapCount++;
    }

    return Object.freeze({
      train: loaded.train,
      validation: loaded.validation,
      unseenTest: loaded.unseenTest,
      totalEpisodes: loaded.totalEpisodes,
      trainTestOverlapCount: overlapCount,
      manifestHash: loaded.datasetId,
    });
  }
}
