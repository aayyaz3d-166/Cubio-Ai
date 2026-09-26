/**
 * CUBiO AI — Phase 9: Chat & Context Engine
 * chatEngineContract.ts
 *
 * Core architectural contracts defining:
 * - Canonical Conversation Identity Hierarchy (conversationId -> sessionId -> turnId)
 * - Canonical Turn Model & Strict Role Taxonomy
 * - 7 Explicit Context Layers & Deterministic Precedence Hierarchy
 * - User Constraint Model with Provenance
 * - Memory vs Context Separation Boundaries
 * - Permanent Hardware Actuation Block & Offline Isolation
 */

import { EpistemicStatus } from '../../model/native_foundation/native_model_types';
import { CoreEngineResult, ReasoningStrategy } from '../core/coreEngineContract';

// ============================================================
// ARCHITECTURAL CONSTANTS & INVARIANTS
// ============================================================

export const CHAT_ENGINE_VERSION = '1.0.0';
export const CHAT_ENGINE_ID = 'CUBIO_AI_CHAT_CONTEXT_ENGINE';

export const IS_ACTUATION_BLOCKED: boolean = true;
export const OFFLINE_ISOLATED: boolean = true;

export const DEFAULT_CONTEXT_BUDGET_CHARS = 16000;
export const MAX_RECENT_TURNS_BUDGET = 20;
export const MAX_TURNS_PER_SESSION = 1000;

// ============================================================
// STRICT ROLE TAXONOMY
// ============================================================

export type TurnRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export const VALID_TURN_ROLES: readonly TurnRole[] = Object.freeze([
  'USER',
  'ASSISTANT',
  'SYSTEM',
  'TOOL',
]);

// ============================================================
// 7 EXPLICIT CONTEXT LAYERS
// ============================================================

export enum ContextLayerType {
  LAYER_1_SYSTEM = 'LAYER_1_SYSTEM',
  LAYER_2_USER = 'LAYER_2_USER',
  LAYER_3_CONVERSATION = 'LAYER_3_CONVERSATION',
  LAYER_4_RECENT_TURNS = 'LAYER_4_RECENT_TURNS',
  LAYER_5_RETRIEVED_MEMORY = 'LAYER_5_RETRIEVED_MEMORY',
  LAYER_6_TOOL_EVIDENCE = 'LAYER_6_TOOL_EVIDENCE',
  LAYER_7_CURRENT_REQUEST = 'LAYER_7_CURRENT_REQUEST',
}

/**
 * Deterministic Precedence Order:
 * SYSTEM > SAFETY / POLICY > CURRENT USER REQUEST > EXPLICIT CURRENT CONSTRAINT
 *   > RECENT CONVERSATION > RETRIEVED MEMORY > OLDER CONTEXT > MODEL INFERENCE
 */
export const CONTEXT_PRECEDENCE_ORDER = Object.freeze([
  'SYSTEM',
  'SAFETY_POLICY',
  'CURRENT_USER_REQUEST',
  'EXPLICIT_CURRENT_CONSTRAINT',
  'RECENT_CONVERSATION',
  'RETRIEVED_MEMORY',
  'OLDER_CONTEXT',
  'MODEL_INFERENCE',
] as const);

export type ContextPrecedenceRank = typeof CONTEXT_PRECEDENCE_ORDER[number];

// ============================================================
// CANONICAL TURN MODEL
// ============================================================

export interface CanonicalTurn {
  readonly turnId: string;
  readonly conversationId: string;
  readonly sessionId: string;
  readonly sequence: number; // 1, 2, 3... strictly monotonic & gapless
  readonly role: TurnRole;
  readonly input: string;
  readonly output: string;
  readonly timestamp: number;
  readonly contextReferences: readonly string[];
  readonly memoryReferences: readonly string[];
  readonly intent: string;
  readonly reasoningReference?: string;
  readonly toolReferences: readonly string[];
  readonly epistemicState: EpistemicStatus;
  readonly safetyStatus: boolean;
  readonly integrityHash: string; // SHA-256
}

// ============================================================
// USER CONSTRAINT MODEL
// ============================================================

export interface UserConstraint {
  readonly constraintId: string;
  readonly key: string;
  readonly value: string;
  readonly setInTurnSequence: number;
  readonly provenance: string; // e.g. "USER_EXPLICIT_PROMPT"
  readonly timestamp: number;
  readonly active: boolean;
  readonly supersededByTurnSequence?: number;
}

// ============================================================
// CONTEXT LAYER ITEM & ASSEMBLED CONTEXT
// ============================================================

export interface ContextLayerItem {
  readonly layerType: ContextLayerType;
  readonly precedence: ContextPrecedenceRank;
  readonly title: string;
  readonly content: string;
  readonly estimatedChars: number;
  readonly sourceReference?: string;
}

export interface ContextCompactionRecord {
  readonly compactionId: string;
  readonly timestamp: number;
  readonly compactedTurnRange: readonly [number, number]; // [startSeq, endSeq]
  readonly originalTurnCount: number;
  readonly summaryText: string;
  readonly originalTurnIds: readonly string[];
  readonly integrityHash: string;
}

export interface AssembledContext {
  readonly conversationId: string;
  readonly sessionId: string;
  readonly layers: readonly ContextLayerItem[];
  readonly totalChars: number;
  readonly isCompacted: boolean;
  readonly compactionRecord?: ContextCompactionRecord;
  readonly activeConstraints: readonly UserConstraint[];
  readonly integrityHash: string;
  readonly assembledAt: number;
}

// ============================================================
// CHAT REQUEST & RESPONSE CONTRACTS
// ============================================================

export interface ChatRequestOptions {
  readonly toolsAllowed?: boolean;
  readonly spatialCoordinate?: readonly [number, number, number];
  readonly spatialCellId?: number;
  readonly preferredStrategy?: ReasoningStrategy;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly timeoutMs?: number;
  readonly enforceEpistemicLockout?: boolean;
  readonly modelId?: string;
}

export interface ChatRequest {
  readonly requestId: string;
  readonly conversationId: string;
  readonly sessionId?: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly message: string;
  readonly options?: ChatRequestOptions;
}

export interface ChatResponse {
  readonly requestId: string;
  readonly conversationId: string;
  readonly sessionId: string;
  readonly turnId: string;
  readonly sequence: number;
  readonly text: string;
  readonly confidence: number;
  readonly epistemicState: EpistemicStatus;
  readonly coreResult: CoreEngineResult;
  readonly turn: CanonicalTurn;
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly isActuationBlocked: boolean; // MUST be true
  readonly isOfflineIsolated: boolean; // MUST be true
}

// ============================================================
// CONVERSATION STATE SNAPSHOT (FOR DAY-2 REHYDRATION)
// ============================================================

export interface ConversationStateSnapshot {
  readonly version: string;
  readonly conversationId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly activeSessionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly turns: readonly CanonicalTurn[];
  readonly constraints: readonly UserConstraint[];
  readonly compactions: readonly ContextCompactionRecord[];
  readonly memoryStore: Readonly<Record<string, string>>;
  readonly intelligentMemories?: readonly any[]; // PersistedMemoryEntry[]
  readonly integrityChecksum: string; // SHA-256 of entire snapshot
}

// ============================================================
// ERROR TAXONOMY
// ============================================================

export enum ChatErrorType {
  INVALID_ROLE = 'INVALID_ROLE',
  SEQUENCE_VIOLATION = 'SEQUENCE_VIOLATION',
  DUPLICATE_TURN = 'DUPLICATE_TURN',
  SESSION_ISOLATION_VIOLATION = 'SESSION_ISOLATION_VIOLATION',
  TENANT_ISOLATION_VIOLATION = 'TENANT_ISOLATION_VIOLATION',
  INTEGRITY_CHECK_FAILED = 'INTEGRITY_CHECK_FAILED',
  CONTEXT_OVERFLOW = 'CONTEXT_OVERFLOW',
  ACTUATION_PROHIBITED = 'ACTUATION_PROHIBITED',
  EXTERNAL_MODEL_CONTAMINATION = 'EXTERNAL_MODEL_CONTAMINATION',
  IDEMPOTENCY_COLLISION = 'IDEMPOTENCY_COLLISION',
}

export class ChatEngineError extends Error {
  public readonly errorType: ChatErrorType;

  constructor(message: string, errorType: ChatErrorType) {
    super(`[${errorType}] ${message}`);
    this.name = 'ChatEngineError';
    this.errorType = errorType;
  }
}
