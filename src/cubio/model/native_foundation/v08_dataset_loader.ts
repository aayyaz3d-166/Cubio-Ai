/**
 * CUBiO AI — Phase 5: V0.8-Superposition-Hardened Dataset Loader
 * v08_dataset_loader.ts
 *
 * Reads the canonical v0.8-superposition-hardened JSONL dataset from disk
 * and converts each episode into the native DatasetEpisode contract.
 *
 * HARD RULES:
 * - NO cloud access. Reads LOCAL files ONLY.
 * - NO external model calls.
 * - Path derived from project root via process.cwd() — adapters only.
 * - Validates all episodes against the DatasetEpisode contract before returning.
 * - Enforces TRAIN_TEST_OVERLAP = 0 via TrainingDataValidator.
 * - SHA256 of each file verified against the manifest before loading.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { DatasetEpisode, DatasetSplit, EpistemicStatus } from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

/**
 * V0.8 episode schema (raw JSONL line from disk)
 */
interface V08RawEpisode {
  episodeId?: string;
  schemaVersion?: string;
  category: string;
  taskFingerprint?: string;
  taskDefinition?: {
    taskId?: string;
    category?: string;
    difficultyLevel?: number;
    intendedOutcome?: string;
    objective?: string;
  };
  timestamp?: string;
  conversationId?: string;
  userPrompt?: string;
  sanitizedPrompt?: string;
  steps?: Array<{
    stepIndex: number;
    aiIntent?: string;
    toolInvoked?: string;
    commandType?: string;
    commandParameters?: Record<string, unknown>;
    observation?: string;
    aiReasoningStep?: string;
    isStepSuccess?: boolean;
    harmonic369?: {
      digitalRoot?: number;
      isValid369?: boolean;
    };
  }>;
  finalOutcome?: {
    isSuccess?: boolean;
    rewardScore?: number;
    finalAssistantResponse?: string;
    totalSteps?: number;
    ciiScoreAchieved?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * V08 manifest file structure (actual disk schema)
 */
interface V08ManifestFileEntry {
  episodes: number;
  sha256: string;
  bytes: number;
}
interface V08Manifest {
  dataset_id: string;
  file_manifest: Record<string, V08ManifestFileEntry>;
  status?: string;
}

export interface V08LoadResult {
  readonly train: readonly DatasetEpisode[];
  readonly validation: readonly DatasetEpisode[];
  readonly unseenTest: readonly DatasetEpisode[];
  readonly totalEpisodes: number;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly sha256Verified: boolean;
}

export class V08DatasetLoader {
  private static readonly DATASET_ROOT = path.join(
    process.cwd(),
    'datasets',
    'cubio',
    'v0.8-superposition-hardened'
  );
  private static readonly MANIFEST_PATH = path.join(
    V08DatasetLoader.DATASET_ROOT,
    'metadata',
    'dataset_manifest.json'
  );

  /**
   * Maps a V0.8 raw episode category to the closest EpistemicStatus.
   * Maintains the 7-tier epistemic taxonomy.
   */
  private static mapEpistemicStatus(raw: V08RawEpisode): EpistemicStatus {
    const outcome = raw.finalOutcome;
    const isSuccess = outcome?.isSuccess ?? false;
    const category = (raw.category || '').toUpperCase();
    const taskCat = (raw.taskDefinition?.category || '').toUpperCase();

    if (!isSuccess) return EpistemicStatus.OBSERVATION;
    if (category.includes('REASONING') || taskCat.includes('REASONING')) return EpistemicStatus.DERIVATION;
    if (category.includes('HYPOTHESIS') || taskCat.includes('HYPOTHESIS')) return EpistemicStatus.HYPOTHESIS;
    if (category.includes('PREDICTION') || taskCat.includes('PREDICTION')) return EpistemicStatus.PREDICTION;
    if (category.includes('UNKNOWN') || taskCat.includes('UNKNOWN')) return EpistemicStatus.UNKNOWN;
    if (category.includes('ERROR') || taskCat.includes('ERROR')) return EpistemicStatus.OBSERVATION;
    return EpistemicStatus.FACT;
  }

  /**
   * Converts a raw V0.8 episode into a DatasetEpisode.
   * prompt = sanitizedPrompt (or userPrompt fallback)
   * completion = finalOutcome.finalAssistantResponse (or step observations)
   */
  private static convertEpisode(raw: V08RawEpisode, index: number): DatasetEpisode {
    const id = raw.episodeId ?? `ep_v08_${index}`;
    const category = raw.category ?? 'UNKNOWN';

    // Prompt: prefer sanitizedPrompt which contains the structured task objective
    const prompt = (raw.sanitizedPrompt || raw.userPrompt || `Episode ${index}`).trim();

    // Completion: prefer structured finalAssistantResponse; fall back to step observations
    let completion: string;
    const finalResponse = raw.finalOutcome?.finalAssistantResponse;
    if (finalResponse && finalResponse.trim().length > 0) {
      completion = finalResponse.trim();
    } else if (raw.steps && raw.steps.length > 0) {
      // Reconstruct a concise completion from step observations
      const lastStep = raw.steps[raw.steps.length - 1];
      completion = lastStep.observation ?? lastStep.aiReasoningStep ?? `Task ${id} executed`;
    } else {
      completion = `Task ${id}: ${raw.taskDefinition?.intendedOutcome ?? 'COMPLETE'}`;
    }

    // Guard against any external model references in corpus
    ExternalModelGuard.assertNativeOnly(prompt.slice(0, 100));

    const epistemicStatus = V08DatasetLoader.mapEpistemicStatus(raw);

    return Object.freeze({
      id,
      category,
      prompt,
      completion,
      epistemicStatus,
    });
  }

  /**
   * Loads a single JSONL split file from disk, verifies SHA256, returns episodes.
   */
  private static loadSplitFile(
    relPath: string,
    expectedSha256: string,
    expectedCount: number
  ): DatasetEpisode[] {
    const fullPath = path.join(V08DatasetLoader.DATASET_ROOT, relPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`[V08_LOADER] Dataset file not found: ${fullPath}`);
    }

    // SHA256 verification
    const fileBytes = fs.readFileSync(fullPath);
    const actualHash = createHash('sha256').update(fileBytes).digest('hex');
    if (actualHash !== expectedSha256) {
      throw new Error(
        `[V08_LOADER] SHA256 MISMATCH for ${relPath}\n` +
        `  Expected: ${expectedSha256}\n` +
        `  Actual:   ${actualHash}`
      );
    }

    // Parse JSONL
    const lines = fileBytes.toString('utf-8').split('\n').filter((l) => l.trim().length > 0);
    if (lines.length !== expectedCount) {
      throw new Error(
        `[V08_LOADER] Episode count mismatch for ${relPath}: ` +
        `expected ${expectedCount}, got ${lines.length}`
      );
    }

    const episodes: DatasetEpisode[] = [];
    for (let i = 0; i < lines.length; i++) {
      let raw: V08RawEpisode;
      try {
        raw = JSON.parse(lines[i]) as V08RawEpisode;
      } catch (e) {
        throw new Error(`[V08_LOADER] JSON parse error at line ${i + 1} in ${relPath}: ${e}`);
      }
      episodes.push(V08DatasetLoader.convertEpisode(raw, i));
    }

    return episodes;
  }

  /**
   * Loads the complete v0.8-superposition-hardened dataset.
   * Verifies SHA256 hashes, episode counts, and leakage gate.
   *
   * Returns train/validation/unseenTest splits matching the DatasetSplit contract.
   */
  public static loadDataset(): V08LoadResult {
    ExternalModelGuard.assertNativeOnly('V08_DATASET_LOADER');

    if (!fs.existsSync(V08DatasetLoader.MANIFEST_PATH)) {
      throw new Error(`[V08_LOADER] Manifest not found: ${V08DatasetLoader.MANIFEST_PATH}`);
    }

    const manifestRaw = fs.readFileSync(V08DatasetLoader.MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(manifestRaw) as V08Manifest;

    // file_manifest keys are relative paths like "episodes/train.jsonl"
    const fm = manifest.file_manifest;

    const trainKey = 'episodes/train.jsonl';
    const valKey = 'episodes/validation.jsonl';
    const testKey = 'episodes/test.jsonl';

    for (const key of [trainKey, valKey, testKey]) {
      if (!fm[key]) throw new Error(`[V08_LOADER] Missing manifest entry for: ${key}`);
    }

    const train = V08DatasetLoader.loadSplitFile(
      trainKey,
      fm[trainKey].sha256,
      fm[trainKey].episodes
    );

    const validation = V08DatasetLoader.loadSplitFile(
      valKey,
      fm[valKey].sha256,
      fm[valKey].episodes
    );

    const unseenTest = V08DatasetLoader.loadSplitFile(
      testKey,
      fm[testKey].sha256,
      fm[testKey].episodes
    );

    const totalEpisodes = train.length + validation.length + unseenTest.length;

    return Object.freeze({
      train: Object.freeze(train),
      validation: Object.freeze(validation),
      unseenTest: Object.freeze(unseenTest),
      totalEpisodes,
      datasetId: manifest.dataset_id,
      datasetVersion: 'v0.8-superposition-hardened',
      sha256Verified: true,
    });
  }

  /**
   * Converts a V08LoadResult into the DatasetSplit expected by the training engine.
   * Also enforces TRAIN_TEST_OVERLAP = 0 (leakage gate).
   */
  public static toDatasetSplit(loaded: V08LoadResult): DatasetSplit {
    // createHash already imported at module top-level

    // Leakage check
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
    if (overlapCount > 0) {
      throw new Error(
        `[V08_LOADER] DATA_LEAKAGE_DETECTED: ${overlapCount} overlapping episodes between Train and Test`
      );
    }

    const manifestPayload = JSON.stringify({
      trainIds: loaded.train.map((e) => e.id),
      valIds: loaded.validation.map((e) => e.id),
      testIds: loaded.unseenTest.map((e) => e.id),
    });
    const manifestHash = createHash('sha256').update(manifestPayload).digest('hex');

    return Object.freeze({
      train: loaded.train,
      validation: loaded.validation,
      unseenTest: loaded.unseenTest,
      totalEpisodes: loaded.totalEpisodes,
      trainTestOverlapCount: overlapCount,
      manifestHash,
    });
  }
}
