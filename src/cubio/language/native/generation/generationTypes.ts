/**
 * CUBiO AI — Phase 6: Task 81
 * Knowledge-Grounded Language Generation Layer
 * src/cubio/language/native/generation/generationTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for sovereign knowledge-grounded natural language response generation.
 * Guarantees zero hallucination, verifiable evidence grounding, explicit
 * epistemic classification, and strict provenance tracking.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { InjectedMemoryReference } from '../long_context/longContextTypes';
import { LanguageReasoningStep, LanguageReasoningResult } from '../reasoning/languageReasoningTypes';
import { CanonicalFact } from '../../../reasoning/state/reasoningStateTypes';

// =============================================================================
// STRUCTURED DOMAIN ERRORS
// =============================================================================

export class KnowledgeGroundedGenerationError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'KNOWLEDGE_GROUNDED_GENERATION_ERROR') {
    super(message);
    this.name = 'KnowledgeGroundedGenerationError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class UnsupportedClaimError extends KnowledgeGroundedGenerationError {
  constructor(message: string) {
    super(message, 'UNSUPPORTED_CLAIM_PROHIBITED');
    this.name = 'UnsupportedClaimError';
  }
}

export class EpistemicViolationError extends KnowledgeGroundedGenerationError {
  constructor(message: string) {
    super(message, 'EPISTEMIC_VIOLATION');
    this.name = 'EpistemicViolationError';
  }
}

export class HallucinationTrapTriggeredError extends KnowledgeGroundedGenerationError {
  constructor(message: string) {
    super(message, 'HALLUCINATION_TRAP_TRIGGERED');
    this.name = 'HallucinationTrapTriggeredError';
  }
}

export class GenerationBudgetExceededError extends KnowledgeGroundedGenerationError {
  constructor(message: string) {
    super(message, 'GENERATION_BUDGET_EXCEEDED');
    this.name = 'GenerationBudgetExceededError';
  }
}

// =============================================================================
// PROMPT & CLASSIFICATION CONTRACTS
// =============================================================================

export type GenerationPromptType =
  | 'FACTUAL'
  | 'MULTI_HOP_REASONING'
  | 'AMBIGUOUS'
  | 'INSUFFICIENT_INFORMATION'
  | 'ADVERSARIAL_TRAP'
  | 'CONVERSATIONAL';

export interface PromptClassificationResult {
  readonly promptType: GenerationPromptType;
  readonly confidence: number;
  readonly targetSubject?: string;
  readonly targetPredicate?: string;
  readonly targetObject?: string | number;
  readonly detectedEntities: readonly string[];
  readonly isHypothetical: boolean;
  readonly isInterrogative: boolean;
  readonly isAdversarial: boolean;
  readonly explanation: string;
}

// =============================================================================
// CLAIM & PROVENANCE CONTRACTS
// =============================================================================

export interface ClaimProvenance {
  readonly tenantId: string;
  readonly sourceObjectId?: string;
  readonly stateVersion?: number;
  readonly checksum?: string;
  readonly storageKey?: string;
  readonly evidencePremiseIds?: readonly string[];
  readonly reasoningStepId?: string;
  readonly spatialCellId?: number;
}

export interface GroundedClaim {
  readonly claimId: string;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string | number | boolean | readonly number[];
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly isNegated: boolean;
  readonly provenance: ClaimProvenance;
}

// =============================================================================
// CONFIGURATION CONTRACTS
// =============================================================================

export interface GenerationConfig {
  /** Maximum number of generated tokens */
  readonly maxTokens: number;
  /** Sampling temperature (0.0 for deterministic execution) */
  readonly temperature: number;
  /** Enforce that only 100% grounded facts/inferences may be produced */
  readonly strictGroundedOnly: boolean;
  /** Include structured provenance citations in the response payload */
  readonly includeProvenance: boolean;
  /** Maximum turns preserved in multi-turn session history */
  readonly maxContextTurns: number;
  /** Computation time budget in milliseconds */
  readonly budgetMs: number;
  /** Deterministic pseudo-random seed */
  readonly seed: number;
  /** Prefix generated sentences with explicit epistemic tags [FACT], [HYPO], etc. */
  readonly epistemicLabeling: boolean;
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = Object.freeze({
  maxTokens: 512,
  temperature: 0.0,
  strictGroundedOnly: true,
  includeProvenance: true,
  maxContextTurns: 10,
  budgetMs: 2000,
  seed: 369,
  epistemicLabeling: true,
});

// =============================================================================
// RESPONSE & SESSION CONTRACTS
// =============================================================================

export interface GroundedResponse {
  readonly responseId: string;
  readonly queryText: string;
  readonly tenantId: string;
  readonly promptType: GenerationPromptType;
  readonly generatedText: string;
  readonly claims: readonly GroundedClaim[];
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly isGrounded: boolean;
  readonly unsupportedClaimsCount: number;
  readonly hallucinationScore: number;
  readonly reasoningDagChecksum?: string;
  readonly memoryReferencesCount: number;
  readonly tokenCount: number;
  readonly durationMs: number;
  readonly timestamp: number;
}

export interface ConversationTurn {
  readonly turnIndex: number;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly timestamp: number;
  readonly response?: GroundedResponse;
}

export interface ConversationSessionSnapshot {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly turns: readonly ConversationTurn[];
  readonly contextChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}
