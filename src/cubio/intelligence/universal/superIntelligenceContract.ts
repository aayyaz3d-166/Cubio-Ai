/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46-D: Super Intelligence Architecture Lock — Master Contract
 *
 * Authoritative master specifications governing end-to-end execution across:
 * 1. Universal Request Schema
 * 2. Capability Planning & DAG Decomposition
 * 3. Multi-Engine Execution Framework
 * 4. Provider Selection & Routing Policy
 * 5. Multi-Agent Coordination Protocol
 * 6. Tool Authorization & Sandbox Confinement
 * 7. Dimensional State Transitions (D0 <-> D8)
 * 8. Result Synthesis & Cross-Modal Fusion
 * 9. Failure Handling & Graceful Recovery Ladder
 * 10. Tamper-Evident Deterministic Audit Trail (sigma^2 = 0)
 *
 * INVARIANT: Pure architectural contract. No engine implementation code.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import {
  UniversalCapabilityClass,
  ProviderType,
  ProviderStatus,
  DimensionalStateLevel,
  LanguageCode,
} from './universalTypes';

// ─── 1. UNIVERSAL REQUEST CONTRACT ─────────────────────────────────────────

export type SecurityPrivacyTier = 'PUBLIC' | 'SOVEREIGN_LOCAL' | 'AIR_GAPPED' | 'CRYPTOGRAPHIC_SEALED';

export type ExecutionUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'REAL_TIME_STREAMING';

export interface MultimodalPayload {
  readonly rawText?: string;
  readonly audioPCM?: Uint8Array;
  readonly imageBytes?: Uint8Array;
  readonly videoFrames?: readonly Uint8Array[];
  readonly spatialGeometryMesh?: Readonly<Record<string, unknown>>;
  readonly structuredData?: Readonly<Record<string, unknown>>;
}

export interface UniversalExecutionContext {
  readonly conversationId: string;
  readonly userId?: string;
  readonly projectId?: string;
  readonly workspaceUri?: string;
  readonly parentTurnId?: string;
  readonly activeStateId?: string;
  readonly baseState?: CubiOState;
  readonly harmonicContext?: Partial<CubiOHarmonic369>;
}

export interface UniversalExecutionConstraints {
  readonly timeoutMs: number;
  readonly maxTokens?: number;
  readonly privacyTier: SecurityPrivacyTier;
  readonly urgency: ExecutionUrgency;
  readonly allowExternalProviders: boolean;
  readonly requireHumanAuthorization: boolean;
  readonly strictDeterminismRequired: boolean;
  readonly costBudgetMicroUnits?: number;
}

export interface SuperIntelligenceRequest {
  readonly requestId: string;
  readonly timestamp: number;
  readonly payload: MultimodalPayload;
  readonly context: UniversalExecutionContext;
  readonly constraints: UniversalExecutionConstraints;
  readonly targetDimension: DimensionalStateLevel;
  readonly explicitIntentHint?: string;
  readonly preferredLanguage?: LanguageCode;
}

// ─── 2. CAPABILITY PLANNING CONTRACT ───────────────────────────────────────

export type CapabilityNodeStatus = 'PENDING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface CapabilityPlanNode {
  readonly nodeId: string;
  readonly capabilityClass: UniversalCapabilityClass;
  readonly description: string;
  readonly dependencies: readonly string[]; // Node IDs required before this node can run
  readonly estimatedCostMicroUnits: number;
  readonly estimatedLatencyMs: number;
  readonly fallbackCapabilities: readonly UniversalCapabilityClass[];
  readonly status: CapabilityNodeStatus;
  readonly executionTarget: 'INTERNAL_ENGINE' | 'EXTERNAL_PROVIDER' | 'MULTI_AGENT' | 'TOOL_GATEWAY';
}

export interface CapabilityExecutionPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly rootGoal: string;
  readonly nodes: readonly CapabilityPlanNode[];
  readonly executionDAG: Readonly<Record<string, readonly string[]>>; // Parent -> Children
  readonly isParallelizable: boolean;
  readonly totalEstimatedLatencyMs: number;
  readonly planChecksum: string;
  readonly createdTimestamp: number;
}

// ─── 3. MULTI-ENGINE EXECUTION CONTRACT ────────────────────────────────────

export type EngineExecutionState = 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'EXECUTING' | 'COMPLETED' | 'FAULTED';

export interface EngineExecutionTask {
  readonly taskId: string;
  readonly planNodeId: string;
  readonly engineId: string;
  readonly capabilityClass: UniversalCapabilityClass;
  readonly inputPayload: Readonly<Record<string, unknown>>;
  readonly priority: number;
  readonly timeoutMs: number;
}

export interface EngineExecutionResultEnvelope {
  readonly taskId: string;
  readonly engineId: string;
  readonly success: boolean;
  readonly outputData: unknown;
  readonly error?: string;
  readonly executionTimeMs: number;
  readonly memoryAllocatedBytes?: number;
  readonly resonanceScore?: number;
  readonly deterministicChecksum: string;
}

export interface IMultiEngineExecutionManager {
  executePlan(
    plan: CapabilityExecutionPlan,
    request: SuperIntelligenceRequest
  ): Promise<readonly EngineExecutionResultEnvelope[]>;
}

// ─── 4. PROVIDER SELECTION CONTRACT ────────────────────────────────────────

export interface ProviderCandidateScore {
  readonly providerId: string;
  readonly providerType: ProviderType;
  readonly capabilityClass: UniversalCapabilityClass;
  readonly availabilityStatus: ProviderStatus;
  readonly latencyScore: number;       // 0.0 to 1.0 (1.0 = fastest)
  readonly confidenceScore: number;    // 0.0 to 1.0
  readonly costScore: number;          // 0.0 to 1.0 (1.0 = lowest cost)
  readonly sovereignRating: number;    // 0.0 to 1.0 (1.0 = 100% local/air-gapped)
  readonly compositeWeight: number;    // Weighted composite score
}

export interface ProviderSelectionDecision {
  readonly capabilityClass: UniversalCapabilityClass;
  readonly selectedProviderId?: string;
  readonly providerType?: ProviderType;
  readonly resolutionType: 'INTERNAL_SOVEREIGN' | 'REGISTERED_EXTERNAL' | 'HONEST_UNAVAILABLE';
  readonly reason: string;
  readonly candidateScores: readonly ProviderCandidateScore[];
}

export interface IProviderSelector {
  selectProvider(
    capabilityClass: UniversalCapabilityClass,
    constraints: UniversalExecutionConstraints
  ): ProviderSelectionDecision;
}

// ─── 5. AGENT COORDINATION CONTRACT ────────────────────────────────────────

export type UniversalAgentRole =
  | 'COORDINATOR_AGENT'
  | 'RESEARCH_AGENT'
  | 'DESIGN_AGENT'
  | 'CODE_AGENT'
  | 'TESTING_AGENT'
  | 'CRITIC_AGENT'
  | 'SYNTHESIS_JUDGE';

export type AgentMessageIntent =
  | 'TASK_DELEGATE'
  | 'PROPOSAL'
  | 'CRITIQUE'
  | 'REVISION'
  | 'AGREEMENT'
  | 'DISSENT'
  | 'STATUS_UPDATE';

export interface AgentTurnRecord {
  readonly turnId: string;
  readonly senderRole: UniversalAgentRole;
  readonly recipientRole?: UniversalAgentRole | 'BROADCAST';
  readonly intent: AgentMessageIntent;
  readonly content: string;
  readonly artifactsProduced: readonly string[];
  readonly confidenceScore: number;
  readonly timestamp: number;
}

export interface AgentConsensusReport {
  readonly consensusAchieved: boolean;
  readonly consensusScore: number; // Must be >= 0.95 for strict consensus
  readonly participatingRoles: readonly UniversalAgentRole[];
  readonly totalTurns: number;
  readonly finalAgreedSolution: string;
  readonly dissentingOpinions: readonly string[];
  readonly consensusChecksum: string;
}

// ─── 6. TOOL AUTHORIZATION CONTRACT ────────────────────────────────────────

export type SuperToolPermissionLevel =
  | 'READ_ONLY_SANDBOX'
  | 'WORKSPACE_WRITE_CONFINED'
  | 'NETWORK_EGRESS_RESTRICTED'
  | 'SYSTEM_COMMAND_GATED'
  | 'SOVEREIGN_ROOT_RESTRICTED';

export interface SuperToolInvocationRequest {
  readonly invocationId: string;
  readonly toolId: string;
  readonly toolName: string;
  readonly requestedPermission: SuperToolPermissionLevel;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly requestingAgentRole?: UniversalAgentRole;
  readonly justification: string;
}

export interface SuperToolAuthorizationGateResult {
  readonly invocationId: string;
  readonly authorized: boolean;
  readonly grantedPermission: SuperToolPermissionLevel;
  readonly requiresHumanConsent: boolean;
  readonly reason: string;
  readonly securityTokenSignature: string;
}

export interface SuperToolExecutionAuditLog {
  readonly invocationId: string;
  readonly toolId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly exitCode: number;
  readonly sideEffectsRecorded: readonly string[];
  readonly inputHash: string;
  readonly outputHash: string;
}

// ─── 7. DIMENSIONAL STATE TRANSITIONS (D0 <-> D8) ──────────────────────────

export type StateTransitionDirection =
  | 'LIFT_HIGHER_DIMENSION'      // D_n -> D_{n+1}
  | 'PROJECT_LOWER_DIMENSION'    // D_n -> D_{n-1}
  | 'TRANSFORM_HARMONIC_369'     // Triadic vortex rotation
  | 'COLLAPSE_SUPERPOSITION';    // Superposition state selection

export interface DimensionalStateTransition {
  readonly transitionId: string;
  readonly sourceDimension: DimensionalStateLevel;
  readonly targetDimension: DimensionalStateLevel;
  readonly direction: StateTransitionDirection;
  readonly transformationMatrix?: readonly (readonly number[])[];
  readonly harmonicResonanceFlux: number;
  readonly digitalRootClosure: 3 | 6 | 9;
  readonly informationLossFactor: number; // 0.0 = completely lossless
  readonly sourceStateChecksum: string;
  readonly targetStateChecksum: string;
}

// ─── 8. RESULT SYNTHESIS & CROSS-MODAL FUSION CONTRACT ──────────────────────

export interface SynthesizedModalityBlock {
  readonly modality: 'TEXT' | 'IMAGE' | 'VOICE_PCM' | 'CODE' | 'SPATIAL_MESH' | 'STRUCTURED_JSON';
  readonly contentPayload: unknown;
  readonly mimeType: string;
  readonly confidence: number;
  readonly language?: LanguageCode;
}

export interface SuperIntelligenceResponse {
  readonly responseId: string;
  readonly requestId: string;
  readonly planId: string;
  readonly primaryTextOutput: string;
  readonly modalityBlocks: readonly SynthesizedModalityBlock[];
  readonly dimensionalState: {
    readonly level: DimensionalStateLevel;
    readonly nodeChecksum: string;
    readonly digitalRoot369: number;
  };
  readonly consensusReport?: AgentConsensusReport;
  readonly executionTimeMs: number;
  readonly success: boolean;
  readonly verificationPassed: boolean;
  readonly masterResponseChecksum: string;
  readonly timestamp: number;
}

// ─── 9. FAILURE HANDLING & RECOVERY LADDER CONTRACT ────────────────────────

export type DegradationTier =
  | 'TIER_0_FULL_CAPABILITY'
  | 'TIER_1_SOVEREIGN_INTERNAL_ONLY'
  | 'TIER_2_TEXT_AND_SPATIAL_ONLY'
  | 'TIER_3_SAFE_CONVERSATIONAL_FALLBACK'
  | 'TIER_4_FAIL_SAFE_EMERGENCY_HALT';

export interface RecoveryActionRecord {
  readonly recoveryId: string;
  readonly initialError: string;
  readonly failedComponent: string;
  readonly degradationTierAdopted: DegradationTier;
  readonly fallbackEngineUsed?: string;
  readonly recoverySuccessful: boolean;
  readonly userNotificationMessage: string;
}

// ─── 10. TAMPER-EVIDENT DETERMINISTIC AUDIT TRAIL CONTRACT ─────────────────

export interface DeterministicAuditStep {
  readonly stepIndex: number;
  readonly stepName: string;
  readonly componentId: string;
  readonly inputDigest: string;
  readonly outputDigest: string;
  readonly stepVarianceSigmaSq: 0; // Strictly zero variance mathematically
  readonly timestamp: number;
  readonly cumulativeMerkleHash: string;
}

export interface DeterministicAuditTrail {
  readonly traceId: string;
  readonly requestId: string;
  readonly totalSteps: number;
  readonly steps: readonly DeterministicAuditStep[];
  readonly finalMerkleRoot: string;
  readonly isTamperEvident: boolean;
  readonly zeroVarianceCertified: boolean;
}

// ─── MASTER SUPER INTELLIGENCE ORCHESTRATOR CONTRACT ────────────────────────

export interface ISuperIntelligenceOrchestrator {
  /**
   * Executes the universal request through the locked 10-pillar architecture.
   */
  processSuperIntelligence(
    request: SuperIntelligenceRequest
  ): Promise<Readonly<SuperIntelligenceResponse>>;

  /**
   * Performs static capability verification and DAG planning without execution.
   */
  planCapabilities(
    request: SuperIntelligenceRequest
  ): Promise<Readonly<CapabilityExecutionPlan>>;

  /**
   * Validates cryptographic audit trail invariance (sigma^2 = 0).
   */
  verifyAuditTrail(
    auditTrail: DeterministicAuditTrail
  ): Promise<boolean>;
}
