/**
 * CUBiO AI — Task 161: Native Embedding & Representation Scaling
 * src/cubio/model/native_representation/representationCheckpoint.ts
 *
 * Checkpoint export and restoration for scaled native representations:
 * - Primary storage remains in VDB.
 * - .3dmemory format serves strictly as backup and streaming transport.
 * - Tamper detection and bitwise integrity verification fail-closed.
 */

import * as crypto from 'crypto';
import {
  RepresentationSchema,
  ScaledEmbeddingMatrix,
  RepresentationCheckpointRecord,
  IS_ACTUATION_BLOCKED,
} from './types';
import { canonicalStringify } from '../../core/canonicalIdentity';

export class RepresentationCheckpointError extends Error {
  constructor(message: string) {
    super(`[REPRESENTATION_CHECKPOINT_ERROR] ${message}`);
    this.name = 'RepresentationCheckpointError';
  }
}

export class RepresentationCheckpointManager {
  /**
   * Exports representation schema and associated matrices into a streaming .3dmemory checkpoint.
   */
  public static exportToCheckpoint(
    schema: RepresentationSchema,
    matrices: readonly ScaledEmbeddingMatrix[],
    vdbSynced: boolean = true
  ): RepresentationCheckpointRecord {
    if (!IS_ACTUATION_BLOCKED) {
      throw new RepresentationCheckpointError('Actuation lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const checkpointId = `CHK-REPR-${schema.dimension}D-${Date.now()}`;

    const serializedData = {
      schema,
      matrixDigests: matrices.map((m) => ({
        matrixId: m.matrixId,
        type: m.type,
        rows: m.rows,
        dimension: m.dimension,
        stateHash: m.stateHash,
        checksum: m.canonicalChecksum,
      })),
      matrices,
    };

    const payload = Buffer.from(JSON.stringify(serializedData)).toString('base64');
    const stateHash = crypto.createHash('sha256').update(canonicalStringify(serializedData)).digest('hex');

    return Object.freeze({
      checkpointId,
      schemaId: schema.schemaId,
      tenantId: schema.tenantId,
      stateVersion: schema.stateVersion,
      dimension: schema.dimension,
      schemaHash: schema.schemaHash,
      stateHash,
      vdbSynced,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Restores representation schema and matrices from a .3dmemory checkpoint.
   */
  public static restoreFromCheckpoint(
    checkpoint: RepresentationCheckpointRecord
  ): { schema: RepresentationSchema; matrices: ScaledEmbeddingMatrix[] } {
    if (!checkpoint.payload || !checkpoint.stateHash) {
      throw new RepresentationCheckpointError('Corrupted checkpoint: missing payload or stateHash.');
    }

    const jsonStr = Buffer.from(checkpoint.payload, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    const recomputedHash = crypto.createHash('sha256').update(canonicalStringify(parsed)).digest('hex');
    if (recomputedHash !== checkpoint.stateHash) {
      throw new RepresentationCheckpointError(
        `Cryptographic integrity failure: checkpoint payload hash (${recomputedHash.slice(0, 16)}) does not match stateHash (${checkpoint.stateHash.slice(0, 16)}).`
      );
    }

    return {
      schema: parsed.schema,
      matrices: parsed.matrices,
    };
  }
}
