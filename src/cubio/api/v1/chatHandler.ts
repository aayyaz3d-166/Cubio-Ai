/**
 * CUBiO AI — Phase 10: API v1 Chat Route Handler
 * src/cubio/api/v1/chatHandler.ts
 *
 * Primary Intelligence Boundary:
 * POST /api/v1/chat
 *
 * Flow:
 * Client -> API -> Auth/RBAC -> Rate Limit -> Validation -> Ownership -> Chat Engine -> Core Engine -> Safety -> Sanitized Response
 */

import { Request, Response } from 'express';
import { CubiOChatEngine } from '../../intelligence/chat/chatEngine';
import {
  ChatRequest,
  ChatResponse,
  ChatEngineError,
  ChatErrorType,
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../../intelligence/chat/chatEngineContract';
import { UsageLedger } from '../billing/usageLedger';
import { SubscriptionManager } from '../billing/subscriptionManager';
import { PlanRegistry } from '../billing/planRegistry';
import { Native1MProductionService } from '../../inference/native1mProductionService';
import { Phase28ChildModelRegistryManager } from '../../integration/phase28ChildModelRegistryManager';

export interface PublicChatApiResponse {
  readonly requestId: string;
  readonly conversationId: string;
  readonly sessionId: string;
  readonly turnId: string;
  readonly sequence: number;
  readonly status: 'success';
  readonly response: {
    readonly text: string;
    readonly confidence: number;
    readonly epistemicState: string;
  };
  readonly metadata: {
    readonly latencyMs: number;
    readonly mode: string;
    readonly isActuationBlocked: boolean;
    readonly isOfflineIsolated: boolean;
    readonly memoryReferences?: readonly string[];
    readonly selectedModelId?: string;
    readonly fallbackApplied?: boolean;
    readonly childId?: string;
  };
  readonly timestamp: string;
}

export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly detail: string;
  readonly requestId?: string;
  readonly timestamp: string;
}

// Restricted authoritative fields that clients are strictly prohibited from submitting
const PROHIBITED_AUTHORITATIVE_FIELDS = [
  'reasoningResult',
  'neuralOutput',
  'safetyResult',
  'memoryState',
  'spatialState',
  'toolResult',
  'internalDecisionTrace',
  'epistemicStatus',
  'confidence',
  'turn',
  'sequence',
  'integrityHash',
];

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

/**
 * Validate incoming chat request payload
 */
function validateChatPayload(body: any): { valid: boolean; code?: string; detail?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, code: 'INVALID_REQUEST', detail: 'Request body must be a non-null JSON object.' };
  }

  // Check prototype pollution
  const keys = Object.keys(body);
  if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
    return { valid: false, code: 'PROTOTYPE_POLLUTION_DETECTED', detail: 'Prohibited keys detected in payload.' };
  }

  // Disallow client submitting server-authoritative intelligence fields
  for (const field of PROHIBITED_AUTHORITATIVE_FIELDS) {
    if (field in body) {
      return {
        valid: false,
        code: 'AUTHORITATIVE_FIELD_REJECTED',
        detail: `Client is strictly prohibited from submitting authoritative server field: '${field}'.`,
      };
    }
  }

  // Validate requestId
  if (typeof body.requestId !== 'string' || !body.requestId.trim()) {
    return { valid: false, code: 'INVALID_REQUEST_ID', detail: 'requestId is required and must be a non-empty string.' };
  }
  if (body.requestId.length > 128 || !ID_REGEX.test(body.requestId.trim())) {
    return { valid: false, code: 'MALFORMED_REQUEST_ID', detail: 'requestId must be 1-128 characters (alphanumeric, underscore, hyphen).' };
  }

  // Validate conversationId
  if (typeof body.conversationId !== 'string' || !body.conversationId.trim()) {
    return { valid: false, code: 'INVALID_CONVERSATION_ID', detail: 'conversationId is required and must be a non-empty string.' };
  }
  if (body.conversationId.length > 128 || !ID_REGEX.test(body.conversationId.trim())) {
    return { valid: false, code: 'MALFORMED_CONVERSATION_ID', detail: 'conversationId must be 1-128 characters (alphanumeric, underscore, hyphen).' };
  }

  // Validate sessionId if provided
  if (body.sessionId !== undefined) {
    if (typeof body.sessionId !== 'string' || body.sessionId.length > 128 || !ID_REGEX.test(body.sessionId.trim())) {
      return { valid: false, code: 'MALFORMED_SESSION_ID', detail: 'sessionId must be 1-128 characters (alphanumeric, underscore, hyphen).' };
    }
  }

  // Validate message
  if (typeof body.message !== 'string') {
    return { valid: false, code: 'INVALID_MESSAGE', detail: 'message is required and must be a string.' };
  }
  const trimmed = body.message.trim();
  if (trimmed.length === 0) {
    return { valid: false, code: 'EMPTY_MESSAGE', detail: 'message cannot be empty or whitespace only.' };
  }
  if (body.message.length > 4000) {
    return { valid: false, code: 'MESSAGE_TOO_LONG', detail: 'message exceeds maximum allowed length of 4000 characters.' };
  }

  // Validate options if provided
  if (body.options !== undefined) {
    if (typeof body.options !== 'object' || Array.isArray(body.options) || body.options === null) {
      return { valid: false, code: 'INVALID_OPTIONS', detail: 'options must be a JSON object.' };
    }
    if (body.options.spatialCoordinate !== undefined) {
      const coord = body.options.spatialCoordinate;
      if (
        !Array.isArray(coord) ||
        coord.length !== 3 ||
        !coord.every((n: any) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 6)
      ) {
        return {
          valid: false,
          code: 'INVALID_SPATIAL_COORDINATE',
          detail: 'spatialCoordinate must be an array of 3 integers in [0, 6] for 7x7x7 grid.',
        };
      }
    }
    if (body.options.spatialCellId !== undefined) {
      const cellId = body.options.spatialCellId;
      if (typeof cellId !== 'number' || !Number.isInteger(cellId) || cellId < 0 || cellId > 342) {
        return {
          valid: false,
          code: 'INVALID_SPATIAL_CELL_ID',
          detail: 'spatialCellId must be an integer in [0, 342] for 343-cell lattice.',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Primary Chat Route Handler
 */
export async function chatHandler(req: Request, res: Response): Promise<void> {
  const reqStart = Date.now();
  const body = req.body;

  // 1. Validation
  const validation = validateChatPayload(body);
  if (!validation.valid) {
    const isOverflow = validation.code === 'MESSAGE_TOO_LONG';
    const statusCode = isOverflow ? 413 : 400;
    res.status(statusCode).json({
      error: isOverflow ? 'Payload Too Large' : 'Bad Request',
      code: isOverflow ? 'CONTEXT_OVERFLOW' : (validation.code || 'INVALID_REQUEST'),
      detail: validation.detail || 'Validation failed.',
      requestId: body?.requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  const requestId: string = body.requestId.trim();
  const conversationId: string = body.conversationId.trim();
  const sessionId: string | undefined = body.sessionId ? body.sessionId.trim() : undefined;
  const message: string = body.message;

  // 2. Server-authoritative identity resolution
  // Identity is derived STRICTLY from validated authentication credentials
  const keyId = (res.locals['keyId'] as string) || 'ANONYMOUS';
  const role = (res.locals['role'] as string) || 'user';
  const serverDerivedTenantId = `tenant_${role}_${keyId}`;
  const serverDerivedUserId = `user_${keyId}`;

  // Enforce Tenant & User Spoofing Protections:
  // If client supplied tenantId or userId in body, it MUST match the server-derived identity
  if (body.tenantId && body.tenantId !== serverDerivedTenantId && role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      code: 'TENANT_SPOOFING_REJECTED',
      detail: 'Client is not authorized to specify or switch tenant identifiers.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  if (body.userId && body.userId !== serverDerivedUserId && role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      code: 'USER_SPOOFING_REJECTED',
      detail: 'Client is not authorized to specify or switch user identifiers.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  const resolvedTenantId = role === 'admin' && body.tenantId ? body.tenantId : serverDerivedTenantId;
  const resolvedUserId = role === 'admin' && body.userId ? body.userId : serverDerivedUserId;

  // 3. Conversation Ownership & Tenant Isolation Gate
  const chatEngine = CubiOChatEngine.getInstance();
  try {
    const existingSession = chatEngine.getSession(conversationId, resolvedTenantId);
    if (existingSession && existingSession.tenantId !== resolvedTenantId) {
      // Never reveal whether another tenant's conversation exists
      res.status(404).json({
        error: 'Not Found',
        code: 'CONVERSATION_NOT_FOUND',
        detail: 'Conversation does not exist or access is denied.',
        requestId,
        timestamp: new Date().toISOString(),
      } as ApiErrorResponse);
      return;
    }
  } catch (err: any) {
    if (err instanceof ChatEngineError && err.errorType === ChatErrorType.TENANT_ISOLATION_VIOLATION) {
      // Fail closed: 404 Not Found to prevent enumeration attacks
      res.status(404).json({
        error: 'Not Found',
        code: 'CONVERSATION_NOT_FOUND',
        detail: 'Conversation does not exist or access is denied.',
        requestId,
        timestamp: new Date().toISOString(),
      } as ApiErrorResponse);
      return;
    }
  }

  // 4. Commercial Access & Entitlement Gate
  const subscriptionMgr = SubscriptionManager.getInstance();
  const planRegistry = PlanRegistry.getInstance();
  const usageLedger = UsageLedger.getInstance();

  const account = subscriptionMgr.getAccount(resolvedTenantId);
  if (account.status === 'SUSPENDED') {
    res.status(403).json({
      error: 'Forbidden',
      code: 'ACCOUNT_SUSPENDED',
      detail: 'This tenant account has been administratively suspended.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }
  if (account.status === 'DELETED') {
    res.status(403).json({
      error: 'Forbidden',
      code: 'ACCOUNT_DELETED',
      detail: 'This tenant account has been marked as deleted.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  const subscription = subscriptionMgr.getSubscription(resolvedTenantId);
  if (
    subscription.status === 'EXPIRED' ||
    subscription.status === 'CANCELED' ||
    subscription.status === 'SUSPENDED'
  ) {
    res.status(403).json({
      error: 'Forbidden',
      code: 'SUBSCRIPTION_INACTIVE',
      detail: `Subscription status is ${subscription.status}. Please renew or upgrade to continue.`,
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }
  if (subscription.status === 'PAST_DUE') {
    res.status(402).json({
      error: 'Payment Required',
      code: 'SUBSCRIPTION_PAST_DUE',
      detail: 'Subscription payment is past due.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  const plan = planRegistry.getPlan(subscription.planId);
  if (!plan || !plan.entitlements.includes('CHAT_ACCESS')) {
    res.status(403).json({
      error: 'Forbidden',
      code: 'ENTITLEMENT_REQUIRED',
      detail: `Current plan (${subscription.planId}) lacks required entitlement: 'CHAT_ACCESS'.`,
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  if (
    body.options &&
    (body.options.spatialCoordinate !== undefined || body.options.spatialCellId !== undefined) &&
    !plan.entitlements.includes('SPATIAL_ACCESS')
  ) {
    res.status(403).json({
      error: 'Forbidden',
      code: 'ENTITLEMENT_REQUIRED',
      detail: `Current plan (${subscription.planId}) lacks required entitlement: 'SPATIAL_ACCESS'.`,
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  // Pre-execution usage limit reservation
  const maxRequests = plan.limits.maxRequestsPerPeriod;
  const reservation = await usageLedger.reserveRequest(
    resolvedTenantId,
    requestId,
    maxRequests,
    resolvedUserId,
    conversationId
  );

  if (!reservation.allowed) {
    res.status(429).json({
      error: 'Too Many Requests',
      code: 'USAGE_LIMIT_EXCEEDED',
      detail: reservation.reason || 'Period request quota exceeded.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  // 4b. Child Agent & Model Selection Validation (Phase 28 Task 452)
  const childId: string = (body.options && body.options.childId) || 'cubio-child-mvp';
  const requestedModelId: string | undefined = body.options && body.options.modelId;
  const childModelManager = Phase28ChildModelRegistryManager.getInstance();
  const modelValidation = childModelManager.validateAndResolveModel(childId, requestedModelId);

  if (!modelValidation.valid) {
    // Release in-flight reservation
    await usageLedger.releaseReservation(resolvedTenantId, requestId);
    const statusCode = modelValidation.errorCode === 'UNAUTHORIZED_MODEL' ? 403 : 400;
    res.status(statusCode).json({
      error: modelValidation.errorCode === 'UNAUTHORIZED_MODEL' ? 'Forbidden' : 'Bad Request',
      code: modelValidation.errorCode || 'INVALID_MODEL_SELECTION',
      detail: modelValidation.reason || 'Requested model selection is not permitted.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
    return;
  }

  const effectiveModelId = modelValidation.selectedModelId;
  const fallbackApplied = modelValidation.fallbackApplied;

  // 5. Safe Request Dispatch to Chat & Context Engine
  try {
    const engineRequest: ChatRequest = {
      requestId,
      conversationId,
      sessionId,
      tenantId: resolvedTenantId,
      userId: resolvedUserId,
      message,
      options: body.options ? {
        spatialCoordinate: body.options.spatialCoordinate,
        spatialCellId: body.options.spatialCellId,
        preferredStrategy: body.options.preferredStrategy,
        temperature: body.options.temperature,
        timeoutMs: body.options.timeoutMs,
      } : undefined,
    };

    const chatResponse: ChatResponse = await chatEngine.executeChat(engineRequest);

    // Commit authoritative usage metering
    await UsageLedger.getInstance().commitRequest(
      resolvedTenantId,
      requestId,
      chatResponse.text.length,
      resolvedUserId,
      conversationId
    );

    // 5. Response Sanitization & Serialization
    // Strip private internal traces, model weights, database schemas, filesystem paths
    const publicResponse: PublicChatApiResponse = {
      requestId: chatResponse.requestId,
      conversationId: chatResponse.conversationId,
      sessionId: chatResponse.sessionId,
      turnId: chatResponse.turnId,
      sequence: chatResponse.sequence,
      status: 'success',
      response: {
        text: chatResponse.text,
        confidence: chatResponse.confidence,
        epistemicState: chatResponse.epistemicState,
      },
      metadata: {
        latencyMs: chatResponse.latencyMs || (Date.now() - reqStart),
        mode: Native1MProductionService.getInstance().isReady()
          ? 'NATIVE_1M_PRODUCTION_SEALED'
          : 'NEURAL_SHADOW',
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: OFFLINE_ISOLATED,
        memoryReferences: (chatResponse as any).turn?.memoryReferences || [],
        selectedModelId: effectiveModelId,
        fallbackApplied,
        childId,
      },
      timestamp: new Date(chatResponse.timestamp).toISOString(),
    };

    res.status(200).json(publicResponse);
  } catch (err: any) {
    console.error('[CHAT_HANDLER_ERROR]', err);
    // Release in-flight reservation on execution error
    await UsageLedger.getInstance().releaseReservation(resolvedTenantId, requestId);

    // Sanitized Error Handling (No stack traces, no internal leaks)
    if (err?.name === 'CoreEngineError' && err?.errorType === 'SECURITY_VIOLATION') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'SECURITY_VIOLATION',
        detail: 'The requested operation violates CUBiO security policy and is prohibited fail-closed.',
        requestId,
        timestamp: new Date().toISOString(),
      } as ApiErrorResponse);
      return;
    }

    if (err instanceof ChatEngineError) {
      let statusCode = 400;
      if (err.errorType === ChatErrorType.TENANT_ISOLATION_VIOLATION) statusCode = 404;
      else if (err.errorType === ChatErrorType.SESSION_ISOLATION_VIOLATION) statusCode = 403;
      else if (err.errorType === ChatErrorType.ACTUATION_PROHIBITED) statusCode = 403;
      else if (err.errorType === ChatErrorType.IDEMPOTENCY_COLLISION) statusCode = 409;
      else if (err.errorType === ChatErrorType.SEQUENCE_VIOLATION) statusCode = 409;
      else if (err.errorType === ChatErrorType.CONTEXT_OVERFLOW) statusCode = 413;

      res.status(statusCode).json({
        error: 'Chat Execution Error',
        code: err.errorType,
        detail: err.message.replace(/^\[[^\]]+\]\s*/, ''),
        requestId,
        timestamp: new Date().toISOString(),
      } as ApiErrorResponse);
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected internal error occurred. Forensic log recorded.',
      requestId,
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse);
  }
}
