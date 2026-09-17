/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F1: CubiO Intelligence Core Foundation (Types & Contracts)
 *
 * Master specification for pluggable intelligence engines, capabilities,
 * 7-stage spatial context envelopes, execution schemas, and middleware hooks.
 *
 * CRITICAL ARCHITECTURAL INVARIANTS:
 * - "All future intelligence engines connect directly to this core foundation."
 * - "All operations are bound to authoritative sovereign CUB-XXXXXXXX identities."
 * - "Zero entropy divergence (sigma^2 = 0) across deterministic reasoning chains."
 */

import { CubiODimension, CubiOHarmonic369, CubiOMemoryNode } from '../../types';
import { CubiOState } from '../../state/types';
import { NetworkPermission } from '../../network/authz/types';
import {
  SpatialPlan,
  SpatialPlanTask,
  SpatialPrediction,
  AudioResonanceOutput,
  ImageGenerationDescriptor,
} from '../types';

export type {
  SpatialPlan,
  SpatialPlanTask,
  SpatialPrediction,
  AudioResonanceOutput,
  ImageGenerationDescriptor,
};

export type EngineCapability =
  | 'SPATIAL_REASONING'
  | 'KNOWLEDGE_RETRIEVAL'
  | 'PLANNING'
  | 'PREDICTION'
  | 'SUPERPOSITION'
  | 'AUTONOMOUS_EXECUTION'
  | 'MULTI_MODAL_SYNTHESIS'
  | 'HARMONIC_369'
  | 'PERCEPTION'
  | 'MEMORY'
  | 'LEARNING'
  | 'DECISION'
  | 'GENERATION'
  | 'FILE_STORAGE'
  | 'VIRTUAL_MEMORY'
  | 'INTELLIGENCE_API'
  | 'DISTRIBUTED_CORE'
  | 'USER_CONTEXT'
  | 'SCALE_INFRASTRUCTURE'
  | 'INTELLIGENCE_EVALUATION'
  | 'PRODUCTION_CORE'
  | 'SECURITY_MONITORING'
  | 'INTENT_ROUTING'
  | 'NATURAL_LANGUAGE_SYNTHESIS'
  | 'CONTEXT_MANAGEMENT'
  | 'CONVERSATION_ENGINE'
  | 'MODEL_BRIDGE'
  | 'MULTIMODAL_ROUTER'
  | 'RESPONSE_VALIDATION'
  | 'CHAT_API_INTEGRATION'
  | 'REAL_CHAT_BENCHMARK'
  | 'PRODUCTION_RELEASE'
  | 'UNIVERSAL_ORCHESTRATION'
  | 'PROBLEM_SOLVING'
  | 'WORKFLOW_EXECUTION'
  | 'PROJECT_INTELLIGENCE'
  | 'LANGUAGE_DETECTION'
  | 'DIMENSIONAL_TRANSFORM';

export type EngineStatus =
  | 'INITIALIZING'
  | 'READY'
  | 'BUSY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'DISPOSED';

export type EnginePriority = 'PRIMARY' | 'SECONDARY' | 'FALLBACK';

export interface EngineMetadata {
  readonly name: string;
  readonly description: string;
  readonly author?: string;
  readonly tags?: readonly string[];
  readonly minDimension?: CubiODimension;
}

export interface EngineHealthReport {
  readonly status: EngineStatus;
  readonly uptimeMs: number;
  readonly totalExecutions: number;
  readonly failedExecutions: number;
  readonly avgLatencyMs: number;
  readonly lastError?: string;
}

export interface DeductiveProofStep {
  readonly stepIndex: number;
  readonly claim: string;
  readonly evidence: string;
  readonly dimension: CubiODimension;
  readonly confidence: number;
  readonly resonanceScore: number;
}

export interface IntelligenceContextEnvelope {
  readonly envelopeId: string;
  readonly prompt: string;
  readonly requiredCapabilities: readonly EngineCapability[];
  readonly activeDimension: CubiODimension;
  readonly sovereignCubId?: string;
  readonly activeState?: Readonly<CubiOState>;
  readonly memoryNodes?: readonly CubiOMemoryNode[];
  readonly harmonic: Readonly<CubiOHarmonic369>;
  readonly options?: Readonly<Record<string, any>>;
  readonly timestamp: number;
}

export interface EngineExecutionResult {
  readonly resultId: string;
  readonly engineId: string;
  readonly textOutput: string;
  readonly reasoningSteps: readonly DeductiveProofStep[];
  readonly plan?: SpatialPlan;
  readonly prediction?: SpatialPrediction;
  readonly audio?: AudioResonanceOutput;
  readonly image?: ImageGenerationDescriptor;
  readonly artifacts?: readonly any[];
  readonly confidence: number;
  readonly resonanceScore: number;
  readonly executionTimeMs: number;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface OrchestrationResponse {
  readonly orchestrationId: string;
  readonly envelope: Readonly<IntelligenceContextEnvelope>;
  readonly primaryResult: Readonly<EngineExecutionResult>;
  readonly engineExecutions: readonly Readonly<EngineExecutionResult>[];
  readonly totalDurationMs: number;
  readonly consensusConfidence: number;
  readonly harmonicResonanceScore: number;
  readonly traceChecksum: string;
  readonly timestamp: number;
}

export interface IIntelligenceEngine {
  readonly engineId: string;
  readonly version: string;
  readonly priority: EnginePriority;
  readonly capabilities: readonly EngineCapability[];
  readonly metadata: Readonly<EngineMetadata>;

  initialize(core: any): Promise<void>;
  execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult>;
  getHealth(): Promise<EngineHealthReport>;
  dispose(): Promise<void>;
}

export interface IntelligenceMiddleware {
  readonly name: string;
  readonly order?: number; // Lower numbers execute earlier

  onPreProcess?(envelope: IntelligenceContextEnvelope): Promise<IntelligenceContextEnvelope>;
  onPostProcess?(
    result: EngineExecutionResult,
    envelope: IntelligenceContextEnvelope
  ): Promise<EngineExecutionResult>;
  onError?(
    error: Error,
    envelope: IntelligenceContextEnvelope
  ): Promise<EngineExecutionResult | void>;
}
