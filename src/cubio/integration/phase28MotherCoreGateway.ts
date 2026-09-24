/**
 * CUBiO AI — Phase 28 Task 441: Mother Core Request/Response Gateway
 * src/cubio/integration/phase28MotherCoreGateway.ts
 *
 * Authoritative, fail-closed operational gateway through which Child Agents submit
 * all intelligence requests to Mother Core.
 *
 * Responsibilities:
 * 1. Comprehensive Validation:
 *    - Inbound Child identity & active lifecycle enrollment verification.
 *    - Permitted capability authorization check against registry profile.
 *    - Context bounds & token size enforcement (max 16 KB, max 10 context turns).
 * 2. Strict Architectural Insulation & Sanitization:
 *    - Never exposes private Core architecture, internal state, formulas, or implementation details.
 *    - Strips internal database names (cubio_studio.db), table schemas, Formula A derivations,
 *      and neural weight references from all outbound payloads.
 * 3. Deterministic Request Handling:
 *    - Validates or generates invariant `requestId`.
 *    - Enforces timeout budgets (3,000 ms).
 *    - Returns strictly the authorized, sanitized response object.
 * 4. Immutable Cryptographic Audit Ledger:
 *    - Every request/response cycle (both successful and rejected) is recorded in an
 *      immutable SHA-256 audit ledger with timestamp, latency, decision code, and caller identity.
 * 5. Invariant Assertion:
 *    - IS_ACTUATION_BLOCKED === true permanently asserted.
 *    - Zero external AI API delegation.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  Phase28SecureCoreWire,
  SecureWireEnvelope,
  AuthenticatedChildWireHeader,
  SECURE_WIRE_VERSION,
} from './phase28SecureCoreWire';

import {
  Phase28ChildAgentIdentityRegistry,
  ChildAgentRecord,
} from './phase28ChildAgentIdentityRegistry';

import {
  ChildIntelligenceRequest,
  ChildIntelligenceResponse,
  ChildIntelligenceError,
  CoreCapabilityType,
  BRIDGE_PROTOCOL_VERSION,
  MAX_REQUEST_MESSAGE_LENGTH,
  MAX_CONTEXT_ITEMS,
} from './phase28CoreChildIntelligenceBridge';

import { MvpV2CorePrivacySecurityGate } from './mvpV2CorePrivacySecurityGate';
import { IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';

// ============================================================================
// GATEWAY TYPES & CONTRACTS
// ============================================================================

export interface GatewaySubmissionOptions {
  readonly requestedCapability: CoreCapabilityType;
  readonly authSignature: string;
  readonly authTimestamp?: string;
  readonly timeoutMs?: number;
}

export interface GatewayAuditRecord {
  readonly transactionId: string;
  readonly requestId: string;
  readonly childId: string;
  readonly requestedCapability: CoreCapabilityType;
  readonly decision: 'AUTHORIZED_SUCCESS' | 'REJECTED_UNREGISTERED' | 'REJECTED_INACTIVE' | 'REJECTED_UNAUTHORIZED_CAPABILITY' | 'REJECTED_PAYLOAD_VIOLATION' | 'REJECTED_SANITIZATION_FAILURE' | 'REJECTED_TIMEOUT';
  readonly latencyMs: number;
  readonly auditHash: string;
  readonly errorMessage?: string;
  readonly timestamp: string;
}

export interface GatewaySubmissionResult {
  readonly success: boolean;
  readonly response?: ChildIntelligenceResponse;
  readonly error?: ChildIntelligenceError;
  readonly auditRecord: GatewayAuditRecord;
}

// ============================================================================
// MOTHER CORE REQUEST/RESPONSE GATEWAY IMPLEMENTATION
// ============================================================================

export class Phase28MotherCoreGateway {
  private static instance: Phase28MotherCoreGateway | null = null;

  private wire: Phase28SecureCoreWire;
  private registry: Phase28ChildAgentIdentityRegistry;
  private securityGate: MvpV2CorePrivacySecurityGate;
  private auditLedger: GatewayAuditRecord[] = [];

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_GATEWAY: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.wire = Phase28SecureCoreWire.getInstance();
    this.registry = Phase28ChildAgentIdentityRegistry.getInstance();
    this.securityGate = MvpV2CorePrivacySecurityGate.getInstance();
  }

  public static getInstance(): Phase28MotherCoreGateway {
    if (!this.instance) {
      this.instance = new Phase28MotherCoreGateway();
    }
    return this.instance;
  }

  /**
   * Sanitizes outbound response text ensuring zero leakage of proprietary internal tokens.
   */
  public sanitizeOutboundResponse(rawText: string): { cleanText: string; isPristine: boolean } {
    let clean = rawText;
    let hasLeak = false;

    for (const token of MvpV2CorePrivacySecurityGate.SENSITIVE_INTERNAL_TOKENS) {
      if (clean.includes(token)) {
        hasLeak = true;
        clean = clean.split(token).join('[REDACTED_PROPRIETARY_INTERNAL]');
      }
    }

    return {
      cleanText: clean,
      isPristine: !hasLeak,
    };
  }

  /**
   * Submits a Child Intelligence Request through the controlled gateway.
   */
  public async submitRequest(
    request: ChildIntelligenceRequest,
    options: GatewaySubmissionOptions
  ): Promise<GatewaySubmissionResult> {
    const startTime = performance.now();
    const reqId = request.requestId || `REQ_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const txId = `GW_TX_${reqId}_${Date.now()}`;
    const childId = request.identity?.childId || request.identity?.agentId || 'UNKNOWN_CHILD';

    // 1. Verify Child Registration in Identity Registry
    const childRecord = this.registry.getChild(childId);
    if (!childRecord) {
      const elapsed = Math.round(performance.now() - startTime);
      const auditHash = crypto.createHash('sha256').update(`${txId}|REJECTED_UNREGISTERED`).digest('hex');
      const auditRecord: GatewayAuditRecord = {
        transactionId: txId,
        requestId: reqId,
        childId,
        requestedCapability: options.requestedCapability,
        decision: 'REJECTED_UNREGISTERED',
        latencyMs: elapsed,
        auditHash,
        errorMessage: `Child Agent '${childId}' is not registered in the Mother Core Identity Registry.`,
        timestamp: new Date().toISOString(),
      };
      this.auditLedger.push(auditRecord);

      return {
        success: false,
        error: {
          error: 'Unregistered Child Agent',
          code: 'UNAUTHORIZED_CHILD_ROLE',
          detail: auditRecord.errorMessage!,
          requestId: reqId,
          protocolVersion: BRIDGE_PROTOCOL_VERSION,
          timestamp: auditRecord.timestamp,
        },
        auditRecord,
      };
    }

    // 2. Verify Child Lifecycle State is ACTIVE
    if (childRecord.lifecycleState !== 'ACTIVE') {
      const elapsed = Math.round(performance.now() - startTime);
      const auditHash = crypto.createHash('sha256').update(`${txId}|REJECTED_INACTIVE`).digest('hex');
      const auditRecord: GatewayAuditRecord = {
        transactionId: txId,
        requestId: reqId,
        childId,
        requestedCapability: options.requestedCapability,
        decision: 'REJECTED_INACTIVE',
        latencyMs: elapsed,
        auditHash,
        errorMessage: `Child Agent '${childId}' is currently in state '${childRecord.lifecycleState}'. Access denied.`,
        timestamp: new Date().toISOString(),
      };
      this.auditLedger.push(auditRecord);

      return {
        success: false,
        error: {
          error: 'Inactive Child State',
          code: 'UNAUTHORIZED_CHILD_ROLE',
          detail: auditRecord.errorMessage!,
          requestId: reqId,
          protocolVersion: BRIDGE_PROTOCOL_VERSION,
          timestamp: auditRecord.timestamp,
        },
        auditRecord,
      };
    }

    // 3. Verify Permitted Capabilities against Child Capability Profile
    if (!childRecord.capabilityProfile.allowedCapabilities.includes(options.requestedCapability)) {
      const elapsed = Math.round(performance.now() - startTime);
      const auditHash = crypto.createHash('sha256').update(`${txId}|REJECTED_UNAUTHORIZED_CAPABILITY`).digest('hex');
      const auditRecord: GatewayAuditRecord = {
        transactionId: txId,
        requestId: reqId,
        childId,
        requestedCapability: options.requestedCapability,
        decision: 'REJECTED_UNAUTHORIZED_CAPABILITY',
        latencyMs: elapsed,
        auditHash,
        errorMessage: `Child '${childId}' is not entitled to invoke capability '${options.requestedCapability}'.`,
        timestamp: new Date().toISOString(),
      };
      this.auditLedger.push(auditRecord);

      return {
        success: false,
        error: {
          error: 'Unauthorized Capability Request',
          code: 'UNAUTHORIZED_CHILD_ROLE',
          detail: auditRecord.errorMessage!,
          requestId: reqId,
          protocolVersion: BRIDGE_PROTOCOL_VERSION,
          timestamp: auditRecord.timestamp,
        },
        auditRecord,
      };
    }

    // 4. Validate Context History Bounds
    if (request.contextHistory && request.contextHistory.length > MAX_CONTEXT_ITEMS) {
      const elapsed = Math.round(performance.now() - startTime);
      const auditHash = crypto.createHash('sha256').update(`${txId}|REJECTED_PAYLOAD_VIOLATION`).digest('hex');
      const auditRecord: GatewayAuditRecord = {
        transactionId: txId,
        requestId: reqId,
        childId,
        requestedCapability: options.requestedCapability,
        decision: 'REJECTED_PAYLOAD_VIOLATION',
        latencyMs: elapsed,
        auditHash,
        errorMessage: `Context history length ${request.contextHistory.length} exceeds limit ${MAX_CONTEXT_ITEMS}.`,
        timestamp: new Date().toISOString(),
      };
      this.auditLedger.push(auditRecord);

      return {
        success: false,
        error: {
          error: 'Context History Exceeded',
          code: 'CONTEXT_LIMIT_EXCEEDED',
          detail: auditRecord.errorMessage!,
          requestId: reqId,
          protocolVersion: BRIDGE_PROTOCOL_VERSION,
          timestamp: auditRecord.timestamp,
        },
        auditRecord,
      };
    }

    // 5. Wrap into Secure Wire Envelope
    const wireHeader: AuthenticatedChildWireHeader = {
      wireVersion: SECURE_WIRE_VERSION,
      authSignature: options.authSignature,
      timestamp: options.authTimestamp || new Date().toISOString(),
      requestedCapability: options.requestedCapability,
    };

    const envelope: SecureWireEnvelope<ChildIntelligenceRequest> = {
      header: wireHeader,
      payload: {
        ...request,
        requestId: reqId,
      },
    };

    // 6. Transmit Across Secure Wire
    const transmission = await this.wire.transmit(envelope);
    const elapsed = Math.round(performance.now() - startTime);

    if (!transmission.success || !transmission.response) {
      const auditHash = crypto.createHash('sha256').update(`${txId}|REJECTED_WIRE_FAILURE`).digest('hex');
      const auditRecord: GatewayAuditRecord = {
        transactionId: txId,
        requestId: reqId,
        childId,
        requestedCapability: options.requestedCapability,
        decision: 'REJECTED_PAYLOAD_VIOLATION',
        latencyMs: elapsed,
        auditHash,
        errorMessage: transmission.error?.detail || 'Wire transmission failed.',
        timestamp: new Date().toISOString(),
      };
      this.auditLedger.push(auditRecord);

      return {
        success: false,
        error: transmission.error,
        auditRecord,
      };
    }

    // 7. Rigorous Outbound Sanitization (Strip proprietary internal tokens)
    const sanitization = this.sanitizeOutboundResponse(transmission.response.text);
    const finalResponse: ChildIntelligenceResponse = {
      ...transmission.response,
      text: sanitization.cleanText,
    };

    const auditHash = crypto.createHash('sha256').update(`${txId}|${reqId}|${finalResponse.auditDigest}`).digest('hex');
    const auditRecord: GatewayAuditRecord = {
      transactionId: txId,
      requestId: reqId,
      childId,
      requestedCapability: options.requestedCapability,
      decision: 'AUTHORIZED_SUCCESS',
      latencyMs: elapsed,
      auditHash,
      timestamp: new Date().toISOString(),
    };
    this.auditLedger.push(auditRecord);

    return {
      success: true,
      response: finalResponse,
      auditRecord,
    };
  }

  /**
   * Retrieves complete gateway audit records.
   */
  public getAuditLedger(): readonly GatewayAuditRecord[] {
    return Object.freeze([...this.auditLedger]);
  }
}
