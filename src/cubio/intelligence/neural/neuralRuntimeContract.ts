/**
 * CUBiO AI — Phase 6: Neural Runtime
 * neuralRuntimeContract.ts
 *
 * Dedicated Neural Runtime Contract establishing strict boundaries:
 * - Model identity and architecture invariants
 * - Runtime state machine (UNINITIALIZED, LOADING, READY, DEGRADED, ERROR, HELD, DISABLED)
 * - Production routing modes (DETERMINISTIC_ONLY, NEURAL_SHADOW, NEURAL_WITH_FALLBACK, NEURAL_PRIMARY)
 * - Safe request/response contracts (zero physical paths exposed)
 * - Observability and audit telemetry
 * - Epistemic status integration and Non-Fact Lockout
 */

import { EpistemicStatus } from '../../model/native_foundation/native_model_types';

// ============================================================================
// ARCHITECTURAL INVARIANTS & HARD BOUNDARIES
// ============================================================================

export const NEURAL_RUNTIME_MODEL_ID = 'CUBIO-NATIVE-MODEL-V1';
export const NEURAL_RUNTIME_ARCHITECTURE_VERSION = '1.0.0';
export const NEURAL_RUNTIME_PARAMETER_COUNT = 153472;
export const NEURAL_RUNTIME_VOCABULARY_SIZE = 478;
export const NEURAL_RUNTIME_VOCABULARY_HASH = '96df4d3ae8f30229c4b9597e0a1a9152fcab9a98a922918ff18f995356d65f0e';
export const NEURAL_RUNTIME_MAX_SEQ_LEN = 64;
export const NEURAL_RUNTIME_SPATIAL_CELLS = 343;
export const NEURAL_RUNTIME_SYMBOLIC_ANCHORS = 26;
export const NEURAL_RUNTIME_TOTAL_ADDRESS_SPACE = 369;
export const NEURAL_RUNTIME_ACTUATION_BLOCKED = true;

// ============================================================================
// RUNTIME STATES
// ============================================================================

export enum NeuralRuntimeState {
  UNINITIALIZED = 'UNINITIALIZED',
  LOADING = 'LOADING',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
  ERROR = 'ERROR',
  HELD = 'HELD',
  DISABLED = 'DISABLED',
}

// ============================================================================
// PRODUCTION ROUTING MODES
// ============================================================================

export enum NeuralRoutingMode {
  /** Mode A: All requests handled exclusively by deterministic pipeline */
  DETERMINISTIC_ONLY = 'DETERMINISTIC_ONLY',

  /** Mode B: User receives deterministic output; neural executes in shadow */
  NEURAL_SHADOW = 'NEURAL_SHADOW',

  /** Mode C: Neural executes first; deterministic fallback on error/timeout */
  NEURAL_WITH_FALLBACK = 'NEURAL_WITH_FALLBACK',

  /** Mode D: Neural primary (requires explicit promotion authorization) */
  NEURAL_PRIMARY = 'NEURAL_PRIMARY',
}

// ============================================================================
// INFERENCE INTERFACES
// ============================================================================

export interface NeuralInferenceRequest {
  readonly prompt: string;
  readonly sessionId?: string;
  readonly tenantId?: string;
  readonly spatialCellId?: number;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly topK?: number;
  readonly enforceEpistemicLockout?: boolean;
  readonly timeoutMs?: number;
  readonly routingModeOverride?: NeuralRoutingMode;
}

export interface ShadowComparisonReport {
  readonly deterministicText: string;
  readonly neuralText: string;
  readonly divergenceScore: number;
  readonly epistemicAgreement: boolean;
  readonly latencyDeltaMs: number;
  readonly timestamp: number;
}

export interface NeuralTelemetryRecord {
  readonly executionId: string;
  readonly timestamp: number;
  readonly runtimeState: NeuralRuntimeState;
  readonly routingMode: NeuralRoutingMode;
  readonly modelId: string;
  readonly modelStateHash: string;
  readonly latencyMs: number;
  readonly memoryRssBytes: number;
  readonly fallbackUsed: boolean;
  readonly fallbackReason?: string;
  readonly safetyOutcome: 'SAFE' | 'FLAGGED' | 'MODIFIED';
  readonly externalModelCalls: 0;
  readonly isActuationBlocked: true;
}

export interface NeuralInferenceResult {
  readonly text: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly latencyMs: number;
  readonly routingModeUsed: NeuralRoutingMode;
  readonly fallbackInvoked: boolean;
  readonly fallbackReason?: string;
  readonly shadowComparison?: ShadowComparisonReport;
  readonly tokenIds: readonly number[];
  readonly telemetry: NeuralTelemetryRecord;
}

export interface NeuralRuntimeStatus {
  readonly state: NeuralRuntimeState;
  readonly activeRoutingMode: NeuralRoutingMode;
  readonly modelId: string;
  readonly architectureVersion: string;
  readonly parameterCount: number;
  readonly checkpointHash: string;
  readonly totalInferences: number;
  readonly fallbackCount: number;
  readonly averageLatencyMs: number;
  readonly memoryRssBytes: number;
  readonly isActuationBlocked: true;
  readonly lastError?: string;
}
