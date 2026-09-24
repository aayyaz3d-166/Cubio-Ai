/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Universal Intelligence Router Types
 *
 * Core contracts for central Brain-Routing:
 * User Request -> Intent -> Problem Type -> Required Capability -> Best Target -> Execution -> Verification -> Response.
 */

import { UniversalCapabilityClass } from '../universalTypes';

export type RouterTargetType =
  | 'LLM_REASONING'
  | 'IMAGE_ENGINE'
  | 'VOICE_ENGINE'
  | 'CODING_ENGINE'
  | 'PROJECT_ENGINE'
  | 'WORKFLOW_ENGINE'
  | 'TOOL_ENGINE'
  | 'MULTI_AGENT_SOLVER'
  | 'SPATIAL_369_ENGINE'
  | 'NATURAL_RESPONSE';

export type ProblemComplexityType = 'ATOMIC_QUERY' | 'COMPOSITE_WORKFLOW' | 'MULTI_AGENT_COORDINATION' | 'SPATIAL_TRANSFORMATION';

export interface UniversalRoutingDecision {
  readonly decisionId: string;
  readonly prompt: string;
  readonly detectedIntent: string;
  readonly problemType: ProblemComplexityType;
  readonly requiredCapabilities: readonly UniversalCapabilityClass[];
  readonly selectedTarget: RouterTargetType;
  readonly targetReasoning: string;
  readonly confidence: number;
  readonly routingChecksum: string;
}

export interface RoutingExecutionRequest {
  readonly prompt: string;
  readonly conversationId?: string;
  readonly projectId?: string;
  readonly language?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface RoutingExecutionResult {
  readonly decision: UniversalRoutingDecision;
  readonly textOutput: string;
  readonly targetType: RouterTargetType;
  readonly artifactCreated?: string;
  readonly executionTimeMs: number;
  readonly verificationPassed: boolean;
  readonly finalChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalIntelligenceRouter {
  analyzeAndRoute(prompt: string): UniversalRoutingDecision;
  routeAndExecute(request: RoutingExecutionRequest): Promise<RoutingExecutionResult>;
}
