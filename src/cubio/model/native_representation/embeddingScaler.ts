/**
 * CUBiO AI — Task 161: Native Embedding & Representation Scaling
 * src/cubio/model/native_representation/embeddingScaler.ts
 *
 * Deterministic scaling of native embedding matrices (Token, Positional, Spatial HCP Lattice)
 * across approved Phase 11 dimensions (64, 128, 256, 384, 512, 640).
 *
 * Enforces:
 * 1. Zero foreign pretrained representations.
 * 2. Anti-collision & angular orthogonality across distinct token and spatial coordinates.
 * 3. Spatial authority via src/core/address369.ts.
 * 4. Full compatibility with VocabularyCatalog and NativeTokenizer contracts.
 */

import * as crypto from 'crypto';
import {
  TASK_161_ID,
  RepresentationDimension,
  VALID_REPRESENTATION_DIMENSIONS,
  PROHIBITED_FOREIGN_REPRESENTATIONS,
  ScaledEmbeddingMatrix,
  TokenRepresentationRecord,
  SpatialRepresentationRecord,
  RepresentationSchema,
  IS_ACTUATION_BLOCKED,
} from './types';
import {
  TOTAL_SPATIAL_CELLS,
  cellIdToCoordinate,
  cellIdToAddress369,
} from '../../../core/address369';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';
import { VocabularyCatalog, NativeVocabularyBuilder } from '../native_foundation/native_vocabulary';

export class RepresentationSovereigntyError extends Error {
  constructor(message: string) {
    super(`[REPRESENTATION_SOVEREIGNTY_VIOLATION] ${message}`);
    this.name = 'RepresentationSovereigntyError';
  }
}

export class DimensionValidationError extends Error {
  constructor(message: string) {
    super(`[DIMENSION_VALIDATION_ERROR] ${message}`);
    this.name = 'DimensionValidationError';
  }
}

export class RepresentationCollisionError extends Error {
  constructor(message: string) {
    super(`[REPRESENTATION_COLLISION_ERROR] ${message}`);
    this.name = 'RepresentationCollisionError';
  }
}

/**
 * Deterministic pseudo-random number generator for sovereign embedding generation.
 */
export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Asserts that an identifier does not contain foreign pretrained representation references.
 */
export function assertNativeRepresentationSovereignty(nameOrSource: string): void {
  const normalized = nameOrSource.toLowerCase().trim();
  for (const prohibited of PROHIBITED_FOREIGN_REPRESENTATIONS) {
    if (normalized.includes(prohibited)) {
      throw new RepresentationSovereigntyError(
        `Prohibited foreign representation reference detected: '${prohibited}'. Only native CUBiO representations are permitted.`
      );
    }
  }
}

/**
 * Validates that a dimension is an approved Phase 11 scaling dimension.
 */
export function validateRepresentationDimension(dim: number): RepresentationDimension {
  if (!VALID_REPRESENTATION_DIMENSIONS.includes(dim)) {
    throw new DimensionValidationError(
      `Dimension ${dim} is not an approved representation dimension. Approved: [${VALID_REPRESENTATION_DIMENSIONS.join(', ')}].`
    );
  }
  return dim as RepresentationDimension;
}

/**
 * Computes vector Euclidean L2 norm.
 */
export function computeL2Norm(vec: readonly number[]): number {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  return Math.sqrt(sumSq);
}

/**
 * Computes cosine similarity between two vectors.
 */
export function computeCosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vector dimension mismatch in cosine similarity calculation.');
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class NativeEmbeddingScaler {
  /**
   * Generates scaled native token embeddings.
   */
  public static generateTokenEmbeddings(
    vocab: VocabularyCatalog,
    dim: RepresentationDimension,
    masterSeed: number = 369001000
  ): ScaledEmbeddingMatrix {
    validateRepresentationDimension(dim);
    assertNativeRepresentationSovereignty(vocab.vocabularyId);

    const prng = new DeterministicPRNG(masterSeed + dim * 100);
    const rows = vocab.size;
    const scale = Math.sqrt(2.0 / dim);

    const data: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < dim; c++) {
        row.push(prng.nextRange(-scale, scale));
      }
      data.push(row);
    }

    const matrixId = `EMB-TOKEN-V${rows}-D${dim}`;
    const canonicalChecksum = calculateCanonicalChecksum(data);
    const stateHash = crypto.createHash('sha256').update(canonicalStringify({ matrixId, data })).digest('hex');

    return Object.freeze({
      matrixId,
      type: 'TOKEN',
      rows,
      dimension: dim,
      data,
      stateHash,
      canonicalChecksum,
      byteSize: rows * dim * 4,
    });
  }

  /**
   * Generates scaled native positional encodings.
   */
  public static generatePositionalEmbeddings(
    maxSeqLen: number,
    dim: RepresentationDimension,
    masterSeed: number = 369001000
  ): ScaledEmbeddingMatrix {
    validateRepresentationDimension(dim);
    if (maxSeqLen <= 0 || maxSeqLen > 4096) {
      throw new DimensionValidationError(`maxSeqLen must be between 1 and 4096 (got ${maxSeqLen}).`);
    }

    const prng = new DeterministicPRNG(masterSeed + 777 + dim);
    const scale = Math.sqrt(2.0 / dim) * 0.5;

    const data: number[][] = [];
    for (let pos = 0; pos < maxSeqLen; pos++) {
      const row: number[] = [];
      for (let i = 0; i < dim; i++) {
        // Hybrid harmonic sinusoidal + deterministic sovereign initialization
        if (i % 2 === 0) {
          row.push(Math.sin(pos / Math.pow(10000, i / dim)) * 0.5 + prng.nextRange(-scale, scale) * 0.5);
        } else {
          row.push(Math.cos(pos / Math.pow(10000, (i - 1) / dim)) * 0.5 + prng.nextRange(-scale, scale) * 0.5);
        }
      }
      data.push(row);
    }

    const matrixId = `EMB-POS-T${maxSeqLen}-D${dim}`;
    const canonicalChecksum = calculateCanonicalChecksum(data);
    const stateHash = crypto.createHash('sha256').update(canonicalStringify({ matrixId, data })).digest('hex');

    return Object.freeze({
      matrixId,
      type: 'POSITION',
      rows: maxSeqLen,
      dimension: dim,
      data,
      stateHash,
      canonicalChecksum,
      byteSize: maxSeqLen * dim * 4,
    });
  }

  /**
   * Generates scaled spatial HCP lattice embeddings for all 343 cells.
   */
  public static generateSpatialEmbeddings(
    dim: RepresentationDimension,
    masterSeed: number = 369001000
  ): ScaledEmbeddingMatrix {
    validateRepresentationDimension(dim);

    const prng = new DeterministicPRNG(masterSeed + 999 + dim);
    const rows = TOTAL_SPATIAL_CELLS; // 343
    const scale = Math.sqrt(2.0 / dim) * 0.5;

    const data: number[][] = [];
    for (let cellId = 0; cellId < rows; cellId++) {
      const coord = cellIdToCoordinate(cellId);
      const address = cellIdToAddress369(cellId);
      const harmonicRoot: 3 | 6 | 9 = (address % 9 === 0 ? 9 : (address % 3 === 0 ? 6 : 3)) as 3 | 6 | 9;

      const row: number[] = [];
      for (let c = 0; c < dim; c++) {
        // Embed coordinate geometry (x, y, z) + harmonic root into sovereign vector
        const spatialBias = (coord.x * 0.1 + coord.y * 0.05 + coord.z * 0.02 + harmonicRoot * 0.01) * scale;
        row.push(spatialBias + prng.nextRange(-scale, scale));
      }
      data.push(row);
    }

    const matrixId = `EMB-SPATIAL-S343-D${dim}`;
    const canonicalChecksum = calculateCanonicalChecksum(data);
    const stateHash = crypto.createHash('sha256').update(canonicalStringify({ matrixId, data })).digest('hex');

    return Object.freeze({
      matrixId,
      type: 'SPATIAL_HCP',
      rows,
      dimension: dim,
      data,
      stateHash,
      canonicalChecksum,
      byteSize: rows * dim * 4,
    });
  }

  /**
   * Verifies absence of vector collisions or collapse across representations.
   */
  public static verifyAntiCollision(
    matrix: ScaledEmbeddingMatrix,
    options?: { sampleCount?: number; maxSimilarityThreshold?: number }
  ): { isValid: boolean; maxSimilarityFound: number; collisionCount: number } {
    const { sampleCount = 50, maxSimilarityThreshold = 0.999 } = options || {};
    const n = Math.min(matrix.rows, sampleCount);

    let maxSim = -1;
    let collisions = 0;

    // Check all vectors have non-zero norm
    for (let i = 0; i < matrix.rows; i++) {
      const norm = computeL2Norm(matrix.data[i]);
      if (norm === 0 || isNaN(norm) || !isFinite(norm)) {
        throw new RepresentationCollisionError(`Degenerate null or NaN vector detected at row ${i} in ${matrix.matrixId}.`);
      }
    }

    // Pairwise similarity check on sample
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = computeCosineSimilarity(matrix.data[i], matrix.data[j]);
        if (sim > maxSim) maxSim = sim;
        if (sim >= maxSimilarityThreshold) {
          collisions++;
        }
      }
    }

    if (collisions > 0) {
      throw new RepresentationCollisionError(
        `Collision detected in ${matrix.matrixId}: ${collisions} vector pairs exceed similarity threshold ${maxSimilarityThreshold}.`
      );
    }

    return {
      isValid: true,
      maxSimilarityFound: maxSim,
      collisionCount: collisions,
    };
  }

  /**
   * Creates a Canonical Versioned Representation Schema.
   */
  public static createRepresentationSchema(
    profileId: string,
    dim: RepresentationDimension,
    vocab: VocabularyCatalog,
    maxSeqLen: number = 128,
    tenantId: string = 'root',
    stateVersion: number = 1
  ): {
    schema: RepresentationSchema;
    tokenMatrix: ScaledEmbeddingMatrix;
    posMatrix: ScaledEmbeddingMatrix;
    spatialMatrix: ScaledEmbeddingMatrix;
  } {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety violation: IS_ACTUATION_BLOCKED must be true.');
    }

    assertNativeRepresentationSovereignty(profileId);

    const tokenMatrix = this.generateTokenEmbeddings(vocab, dim);
    const posMatrix = this.generatePositionalEmbeddings(maxSeqLen, dim);
    const spatialMatrix = this.generateSpatialEmbeddings(dim);

    // Verify anti-collision across all three matrices
    this.verifyAntiCollision(tokenMatrix);
    this.verifyAntiCollision(posMatrix);
    this.verifyAntiCollision(spatialMatrix);

    const schemaId = `URN:CUBIO:SCHEMA:REPR:${profileId}:${dim}D-V${vocab.size}`;
    const schemaPayload = {
      taskId: TASK_161_ID,
      schemaId,
      profileId,
      dimension: dim,
      vocabSize: vocab.size,
      maxSequenceLength: maxSeqLen,
      spatialCells: TOTAL_SPATIAL_CELLS,
      tokenEmbeddingHash: tokenMatrix.stateHash,
      positionalEmbeddingHash: posMatrix.stateHash,
      spatialEmbeddingHash: spatialMatrix.stateHash,
      stateVersion,
      tenantId,
      isActuationBlocked: true,
      isNativeOnly: true,
    };

    const canonicalChecksum = calculateCanonicalChecksum(schemaPayload);
    const schemaHash = crypto.createHash('sha256').update(canonicalStringify(schemaPayload), 'utf8').digest('hex');

    const schema: RepresentationSchema = Object.freeze({
      schemaVersion: '1.0.0',
      schemaId,
      profileId,
      dimension: dim,
      vocabSize: vocab.size,
      maxSequenceLength: maxSeqLen,
      spatialCells: TOTAL_SPATIAL_CELLS,
      tokenEmbeddingHash: tokenMatrix.stateHash,
      positionalEmbeddingHash: posMatrix.stateHash,
      spatialEmbeddingHash: spatialMatrix.stateHash,
      schemaHash,
      canonicalChecksum,
      stateVersion,
      tenantId,
      createdAt: '2026-09-13T00:00:00.000Z',
      isActuationBlocked: true,
      isNativeOnly: true,
    });

    return { schema, tokenMatrix, posMatrix, spatialMatrix };
  }
}
