/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F103: Adaptive Model Router Types & Contracts
 *
 * Types for dynamic task intent classification, cost/latency optimization goals,
 * provider circuit breaking, and explainable routing decisions.
 */

import { ModelCandidateId } from '../comparative/types';

export type TaskModalityIntent =
  | 'SPATIAL_3D_CAD_GEOMETRY'
  | 'ACOUSTIC_528HZ_VOICE'
  | 'AST_CODE_SYNTHESIS_REPAIR'
  | 'VISION_GEMSTONE_OPTICS'
  | 'DEEP_RECURSIVE_MATH'
  | 'MASSIVE_CONTEXT_INGESTION'
  | 'RAPID_CONVERSATION_CHAT'
  | 'SECURITY_GOVERNED_TOOL';

export type RoutingOptimizationGoal =
  | 'MAX_INTELLIGENCE'
  | 'LATENCY_CRITICAL'
  | 'COST_MINIMIZED'
  | 'SOVEREIGN_OFFLINE_ONLY';

export type ProviderHealthState = 'AVAILABLE' | 'DEGRADED' | 'RATE_LIMITED' | 'OFFLINE';

export interface TaskRoutingRequest {
  readonly prompt: string;
  readonly explicitIntent?: TaskModalityIntent;
  readonly optimizationGoal?: RoutingOptimizationGoal;
  readonly estimatedInputTokens?: number;
  readonly forceSovereignOnly?: boolean;
  readonly budgetCapUsd?: number;
  readonly maxLatencySlaMs?: number;
}

export interface AdaptiveRoutingDecision {
  readonly decisionId: string;
  readonly detectedIntent: TaskModalityIntent;
  readonly selectedModelId: ModelCandidateId;
  readonly selectedDisplayName: string;
  readonly confidenceScore: number; // 0.0 .. 1.0
  readonly isSovereignLocal: boolean;
  readonly estimatedLatencyMs: number;
  readonly estimatedCostUsd: number;
  readonly rationale: string;
  readonly fallbackModelId: ModelCandidateId;
  readonly circuitBreakerTriggered: boolean;
  readonly decisionChecksum: string;
  readonly timestamp: number;
}

export interface IAdaptiveModelRouter {
  routeTask(request: TaskRoutingRequest): Promise<AdaptiveRoutingDecision>;
  updateProviderHealth(modelId: ModelCandidateId, health: ProviderHealthState): void;
  getProviderHealth(modelId: ModelCandidateId): ProviderHealthState;
}
