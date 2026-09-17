/**
 * CUBiO AI — Phase 8: CUBiO AI Core Engine
 * coreEngineContract.ts
 *
 * Core architectural contract defining:
 * - 10-Stage Sequential Execution Lifecycle
 * - Request & Result Data Contracts
 * - Reasoning Strategies & Routing Declarations
 * - Strict Architectural Invariants (343 cells, 26 anchors, 369 space)
 * - Permanent Hardware Actuation Block & Offline Isolation
 */

import { EpistemicStatus } from '../../model/native_foundation/native_model_types';
import {
  TOTAL_SPATIAL_CELLS as SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS as SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE as ADDRESS_SPACE,
} from '../../virtual_data/memoryContract';

// ============================================================
// ARCHITECTURAL CONSTANTS & INVARIANTS
// ============================================================

export const CORE_ENGINE_VERSION = '1.0.0';
export const CORE_ENGINE_MODEL_ID = 'CUBIO-NATIVE-MODEL-V1';
export const CORE_ENGINE_ARCHITECTURE = 'CUBIO_AI_CORE_ORCHESTRATOR';

export const TOTAL_SPATIAL_CELLS: number = SPATIAL_CELLS; // 343 (7^3)
export const TOTAL_SYMBOLIC_ANCHORS: number = SYMBOLIC_IDS; // 26
export const TOTAL_ADDRESSABLE_SPACE: number = ADDRESS_SPACE; // 369 (343 + 26)

export const IS_ACTUATION_BLOCKED: boolean = true;
export const OFFLINE_ISOLATED: boolean = true;

export const MAX_REASONING_ITERATIONS = 3;
export const MAX_TOOL_ITERATIONS = 2;
export const DEFAULT_EXECUTION_TIMEOUT_MS = 10000;

// ============================================================
// 10-STAGE EXECUTION LIFECYCLE
// ============================================================

export enum CoreExecutionLifecycleStage {
  STAGE_1_INGEST = 'STAGE_1_INGEST',
  STAGE_2_CONTEXT_RESOLUTION = 'STAGE_2_CONTEXT_RESOLUTION',
  STAGE_3_MEMORY_RESOLUTION = 'STAGE_3_MEMORY_RESOLUTION',
  STAGE_4_INTENT_CLASSIFICATION = 'STAGE_4_INTENT_CLASSIFICATION',
  STAGE_5_REASONING_AUTHORITY = 'STAGE_5_REASONING_AUTHORITY',
  STAGE_6_REASONING_EXECUTION = 'STAGE_6_REASONING_EXECUTION',
  STAGE_7_TOOL_AUTHORITY = 'STAGE_7_TOOL_AUTHORITY',
  STAGE_8_SAFETY_VALIDATION = 'STAGE_8_SAFETY_VALIDATION',
  STAGE_9_MEMORY_WRITE_POLICY = 'STAGE_9_MEMORY_WRITE_POLICY',
  STAGE_10_RESPONSE_GENERATION = 'STAGE_10_RESPONSE_GENERATION',
}

// ============================================================
// REASONING STRATEGIES & ENGINE MODES
// ============================================================

export type ReasoningStrategy =
  | 'DETERMINISTIC_PRIMARY'
  | 'NEURAL_SHADOW'
  | 'NEURAL_WITH_FALLBACK'
  | 'NEURAL_HYBRID'
  | 'TOOL_ASSISTED';

export type DomainCategory = 'CONVERSATIONAL' | 'SPATIAL' | 'HYBRID' | 'SYSTEM';

// ============================================================
// REQUEST & RESULT CONTRACTS
// ============================================================

export interface CoreEngineRequestOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly enforceEpistemicLockout?: boolean;
  readonly preferredStrategy?: ReasoningStrategy;
  readonly spatialCoordinate?: readonly [number, number, number];
  readonly spatialCellId?: number;
  readonly timeoutMs?: number;
  readonly toolsAllowed?: boolean;
  readonly enableMemoryWrite?: boolean;
}

export interface CoreEngineRequest {
  readonly prompt: string;
  readonly sessionId?: string;
  readonly tenantId?: string;
  readonly options?: CoreEngineRequestOptions;
}

export interface ContextSnapshot {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly turnIndex: number;
  readonly historyLength: number;
  readonly tenantMemoryKeys: readonly string[];
}

export interface MemoryAuditRecord {
  readonly spatialAccessed: boolean;
  readonly coordinate?: readonly [number, number, number];
  readonly cellId?: number;
  readonly address369?: number;
  readonly readCount: number;
  readonly writeProposedCount: number;
  readonly writeApprovedCount: number;
  readonly memoryIntegrityValid: boolean;
}

export interface CoreEngineResult {
  readonly text: string;
  readonly confidence: number;
  readonly strategy: ReasoningStrategy;
  readonly decision: import('./coreDecision').CoreDecision;
  readonly contextSnapshot: ContextSnapshot;
  readonly memoryAudit: MemoryAuditRecord;
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly isActuationBlocked: boolean; // MUST be true
  readonly isOfflineIsolated: boolean; // MUST be true
}

// ============================================================
// ERROR CONTRACT
// ============================================================

export enum CoreErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  TIMEOUT = 'TIMEOUT',
  LOOP_DETECTED = 'LOOP_DETECTED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  ACTUATION_BLOCKED_VIOLATION = 'ACTUATION_BLOCKED_VIOLATION',
  EXTERNAL_MODEL_CONTAMINATION = 'EXTERNAL_MODEL_CONTAMINATION',
  SPATIAL_RANGE_VIOLATION = 'SPATIAL_RANGE_VIOLATION',
  MEMORY_WRITE_REJECTED = 'MEMORY_WRITE_REJECTED',
  NON_FACT_LOCKOUT_VIOLATION = 'NON_FACT_LOCKOUT_VIOLATION',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class CoreEngineError extends Error {
  public readonly errorType: CoreErrorType;
  public readonly stage: CoreExecutionLifecycleStage;

  constructor(message: string, errorType: CoreErrorType, stage: CoreExecutionLifecycleStage) {
    super(`[${errorType} @ ${stage}] ${message}`);
    this.name = 'CoreEngineError';
    this.errorType = errorType;
    this.stage = stage;
  }
}
