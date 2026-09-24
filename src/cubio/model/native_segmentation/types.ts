/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/types.ts
 *
 * Universal contracts, boundary descriptors, and domain errors for native
 * deterministic segmentation of large context streams.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, NLTK, spaCy, HuggingFace).
 * 2. Deterministic segmentation across repeated runs (A = B = C, Delta = 0).
 * 3. Canonical chunk IDs, boundaries, SHA-256 checksums, and provenance.
 * 4. Primary VDB persistence without data duplication; load-on-demand references.
 * 5. Strict multi-tenant isolation and anti-corruption assembly verification.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_173_ID = 'CUBIO-TASK-173-CONTEXT-SEGMENTATION-CHUNKING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Segmentation modes for slicing context streams.
 */
export const SegmentationMode = {
  STRUCTURAL: 'STRUCTURAL',   // Paragraphs, markdown headers, code fences, sentences
  SEMANTIC: 'SEMANTIC',       // Topic shifts, epistemic transitions, spatial anchors
  FIXED_TOKEN: 'FIXED_TOKEN', // Strict token count boundaries with overlap
  HYBRID: 'HYBRID',           // Structural boundaries with fixed-token length governance
} as const;

export type SegmentationMode = (typeof SegmentationMode)[keyof typeof SegmentationMode];

/**
 * Types of structural/semantic boundaries detected.
 */
export type BoundaryType =
  | 'PARAGRAPH'
  | 'MARKDOWN_HEADING'
  | 'CODE_BLOCK'
  | 'SENTENCE'
  | 'SPATIAL_ANCHOR'
  | 'TOKEN_WINDOW'
  | 'STREAM_START'
  | 'STREAM_END';

/**
 * Boundary coordinates marking the chunk limits within the source document.
 */
export interface ChunkBoundary {
  readonly startChar: number;
  readonly endChar: number;
  readonly startToken: number;
  readonly endToken: number;
  readonly primaryBoundaryType: BoundaryType;
}

/**
 * Full canonical chunk holding content and metadata.
 */
export interface CanonicalChunk {
  readonly chunkId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly sequenceIndex: number;
  readonly boundary: ChunkBoundary;
  readonly tokenCount: number;
  readonly content: string;
  readonly checksum: string; // SHA-256 of content
  readonly spatialCellId?: number; // 0..342
  readonly epistemicStatus: string;
  readonly isPinnedAnchor: boolean;
  readonly provenance: ChunkProvenance;
}

/**
 * Lightweight chunk reference held in memory/indices without raw text payload.
 */
export interface ChunkReference {
  readonly chunkId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly sequenceIndex: number;
  readonly boundary: ChunkBoundary;
  readonly tokenCount: number;
  readonly byteLength: number;
  readonly checksum: string;
  readonly contentSummary: string; // Preview (<= 64 chars)
  readonly spatialCellId?: number;
  readonly epistemicStatus: string;
  readonly isPinnedAnchor: boolean;
  readonly provenance: ChunkProvenance;
}

/**
 * Provenance tracking origin and creation context of a chunk.
 */
export interface ChunkProvenance {
  readonly sourceDocId: string;
  readonly creationTimestamp: string;
  readonly segmentationMode: SegmentationMode;
  readonly generatorVersion: string;
  readonly parentChecksum?: string;
}

/**
 * Configuration options for the segmentation engine.
 */
export interface SegmentationConfig {
  readonly mode: SegmentationMode;
  readonly targetChunkTokens: number;
  readonly maxChunkTokens: number;
  readonly minChunkTokens: number;
  readonly overlapTokens: number;
  readonly preserveCodeBlocks: boolean;
  readonly preserveMarkdownHeaders: boolean;
  readonly pinFirstChunkAsAnchor: boolean;
}

/**
 * Result returned after segmenting a stream.
 */
export interface SegmentationResult {
  readonly sourceDocId: string;
  readonly tenantId: string;
  readonly mode: SegmentationMode;
  readonly totalChars: number;
  readonly totalTokens: number;
  readonly chunkCount: number;
  readonly references: readonly ChunkReference[];
  readonly segmentationDigest: string; // SHA-256 over all chunk checksums & boundaries
  readonly executionTimeMs: number;
}

/**
 * Prohibited foreign chunking and text-splitting libraries.
 */
export const PROHIBITED_SEGMENTATION_LIBRARIES: readonly string[] = Object.freeze([
  'langchain',
  'llamaindex',
  'llama-index',
  'nltk',
  'spacy',
  'semantic-text-splitter',
  'tiktoken',
  'tree-sitter',
]);

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class SegmentationError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'SEGMENTATION_ERROR') {
    super(`[Segmentation] ${message}`);
    this.name = 'SegmentationError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class SegmentationTenantViolationError extends SegmentationError {
  public readonly requestedTenant: string;
  public readonly actualTenant: string;

  constructor(requestedTenant: string, actualTenant: string) {
    super(
      `Tenant isolation breach: requested "${requestedTenant}", but chunk belongs to "${actualTenant}".`,
      'SEGMENTATION_TENANT_VIOLATION'
    );
    this.name = 'SegmentationTenantViolationError';
    this.requestedTenant = requestedTenant;
    this.actualTenant = actualTenant;
  }
}

export class SegmentationIntegrityError extends SegmentationError {
  constructor(message: string) {
    super(message, 'SEGMENTATION_INTEGRITY_ERROR');
    this.name = 'SegmentationIntegrityError';
  }
}

export class SegmentationActuationBlockedError extends SegmentationError {
  constructor(directive?: string) {
    super(
      `Hardware actuation attempt blocked fail-closed: "${directive ?? 'ACTUATION_DIRECTIVE'}". IS_ACTUATION_BLOCKED=true permanently.`,
      'SEGMENTATION_ACTUATION_BLOCKED'
    );
    this.name = 'SegmentationActuationBlockedError';
  }
}

export class SegmentationForeignFrameworkError extends SegmentationError {
  constructor(framework: string) {
    super(
      `Prohibited foreign segmentation framework detected: "${framework}". Pure native TypeScript architecture required.`,
      'SEGMENTATION_FOREIGN_FRAMEWORK_ERROR'
    );
    this.name = 'SegmentationForeignFrameworkError';
  }
}
