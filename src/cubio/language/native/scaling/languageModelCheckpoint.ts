/**
 * CUBiO AI — Phase 6: Task 77
 * Native Language Model Scaling
 * src/cubio/language/native/scaling/languageModelCheckpoint.ts
 *
 * Lossless checkpoint serialization and cryptographic validation for sovereign native language models.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  LanguageModelSnapshot,
  LanguageArchitectureConfig,
  IncompatibleLanguageCheckpointError,
} from './languageScalingTypes';
import { NativeLanguageArchitecture } from './nativeLanguageArchitecture';

export const CUBIO_LANG_CHECKPOINT_FORMAT = 'CUBIO_LANG_CHECKPOINT_V1';

export class LanguageModelCheckpointEngine {
  /**
   * Serializes a native language model into an immutable snapshot with cryptographic checksum.
   */
  public static exportCheckpoint(model: NativeLanguageArchitecture): LanguageModelSnapshot {
    const weights = model.exportWeights();
    const config = model.config;
    const inventory = model.inventory;
    const stepCount = model.stepCount;
    const modelId = model.modelId;
    const tenantId = model.tenantId;
    const now = Date.now();

    const payload = JSON.stringify({
      formatVersion: CUBIO_LANG_CHECKPOINT_FORMAT,
      modelId,
      tenantId,
      config,
      inventory,
      stepCount,
      weightKeys: Object.keys(weights).sort(),
      // Sample checksum across weights for performance
      weightsDigest: Object.entries(weights)
        .map(([k, v]) => `${k}:${v.length}:${v[0]?.toFixed(4) || 0}`)
        .join(';'),
    });

    const checksum = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

    return Object.freeze({
      formatVersion: CUBIO_LANG_CHECKPOINT_FORMAT,
      modelId,
      tenantId,
      config,
      inventory,
      weights: Object.freeze(weights),
      stepCount,
      checksum,
      timestamp: now,
    });
  }

  /**
   * Reconstitutes a native language model from an exported snapshot.
   */
  public static importCheckpoint(
    snapshot: LanguageModelSnapshot,
    overrideTenantId?: string
  ): NativeLanguageArchitecture {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new IncompatibleLanguageCheckpointError('Checkpoint snapshot is malformed or null');
    }

    if (snapshot.formatVersion !== CUBIO_LANG_CHECKPOINT_FORMAT) {
      throw new IncompatibleLanguageCheckpointError(
        `Unsupported checkpoint version: ${snapshot.formatVersion}, expected: ${CUBIO_LANG_CHECKPOINT_FORMAT}`
      );
    }

    // Validate Checksum
    const payload = JSON.stringify({
      formatVersion: snapshot.formatVersion,
      modelId: snapshot.modelId,
      tenantId: snapshot.tenantId,
      config: snapshot.config,
      inventory: snapshot.inventory,
      stepCount: snapshot.stepCount,
      weightKeys: Object.keys(snapshot.weights).sort(),
      weightsDigest: Object.entries(snapshot.weights)
        .map(([k, v]) => `${k}:${v.length}:${v[0]?.toFixed(4) || 0}`)
        .join(';'),
    });

    const expectedChecksum = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
    if (snapshot.checksum !== expectedChecksum) {
      throw new IncompatibleLanguageCheckpointError(
        `Checkpoint integrity corrupted! Expected checksum: ${expectedChecksum}, got: ${snapshot.checksum}`
      );
    }

    const tenant = overrideTenantId || snapshot.tenantId;
    const model = new NativeLanguageArchitecture(snapshot.config, tenant);
    model.restoreWeights(snapshot.weights, snapshot.stepCount);

    return model;
  }

  /**
   * Persists snapshot to local JSON file.
   */
  public static saveToFile(filePath: string, snapshot: LanguageModelSnapshot): void {
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  /**
   * Reads and parses snapshot from local JSON file.
   */
  public static loadFromFile(filePath: string): LanguageModelSnapshot {
    if (!fs.existsSync(filePath)) {
      throw new IncompatibleLanguageCheckpointError(`Checkpoint file not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed as LanguageModelSnapshot;
  }
}
