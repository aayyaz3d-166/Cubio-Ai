/**
 * CUBiO AI — Task 193: Native Evidence and Source Provenance Architecture
 * src/cubio/model/native_evidence_provenance/types.ts
 *
 * Types, interfaces, summary records, and error classes for
 * native evidence chaining, cryptographic source provenance, and epistemic verification.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. Fail-Closed Evidence: Missing or corrupted evidence immediately halts promotion.
 * 3. Epistemic Anti-Promotion: Unsupported claims cannot advance to AXIOM or FACT without proof.
 * 4. Zero-Copy Descriptors: Preserves lightweight reference descriptors for long-context RAM safety.
 * 5. Multi-Tenant Isolation: Cross-tenant evidence traversal is strictly prohibited.
 */

import {
  KnowledgeEpistemicStatus,
  EvidenceSourceType,
} from '../native_knowledge_architecture/types';

export const TASK_193_ID = 'CUBIO-TASK-193-EVIDENCE-SOURCE-PROVENANCE';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_EVIDENCE_CHAIN_DEPTH = 32;

/**
 * Concrete identity and integrity metadata of an evidence source.
 */
export interface EvidenceSourceIdentity {
  readonly sourceId: string;
  readonly sourceType: EvidenceSourceType | string;
  readonly locationUri: string;
  readonly authorOrInstrument: string;
  readonly payloadChecksum: string;
  readonly recordedAt: number;
}

/**
 * An individual node within a deterministic evidence chain.
 */
export interface EvidenceChainNode {
  readonly nodeId: string;
  readonly claimId: string;
  readonly parentNodeId?: string;
  readonly sourceIdentity: EvidenceSourceIdentity;
  readonly epistemicTier: KnowledgeEpistemicStatus;
  readonly confidence: number;
  readonly derivationRule?: string;
  readonly rawPayloadContent?: string;
  readonly chainedHash: string;
  readonly timestamp: number;
}

/**
 * Deterministic cryptographic evidence chain from root source(s) to a claim.
 */
export interface EvidenceChain {
  readonly chainId: string;
  readonly claimId: string;
  readonly tenantId: string;
  readonly nodes: readonly EvidenceChainNode[];
  readonly rootSourceIds: readonly string[];
  readonly leafHash: string;
  readonly compositeHash: string;
  readonly createdAt: number;
}

/**
 * Status of evidence verification.
 */
export type EvidenceVerificationStatus =
  | 'VERIFIED'
  | 'MISSING_EVIDENCE'
  | 'CORRUPTED_CHECKSUM'
  | 'UNVERIFIABLE_LINEAGE'
  | 'UNSUPPORTED_PROMOTION';

/**
 * Verification outcome of an evidence chain.
 */
export interface EvidenceVerificationResult {
  readonly valid: boolean;
  readonly status: EvidenceVerificationStatus;
  readonly chainDepth: number;
  readonly rootSourceIds: readonly string[];
  readonly compositeHash: string;
  readonly failureReason?: string;
}

/**
 * Lightweight Zero-Copy Reference Descriptor for RAM-efficient long-context retrieval.
 */
export interface ProvenanceDescriptor {
  readonly provenanceId: string;
  readonly claimId: string;
  readonly tenantId: string;
  readonly chainDepth: number;
  readonly rootChecksum: string;
  readonly compositeHash: string;
  readonly epistemicTier: KnowledgeEpistemicStatus;
  readonly confidence: number;
  readonly isVerified: boolean;
}

/**
 * Advisory emitted to Phase 10 reasoning engines.
 */
export interface Phase10ProvenanceAdvisory {
  readonly advisoryId: string;
  readonly tenantId: string;
  readonly claimId: string;
  readonly verificationStatus: EvidenceVerificationStatus;
  readonly reasonTrail: readonly string[];
  readonly compositeHash: string;
  readonly emittedAt: number;
}

/**
 * Candidate claim submitted for promotion to canonical knowledge.
 */
export interface CanonicalPromotionCandidate {
  readonly claimId: string;
  readonly tenantId: string;
  readonly requestedEpistemicTier: KnowledgeEpistemicStatus;
  readonly evidenceChainId: string;
  readonly properties: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────────────────────────────────────

export class EvidenceCorruptedError extends Error {
  constructor(public readonly evidenceId: string, message: string) {
    super(`[TASK-193] Evidence corrupted or checksum mismatch for '${evidenceId}': ${message}`);
    this.name = 'EvidenceCorruptedError';
  }
}

export class EvidenceMissingError extends Error {
  constructor(public readonly claimId: string, message: string) {
    super(`[TASK-193] Missing required evidence for claim '${claimId}': ${message}`);
    this.name = 'EvidenceMissingError';
  }
}

export class EvidenceUnverifiableLineageError extends Error {
  constructor(public readonly chainId: string, message: string) {
    super(`[TASK-193] Unverifiable or circular evidence lineage in chain '${chainId}': ${message}`);
    this.name = 'EvidenceUnverifiableLineageError';
  }
}

export class EvidenceUnsupportedPromotionError extends Error {
  constructor(public readonly claimId: string, message: string) {
    super(`[TASK-193] Unsupported promotion strictly forbidden for claim '${claimId}': ${message}`);
    this.name = 'EvidenceUnsupportedPromotionError';
  }
}

export class EvidenceProvenanceTenantViolationError extends Error {
  constructor(message: string) {
    super(`[TASK-193] Cross-tenant evidence or provenance violation: ${message}`);
    this.name = 'EvidenceProvenanceTenantViolationError';
  }
}

export class EvidenceProvenanceActuationBlockedError extends Error {
  constructor(action: string) {
    super(`[TASK-193] Actuation permanently blocked (IS_ACTUATION_BLOCKED = true). Attempted action: ${action}`);
    this.name = 'EvidenceProvenanceActuationBlockedError';
  }
}
