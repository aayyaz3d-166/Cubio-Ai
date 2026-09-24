/**
 * CUBiO AI — Task 161: Native Embedding & Representation Scaling
 * src/cubio/model/native_representation/types.ts
 *
 * Authoritative contracts, schema specifications, and type interfaces
 * for scaling native embedding and internal representation capacity.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign pretrained representations (no Word2Vec, GloVe, FastText, BERT, OpenAI, Cohere, etc.).
 * 2. Exact dimensional scaling: d in {64, 128, 256, 384, 512, 640}.
 * 3. Spatial authority: 343-cell HCP lattice + 26 symbolic anchors = Address 369.
 * 4. Primary authority: VDB is primary persistent storage; .3dmemory is checkpoint/transport only.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_161_ID = 'CUBIO-TASK-161-NATIVE-EMBEDDING-REPRESENTATION-SCALING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Approved representation dimensions across scaling profiles.
 */
export const RepresentationDimension = {
  DIM_64: 64,     // 219K Baseline
  DIM_128: 128,   // 1M Edge Profile
  DIM_256: 256,   // 5M Compact Profile
  DIM_384: 384,   // 20M Balanced Profile
  DIM_512: 512,   // 50M Extended Profile
  DIM_640: 640,   // 100M Sovereign Profile
} as const;

export type RepresentationDimension = (typeof RepresentationDimension)[keyof typeof RepresentationDimension];

export const VALID_REPRESENTATION_DIMENSIONS: readonly number[] = Object.freeze([64, 128, 256, 384, 512, 640]);

/**
 * Prohibited foreign representation families and libraries.
 */
export const PROHIBITED_FOREIGN_REPRESENTATIONS: readonly string[] = Object.freeze([
  'word2vec',
  'glove',
  'fasttext',
  'bert',
  'roberta',
  'openai',
  'cohere',
  'clip',
  'sentence-transformers',
  'bge',
  'e5',
  'voyage',
  'jina',
  'qwen',
  'llama',
]);

export type EmbeddingType = 'TOKEN' | 'POSITION' | 'SPATIAL_HCP';

/**
 * Concrete scaled embedding matrix.
 */
export interface ScaledEmbeddingMatrix {
  readonly matrixId: string;
  readonly type: EmbeddingType;
  readonly rows: number;
  readonly dimension: RepresentationDimension;
  readonly data: number[][];
  readonly stateHash: string;
  readonly canonicalChecksum: string;
  readonly byteSize: number;
}

/**
 * Record for an individual token representation vector.
 */
export interface TokenRepresentationRecord {
  readonly tokenId: number;
  readonly token: string;
  readonly dimension: RepresentationDimension;
  readonly vector: number[];
  readonly norm: number;
  readonly checksum: string;
}

/**
 * Record for an individual spatial representation vector mapped to Address 369.
 */
export interface SpatialRepresentationRecord {
  readonly cellId: number; // 0..342
  readonly address369: number; // 26..368
  readonly coordinate: readonly [number, number, number]; // [x, y, z] in 7x7x7 HCP lattice
  readonly harmonicRoot: 3 | 6 | 9;
  readonly dimension: RepresentationDimension;
  readonly vector: number[];
  readonly norm: number;
  readonly checksum: string;
}

/**
 * Canonical Versioned Representation Schema.
 */
export interface RepresentationSchema {
  readonly schemaVersion: string;
  readonly schemaId: string;
  readonly profileId: string;
  readonly dimension: RepresentationDimension;
  readonly vocabSize: number;
  readonly maxSequenceLength: number;
  readonly spatialCells: number; // 343
  readonly tokenEmbeddingHash: string;
  readonly positionalEmbeddingHash: string;
  readonly spatialEmbeddingHash: string;
  readonly schemaHash: string;
  readonly canonicalChecksum: string;
  readonly stateVersion: number;
  readonly tenantId: string;
  readonly createdAt: string;
  readonly isActuationBlocked: boolean;
  readonly isNativeOnly: boolean;
}

/**
 * Lightweight pointer/handle for VDB representation referencing without data duplication.
 * STORE ONCE -> REFERENCE EVERYWHERE -> LOAD ON DEMAND.
 */
export interface RepresentationAccessHandle {
  readonly handleId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly embeddingType: EmbeddingType;
  readonly dimension: RepresentationDimension;
  readonly rowCount: number;
  readonly estimatedBytes: number;
}

/**
 * Streaming .3dmemory representation checkpoint record.
 */
export interface RepresentationCheckpointRecord {
  readonly checkpointId: string;
  readonly schemaId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly dimension: RepresentationDimension;
  readonly schemaHash: string;
  readonly stateHash: string;
  readonly vdbSynced: boolean;
  readonly payload: string; // Base64 serialized matrices
  readonly timestamp: number;
}
