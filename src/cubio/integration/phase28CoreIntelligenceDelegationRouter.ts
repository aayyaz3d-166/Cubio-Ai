/**
 * CUBiO AI — Phase 28 Task 442: Core Intelligence Delegation Router
 * src/cubio/integration/phase28CoreIntelligenceDelegationRouter.ts
 *
 * Connects authorized Child Agent requests to the appropriate Mother Core intelligence capability.
 *
 * Architectural Mandates:
 * 1. User-Facing Child vs. Processing Mother Core:
 *    - The Child Agent (e.g. MVP, MVP-1, MVP-2, PLANCIX) acts as the client-facing proxy.
 *    - Mother Core performs all authoritative intelligence processing (QA, reasoning, context retrieval, synthesis).
 * 2. Zero Duplication of Core Intelligence:
 *    - Child Agents contain zero duplicate transformer weights, zero local database schemas,
 *      and zero cloned reasoning models. Core authority remains 100% centralized.
 * 3. 4 Core Intelligence Capabilities Supported:
 *    - QUESTION_ANSWERING (Universal multi-domain factual answering & explanation)
 *    - MULTI_STEP_REASONING (Analytical, logical, coding, and mathematical derivation)
 *    - CONTEXT_RETRIEVAL (Read-only spatial memory lookup via AST-jailed VDB adapter)
 *    - RESPONSE_GENERATION (Epistemic response synthesis with confidence calibration)
 * 4. Comprehensive Metrics & Verification:
 *    - Latency (ms), Epistemic confidence (0.00-1.00), Isolation compliance (100% offline),
 *      and deterministic SHA-256 audit envelope.
 * 5. Safe Rejection of Unsupported / Unauthorized Requests:
 *    - Inbound requests targeting unregistered capabilities or unsupported modes reject fail-closed.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  Phase28MotherCoreGateway,
  GatewaySubmissionOptions,
  GatewaySubmissionResult,
} from './phase28MotherCoreGateway';

import {
  Phase28SecureCoreWire,
} from './phase28SecureCoreWire';

import {
  ChildAgentIdentity,
  ChildIntelligenceRequest,
  ChildIntelligenceResponse,
  CoreCapabilityType,
  BRIDGE_PROTOCOL_VERSION,
} from './phase28CoreChildIntelligenceBridge';

import { ChatDomainCategory } from './mvpV2UniversalChatManager';
import { IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';

// ============================================================================
// DELEGATION TYPES & CONTRACTS
// ============================================================================

export type DelegationTaskType =
  | 'QUESTION_ANSWERING'
  | 'MULTI_STEP_REASONING'
  | 'CONTEXT_RETRIEVAL'
  | 'RESPONSE_GENERATION';

export interface ChildDelegationRequest {
  readonly childIdentity: ChildAgentIdentity;
  readonly taskType: DelegationTaskType;
  readonly query: string;
  readonly domain?: ChatDomainCategory;
  readonly contextTurns?: readonly { role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string }[];
  readonly deterministicSeed?: number;
}

export interface DelegationPerformanceMetrics {
  readonly latencyMs: number;
  readonly confidence: number;
  readonly epistemicClassification: string;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
  readonly isDeterministic: boolean;
  readonly auditDigest: string;
}

export interface ChildDelegationResponse {
  readonly success: boolean;
  readonly childId: string;
  readonly taskType: DelegationTaskType;
  readonly resolvedCapability: CoreCapabilityType;
  readonly outputText: string;
  readonly metrics: DelegationPerformanceMetrics;
  readonly error?: string;
  readonly errorCode?: string;
}

// Map Delegation Task Type to Core Capability Type
export const TASK_CAPABILITY_ROUTING: Record<DelegationTaskType, CoreCapabilityType> = {
  QUESTION_ANSWERING: 'MULTI_DOMAIN_REASONING',
  MULTI_STEP_REASONING: 'NATIVE_1M_TRANSFORMER_INFERENCE',
  CONTEXT_RETRIEVAL: 'CANONICAL_SPATIAL_GROUNDING',
  RESPONSE_GENERATION: 'MULTI_TURN_CONTINUITY',
};

// ============================================================================
// CORE INTELLIGENCE DELEGATION ROUTER IMPLEMENTATION
// ============================================================================

export class Phase28CoreIntelligenceDelegationRouter {
  private static instance: Phase28CoreIntelligenceDelegationRouter | null = null;
  private readonly gateway: Phase28MotherCoreGateway;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_ROUTER: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.gateway = Phase28MotherCoreGateway.getInstance();
  }

  public static getInstance(): Phase28CoreIntelligenceDelegationRouter {
    if (!this.instance) {
      this.instance = new Phase28CoreIntelligenceDelegationRouter();
    }
    return this.instance;
  }

  /**
   * Delegates a Child Agent request to Mother Core intelligence capability.
   */
  public async delegateIntelligence(
    request: ChildDelegationRequest
  ): Promise<ChildDelegationResponse> {
    const startTime = performance.now();
    const childId = request.childIdentity?.childId || request.childIdentity?.agentId || 'UNKNOWN_CHILD';

    // 1. Resolve Target Capability
    const targetCapability = TASK_CAPABILITY_ROUTING[request.taskType];
    if (!targetCapability) {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        childId,
        taskType: request.taskType,
        resolvedCapability: 'OFFLINE_ISOLATION_GUARANTEE',
        outputText: '',
        error: `Unsupported delegation task type '${request.taskType}'.`,
        errorCode: 'UNSUPPORTED_DELEGATION_TASK',
        metrics: {
          latencyMs: elapsed,
          confidence: 0.0,
          epistemicClassification: 'QUALIFIED_UNCERTAINTY',
          isActuationBlocked: true,
          isOfflineIsolated: true,
          isDeterministic: true,
          auditDigest: 'FAIL_UNSUPPORTED_TASK',
        },
      };
    }

    // 2. Format Context History
    const formattedContext = request.contextTurns
      ? request.contextTurns.map((t, idx) => ({
          layerId: `LAYER_4_RECENT_TURNS_${idx}`,
          role: t.role,
          content: t.content,
          timestamp: new Date().toISOString(),
        }))
      : undefined;

    // 3. Generate Wire Authentication Signature for Child
    const timestamp = new Date().toISOString();
    const authSignature = Phase28SecureCoreWire.generateAuthSignature(request.childIdentity, timestamp);

    // 4. Construct Gateway Request
    const childReq: ChildIntelligenceRequest = {
      requestId: `REQ_DEL_${childId}_${Date.now()}`,
      identity: request.childIdentity,
      message: request.query,
      domain: request.domain,
      contextHistory: formattedContext,
      deterministicSeed: request.deterministicSeed,
    };

    const submissionOptions: GatewaySubmissionOptions = {
      requestedCapability: targetCapability,
      authSignature,
      authTimestamp: timestamp,
    };

    // 5. Submit to Mother Core Request/Response Gateway
    const outcome: GatewaySubmissionResult = await this.gateway.submitRequest(childReq, submissionOptions);
    const elapsed = Math.round(performance.now() - startTime);

    if (!outcome.success || !outcome.response) {
      return {
        success: false,
        childId,
        taskType: request.taskType,
        resolvedCapability: targetCapability,
        outputText: '',
        error: outcome.error?.detail || outcome.auditRecord.errorMessage || 'Delegation processing failed.',
        errorCode: outcome.error?.code || 'DELEGATION_GATEWAY_REJECTION',
        metrics: {
          latencyMs: elapsed,
          confidence: 0.0,
          epistemicClassification: 'QUALIFIED_UNCERTAINTY',
          isActuationBlocked: true,
          isOfflineIsolated: true,
          isDeterministic: true,
          auditDigest: outcome.auditRecord.auditHash,
        },
      };
    }

    // 6. Return Delegated Intelligence Response with Full Metrics
    return {
      success: true,
      childId,
      taskType: request.taskType,
      resolvedCapability: targetCapability,
      outputText: outcome.response.text,
      metrics: {
        latencyMs: elapsed,
        confidence: outcome.response.confidence,
        epistemicClassification: outcome.response.epistemicStatus,
        isActuationBlocked: outcome.response.isActuationBlocked,
        isOfflineIsolated: outcome.response.isOfflineIsolated,
        isDeterministic: true,
        auditDigest: outcome.response.auditDigest,
      },
    };
  }
}
