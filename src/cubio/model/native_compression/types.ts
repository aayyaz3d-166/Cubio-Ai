/**
 * CUBiO AI — Task 175: Context Compression & Summarization
 * src/cubio/model/native_compression/types.ts
 *
 * Universal contracts, compression modes, lineage descriptors, and domain
 * error classes for native context compression and summarization.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, NLTK, spaCy, or external LLM inference).
 * 2. Never replace canonical VDB facts with lossy summaries without preserving source references.
 * 3. Track complete compression lineage, source IDs, confidence, and grounding fidelity.
 * 4. Reject unsupported or fabricated compressed statements fail-closed.
 * 5. Strict multi-tenant isolation, OCC state integrity, and SHA-256 verification.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_175_ID = 'CUBIO-TASK-175-CONTEXT-COMPRESSION-SUMMARIZATION';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Native compression modes for reducing context length.
 */
export const CompressionMode = {
  EXTRACTIVE: 'EXTRACTIVE',                   // Salient proposition and key sentence extraction
  STRUCTURAL_OUTLINE: 'STRUCTURAL_OUTLINE',   // Header scaffolding, code signatures, spatial coordinates
  CANONICAL_INDEX: 'CANONICAL_INDEX',         // Dense reference index with keyword tags and boundaries
  HYBRID: 'HYBRID',                           // Structural scaffolding + top extractive core propositions
} as const;

export type CompressionMode = (typeof CompressionMode)[keyof typeof CompressionMode];

/**
 * Immutable reference to an underlying source chunk or VDB entity.
 */
export interface SourceReference {
  readonly objectId: string;
  readonly chunkId?: string;
  readonly checksum: string; // SHA-256 of uncompressed source chunk/record
  readonly tokenCount: number;
  readonly byteLength: number;
  readonly startChar?: number;
  readonly endChar?: number;
  readonly epistemicStatus?: string;
  readonly spatialCellId?: number;
}

/**
 * Complete cryptographic provenance and compression lineage.
 */
export interface CompressionLineage {
  readonly sourceDocIds: readonly string[];
  readonly sourceChunkIds: readonly string[];
  readonly originalTokenCount: number;
  readonly compressedTokenCount: number;
  readonly compressionRatio: number; // compressedTokenCount / originalTokenCount (<= 1.0)
  readonly tokenSavingsPercent: number; // (1 - compressionRatio) * 100
  readonly confidenceScore: number; // 0.0 to 1.0
  readonly groundingFidelity: number; // 0.0 to 1.0 (proportion of terms grounded in source)
  readonly algorithm: string;
  readonly timestamp: string;
}

/**
 * Full compressed representation ready for context windowing or reference indexing.
 */
export interface CompressedRepresentation {
  readonly summaryId: string;
  readonly tenantId: string;
  readonly mode: CompressionMode;
  readonly summaryText: string;
  readonly tokenCount: number;
  readonly checksum: string; // SHA-256 of summaryText
  readonly lineage: CompressionLineage;
  readonly sourceReferences: readonly SourceReference[];
  readonly epistemicStatus: string;
  readonly spatialCellId?: number;
  readonly isCanonicalFactPreserved: boolean;
}

/**
 * Configuration options for the compression engine.
 */
export interface CompressionConfig {
  readonly mode: CompressionMode;
  readonly targetRatio: number;          // Default: 0.35 (65% reduction)
  readonly minConfidence: number;        // Default: 0.80
  readonly groundingThreshold: number;   // Default: 0.85
  readonly maxCompressedTokens?: number; // Optional hard cap
  readonly preserveCodeBlocks: boolean;  // Default: true
  readonly preserveMarkdownHeaders: boolean; // Default: true
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class CompressionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[ContextCompression] ${message}`);
    this.name = 'CompressionError';
    this.code = code;
  }
}

export class FabricatedSummaryRejectionError extends CompressionError {
  public readonly ungroundedTerms: readonly string[];
  public readonly fidelity: number;
  public readonly threshold: number;

  constructor(ungroundedTerms: readonly string[], fidelity: number, threshold: number) {
    super(
      `Fabrication Detected: Compressed summary contains ungrounded claims or hallucinated terms: [${ungroundedTerms.slice(0, 5).join(', ')}]. Grounding fidelity (${fidelity.toFixed(3)}) is below threshold (${threshold.toFixed(3)}). Summary rejected fail-closed.`,
      'FABRICATED_SUMMARY_REJECTED'
    );
    this.name = 'FabricatedSummaryRejectionError';
    this.ungroundedTerms = ungroundedTerms;
    this.fidelity = fidelity;
    this.threshold = threshold;
  }
}

export class LossyCanonicalReplacementError extends CompressionError {
  public readonly objectId: string;

  constructor(objectId: string, details: string) {
    super(
      `Illegal Canonical Fact Replacement on "${objectId}": ${details}. Authoritative VDB records cannot be replaced with lossy summaries without preserving persistent references.`,
      'LOSSY_CANONICAL_REPLACEMENT_PROHIBITED'
    );
    this.name = 'LossyCanonicalReplacementError';
    this.objectId = objectId;
  }
}

export class CompressionTenantViolationError extends CompressionError {
  public readonly expectedTenant: string;
  public readonly actualTenant: string;

  constructor(expectedTenant: string, actualTenant: string) {
    super(
      `Tenant Isolation Violation: Caller tenant "${expectedTenant}" attempted access to compressed context belonging to "${actualTenant}". Rejected fail-closed.`,
      'COMPRESSION_TENANT_VIOLATION'
    );
    this.name = 'CompressionTenantViolationError';
    this.expectedTenant = expectedTenant;
    this.actualTenant = actualTenant;
  }
}

export class CompressionActuationBlockedError extends CompressionError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Compression subsystem rejected actuation directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'CompressionActuationBlockedError';
    this.directive = directive;
  }
}
