/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F23: CubiO Intelligence Intent & Task Router (Types & Contracts)
 *
 * Master specification for semantic intent understanding,
 * multi-modal entity extraction, capability mapping, and execution plan routing.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { EngineCapability, IntelligenceContextEnvelope } from '../core/types';

export type UserIntentCategory =
  | 'GREETING'
  | 'HELP'
  | 'GENERAL_CHAT'
  | 'FOLLOW_UP'
  | 'QUESTION'
  | 'CREATIVE'
  | 'PLATFORM_QUERY'
  | 'CONTEXT_RECALL'
  | 'GEOMETRIC_QUERY'
  | 'SPATIAL_REASONING'
  | 'MULTIMODAL_ANALYSIS'
  | 'CHAT'
  | 'CALCULATION'
  | 'REASONING'
  | 'CREATIVE_TASK'
  | 'ANALYSIS'
  | 'PREDICTION'
  | 'DECISION'
  | 'SYSTEM_CONTROL'
  | 'CONVERSATION'
  | 'CODING'
  | 'MEMORY'
  | 'KNOWLEDGE'
  | 'TASK_INSTRUCTION'
  | 'SPATIAL_CUBIO'
  | 'TOOL_REQUEST'
  | 'CLARIFICATION'
  | 'SAFETY_REFUSAL';

export interface ExecutionPlanStep {
  readonly stepIndex: number;
  readonly targetEngineId: string;
  readonly requiredCapability: EngineCapability;
  readonly description: string;
}

export interface IntentAnalysisResult {
  readonly intentId: string;
  readonly category: UserIntentCategory;
  readonly confidence: number;
  readonly primaryEngineId: string;
  readonly requiredCapabilities: readonly EngineCapability[];
  readonly suggestedDimension: CubiODimension;
  readonly extractedEntities: readonly string[];
  readonly harmonicAttunement: Partial<CubiOHarmonic369>;
  readonly analysisChecksum: string;
  readonly structuredUnderstanding?: any;
}

export interface RoutingDecision {
  readonly routingId: string;
  readonly intent: IntentAnalysisResult;
  readonly executionPlan: readonly ExecutionPlanStep[];
  readonly targetEngines: readonly string[];
  readonly routedEnvelope: IntelligenceContextEnvelope;
}
