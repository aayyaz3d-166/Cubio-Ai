/**
 * CUBiO AI — Phase 21: Conversational Memory Intelligence
 * memoryTypes.ts
 *
 * Authoritative Type Definitions & Contract Specifications:
 * - 10 Canonical Memory Classification Categories
 * - 5 Explicit Memory Action Verbs (RECALL, STORE, UPDATE, CORRECT, FORGET)
 * - 6-Tier Strict Authority Hierarchy
 * - Persisted Conversational Memory with Complete Cryptographic Provenance
 * - Transition History Tracking for Non-Destructive Memory Updates
 * - Bounded Retrieval Candidate & Ranking Structures
 * - Phase 20 Quality Engine Memory Audit Contracts
 * - Telemetry & Privacy Contracts (Zero Raw Content Leaks)
 */

// =============================================================================
// 1. 10 MEMORY CLASSIFICATION CATEGORIES
// =============================================================================

export type MemoryClassificationCategory =
  | 'CONVERSATIONAL_CONTEXT'
  | 'TEMPORARY_CONTEXT'
  | 'USER_FACT'
  | 'TASK_REQUIREMENT'
  | 'PREFERENCE_CONSTRAINT'
  | 'EXPLICIT_MEMORY_REQUEST'
  | 'PREVIOUS_CONVERSATION_REFERENCE'
  | 'CORRECTION_UPDATE'
  | 'CONTRADICTION'
  | 'NO_MEMORY_WORTHY_INFO';

export const ALL_MEMORY_CATEGORIES: readonly MemoryClassificationCategory[] = Object.freeze([
  'CONVERSATIONAL_CONTEXT',
  'TEMPORARY_CONTEXT',
  'USER_FACT',
  'TASK_REQUIREMENT',
  'PREFERENCE_CONSTRAINT',
  'EXPLICIT_MEMORY_REQUEST',
  'PREVIOUS_CONVERSATION_REFERENCE',
  'CORRECTION_UPDATE',
  'CONTRADICTION',
  'NO_MEMORY_WORTHY_INFO',
]);

// =============================================================================
// 2. EXPLICIT MEMORY ACTIONS
// =============================================================================

export type ExplicitMemoryAction =
  | 'NONE'
  | 'RECALL'
  | 'STORE'
  | 'UPDATE'
  | 'CORRECT'
  | 'FORGET';

// =============================================================================
// 3. 6-TIER MEMORY AUTHORITY HIERARCHY
// =============================================================================

/**
 * Strict Authority Priority Order:
 * Level 6: CURRENT_EXPLICIT_USER_STATEMENT (Highest Authority)
 * Level 5: EXPLICIT_CURRENT_CONSTRAINT
 * Level 4: RECENT_VERIFIED_CONVERSATION
 * Level 3: PERSISTED_USER_MEMORY
 * Level 2: OLDER_CONTEXT
 * Level 1: MODEL_INFERENCE (Lowest Authority - Never Silently Promoted)
 */
export enum MemoryAuthorityLevel {
  MODEL_INFERENCE = 1,
  OLDER_CONTEXT = 2,
  PERSISTED_USER_MEMORY = 3,
  RECENT_VERIFIED_CONVERSATION = 4,
  EXPLICIT_CURRENT_CONSTRAINT = 5,
  CURRENT_EXPLICIT_USER_STATEMENT = 6,
}

export const AUTHORITY_LEVEL_NAMES: Record<MemoryAuthorityLevel, string> = {
  [MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT]: 'CURRENT_EXPLICIT_USER_STATEMENT',
  [MemoryAuthorityLevel.EXPLICIT_CURRENT_CONSTRAINT]: 'EXPLICIT_CURRENT_CONSTRAINT',
  [MemoryAuthorityLevel.RECENT_VERIFIED_CONVERSATION]: 'RECENT_VERIFIED_CONVERSATION',
  [MemoryAuthorityLevel.PERSISTED_USER_MEMORY]: 'PERSISTED_USER_MEMORY',
  [MemoryAuthorityLevel.OLDER_CONTEXT]: 'OLDER_CONTEXT',
  [MemoryAuthorityLevel.MODEL_INFERENCE]: 'MODEL_INFERENCE',
};

// =============================================================================
// 4. MEMORY STATUS & TRANSITION HISTORY
// =============================================================================

export type MemoryStatus =
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'CONTRADICTED'
  | 'FORGOTTEN'
  | 'ARCHIVED';

export interface MemoryTransitionRecord {
  readonly transitionId: string;
  readonly timestamp: number;
  readonly previousValue?: string;
  readonly newValue: string;
  readonly reason: 'USER_CORRECTION' | 'USER_SUPERSEDED' | 'EXPLICIT_UPDATE' | 'FORGET_REQUEST';
  readonly turnId: string;
  readonly sequenceNumber: number;
}

// =============================================================================
// 5. PERSISTED MEMORY ENTRY WITH COMPLETE PROVENANCE
// =============================================================================

export interface PersistedMemoryEntry {
  readonly memoryId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly conversationId: string;
  readonly turnId: string;
  readonly key: string;
  readonly value: string;
  readonly rawFact: string;
  readonly category: MemoryClassificationCategory;
  readonly authority: MemoryAuthorityLevel;
  readonly source: string; // e.g. 'USER_EXPLICIT_STORE' | 'USER_FACT' | 'USER_CORRECTION'
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly confidence: number;
  readonly status: MemoryStatus;
  readonly contentHash: string; // SHA-256
  readonly transitionHistory: readonly MemoryTransitionRecord[];
  readonly tags: readonly string[];
}

// =============================================================================
// 6. UNDERSTANDING & EXTRACTION RESULTS
// =============================================================================

export interface ExtractedFactCandidate {
  readonly key: string;
  readonly value: string;
  readonly rawFact: string;
  readonly category: MemoryClassificationCategory;
  readonly authority: MemoryAuthorityLevel;
  readonly confidence: number;
  readonly tags?: readonly string[];
}

export interface MemoryUnderstandingResult {
  readonly categories: readonly MemoryClassificationCategory[];
  readonly explicitAction: ExplicitMemoryAction;
  readonly targetKey?: string;
  readonly extractedFacts: readonly ExtractedFactCandidate[];
  readonly isCorrection: boolean;
  readonly correctedKey?: string;
  readonly correctedValue?: string;
  readonly detectedContradictions: readonly {
    readonly existingMemoryId: string;
    readonly key: string;
    readonly existingValue: string;
    readonly conflictingValue: string;
    readonly reason: string;
  }[];
  readonly isMemoryWorthy: boolean;
  readonly reasoning: string;
}

// =============================================================================
// 7. BOUNDED RETRIEVAL CANDIDATE & RANKING
// =============================================================================

export interface MemoryRetrievalCandidate {
  readonly memory: PersistedMemoryEntry;
  readonly relevanceScore: number; // 0.0 to 1.0
  readonly recencyScore: number;   // 0.0 to 1.0
  readonly authorityScore: number; // 0.0 to 1.0
  readonly proximityScore: number; // 0.0 to 1.0
  readonly compositeScore: number; // weighted sum
  readonly matchReason: string;
}

export interface BoundedRetrievalResult {
  readonly retrievedMemories: readonly MemoryRetrievalCandidate[];
  readonly suppressedCount: number;
  readonly totalCandidates: number;
  readonly topRelevanceScore: number;
  readonly queryTopic?: string;
  readonly queryEntities: readonly string[];
}

// =============================================================================
// 8. PHASE 20 RESPONSE QUALITY ENGINE AUDIT
// =============================================================================

export interface MemoryQualityAuditReport {
  readonly passed: boolean;
  readonly issues: readonly string[];
  readonly wrongMemoryDetected: boolean;
  readonly staleMemoryDetected: boolean;
  readonly contradictoryMemoryDetected: boolean;
  readonly irrelevantMemoryDetected: boolean;
  readonly fabricatedMemoryDetected: boolean;
  readonly correctedResponse?: string;
}

// =============================================================================
// 9. PRIVACY-PRESERVING TELEMETRY
// =============================================================================

export interface MemoryTelemetryRecord {
  readonly retrievalCount: number;
  readonly totalCandidates: number;
  readonly memoryHit: boolean;
  readonly topRelevanceScore: number;
  readonly memorySourceTypes: readonly string[];
  readonly latencyMs: number;
  readonly contradictionCode?: string;
  readonly fallbackCode?: string;
}
