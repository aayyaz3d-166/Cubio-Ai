/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F29: Chat API Integration (Types & Contracts)
 *
 * Strongly typed service layer types connecting frontend React UI controls
 * (Chat, Reason, Predict, Inspect) to the finalized F1-F28 Intelligence APIs
 * through a production-grade typed result envelope.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import {
  IntelligenceChatApiResponse,
  IntelligenceReasonApiResponse,
  IntelligencePredictApiResponse,
  IntelligenceInspectApiResponse,
  IntelligenceGenerateApiResponse,
  IntelligenceDecisionApiResponse,
  IntelligenceHealthApiResponse,
  IntelligenceVirtualMemoryApiResponse,
} from '../api/types';

// ─── Chat API Status Lifecycle ───────────────────────────────────────────

export type ChatApiStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

// ─── Interaction Mode (maps to MessageComposer tabs) ─────────────────────

export type InteractionMode = 'CHAT' | 'REASONING' | 'PREDICTION' | 'INSPECTION';

// ─── Universal Result Envelope ───────────────────────────────────────────

export interface ChatApiResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly requestId: string;
  readonly mode: InteractionMode;
  readonly latencyMs: number;
  readonly timestamp: number;
}

// ─── Request Metadata ────────────────────────────────────────────────────

export interface ChatApiRequestMeta {
  readonly requestId: string;
  readonly mode: InteractionMode;
  readonly prompt: string;
  readonly conversationId: string;
  readonly activeDimension: CubiODimension;
  readonly baseState?: CubiOState;
  readonly harmonic?: Partial<CubiOHarmonic369>;
  readonly timestamp: number;
}

// ─── Service Configuration ───────────────────────────────────────────────

export interface IntelligenceServiceConfig {
  readonly deduplicationWindowMs?: number; // default 100ms
  readonly maxRetries?: number; // default 1
  readonly defaultDimension?: CubiODimension; // default 'D3'
}

// ─── Mode-Specific Response Aliases ──────────────────────────────────────

export type ChatModeResult = ChatApiResult<IntelligenceChatApiResponse>;
export type ReasonModeResult = ChatApiResult<IntelligenceReasonApiResponse>;
export type PredictModeResult = ChatApiResult<IntelligencePredictApiResponse>;
export type InspectModeResult = ChatApiResult<IntelligenceInspectApiResponse>;
export type GenerateModeResult = ChatApiResult<IntelligenceGenerateApiResponse>;
export type DecisionModeResult = ChatApiResult<IntelligenceDecisionApiResponse>;
export type HealthResult = ChatApiResult<IntelligenceHealthApiResponse>;
export type VmStatsResult = ChatApiResult<IntelligenceVirtualMemoryApiResponse>;

// ─── Unified Dispatch Result ─────────────────────────────────────────────

export type UnifiedDispatchResult = ChatApiResult<
  | IntelligenceChatApiResponse
  | IntelligenceReasonApiResponse
  | IntelligencePredictApiResponse
  | IntelligenceInspectApiResponse
>;
