/**
 * CUBiO AI — Web MVP Additional Endpoints Handler
 * src/cubio/api/v1/mvpHandlers.ts
 *
 * Implements:
 * - POST /api/v1/query    (Direct authoritative retrieval & Q&A)
 * - GET  /api/v1/memory   (Persistent memory & VDB status)
 * - GET  /api/v1/context  (Session context inspection)
 * - POST /api/v1/session  (Session lifecycle management)
 * - POST /api/v1/feedback (User experience feedback capture)
 * - GET  /api/v1/metrics  (Telemetry & resource monitoring)
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ContextManager } from '../../inference/context/contextManager';
import { MetricsCollector } from '../../infra/observability/metricsCollector';
import { Native1MProductionService } from '../../inference/native1mProductionService';
import { CubiOChatEngine } from '../../intelligence/chat/chatEngine';
import { IS_ACTUATION_BLOCKED } from '../../intelligence/chat/chatEngineContract';

const CANONICAL_VDB_SHA256 = 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6';
const CANONICAL_VDB_SIZE = 77824;

function resolveIdentity(res: Response): { tenantId: string; userId: string } {
  const keyId = (res.locals['keyId'] as string) || 'ANONYMOUS';
  const role = (res.locals['role'] as string) || 'user';
  return {
    tenantId: `tenant_${role}_${keyId}`,
    userId: `user_${keyId}`,
  };
}

/**
 * POST /api/v1/query
 * Direct single-turn Q&A query using authoritative CUBiO intelligence pipeline.
 */
export async function queryHandler(req: Request, res: Response): Promise<void> {
  const startTime = performance.now();
  const { query, prompt, sessionId } = req.body || {};
  const userText = (typeof query === 'string' ? query : (typeof prompt === 'string' ? prompt : '')).trim();

  if (!userText) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'EMPTY_QUERY',
      detail: 'Field "query" or "prompt" must be a non-empty string.',
    });
    return;
  }

  const sid = sessionId || 'session_query_' + Date.now();
  const cid = 'conv_' + sid;
  const identity = resolveIdentity(res);

  try {
    const chatEngine = CubiOChatEngine.getInstance();
    const result = await chatEngine.executeChat({
      conversationId: cid,
      sessionId: sid,
      message: userText,
      requestId: 'req_query_' + crypto.randomUUID(),
      tenantId: identity.tenantId,
      userId: identity.userId,
    });

    const duration = Math.round(performance.now() - startTime);

    res.json({
      status: 'success',
      query: userText,
      response: result.text,
      confidence: result.confidence,
      epistemicState: result.epistemicState,
      metadata: {
        latencyMs: duration,
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'QUERY_PROCESSING_FAILED',
      detail: err.message,
    });
  }
}

/**
 * GET /api/v1/memory
 * Persistent VDB and memory state inspector.
 */
export function memoryHandler(_req: Request, res: Response): void {
  const dbPath = path.resolve(process.cwd(), 'data', 'cubio_studio.db');
  let dbExists = false;
  let dbSize = 0;
  let dbSha = '';

  if (fs.existsSync(dbPath)) {
    dbExists = true;
    const buf = fs.readFileSync(dbPath);
    dbSize = buf.length;
    dbSha = crypto.createHash('sha256').update(buf).digest('hex');
  }

  const contextMgr = ContextManager.getInstance();
  const activeSessions = contextMgr.getActiveSessionCount();

  res.json({
    status: 'ok',
    vdb: {
      path: 'data/cubio_studio.db',
      exists: dbExists,
      sizeBytes: dbSize,
      sha256: dbSha,
      isCanonical: dbSize === CANONICAL_VDB_SIZE && dbSha === CANONICAL_VDB_SHA256,
    },
    memory: {
      activeSessions,
      storagePath: ContextManager.DEFAULT_STORAGE_PATH,
      address369Cells: 343,
      symbolicAnchors: 26,
      totalAddressSpace: 369,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/v1/context
 * Context state for active sessions.
 */
export function contextHandler(req: Request, res: Response): void {
  const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);

  if (!sessionId) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_SESSION_ID',
      detail: 'Query parameter "sessionId" or X-Session-Id header is required.',
    });
    return;
  }

  const identity = resolveIdentity(res);
  const contextMgr = ContextManager.getInstance();

  try {
    const session = contextMgr.getSession(sessionId, identity.tenantId);
    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        code: 'SESSION_NOT_FOUND',
        detail: `Session '${sessionId}' was not found.`,
      });
      return;
    }

    const history = session.getHistory();
    res.json({
      status: 'ok',
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      turnCount: history.length,
      turns: history.slice(-10).map((t: any) => ({
        role: t.role,
        text: (t.content || t.text || '').slice(0, 200),
        timestamp: t.timestamp || session.updatedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(403).json({
      error: 'Forbidden',
      code: 'TENANT_ISOLATION_VIOLATION',
      detail: err.message,
    });
  }
}

/**
 * POST /api/v1/session
 * Create, retrieve, or reset session.
 */
export function sessionHandler(req: Request, res: Response): void {
  const { sessionId, action } = req.body || {};
  const sid = sessionId || 'session_' + crypto.randomUUID();
  const identity = resolveIdentity(res);
  const contextMgr = ContextManager.getInstance();

  try {
    const session = contextMgr.getOrCreateSession(sid, identity.tenantId);
    if (action === 'reset') {
      (session as any).history.length = 0;
    }

    const history = session.getHistory();
    res.json({
      status: 'ok',
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      action: action || 'active',
      turnCount: history.length,
      createdAt: session.createdAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'SESSION_OPERATION_FAILED',
      detail: err.message,
    });
  }
}

/**
 * POST /api/v1/feedback
 * Log user feedback.
 */
export function feedbackHandler(req: Request, res: Response): void {
  const { messageId, rating, feedback, turnId } = req.body || {};

  if (rating === undefined && !feedback) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'INVALID_FEEDBACK',
      detail: 'Provide at least a numeric "rating" (1-5) or text "feedback".',
    });
    return;
  }

  const feedbackId = 'fb_' + crypto.randomUUID();
  console.log(`[FEEDBACK] Ingested feedback ${feedbackId}: rating=${rating}, turnId=${turnId || 'n/a'}, user=${(req as any).user?.userId || 'anon'}`);

  res.json({
    status: 'success',
    feedbackId,
    messageId: messageId || null,
    turnId: turnId || null,
    rating: rating ?? null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/v1/metrics
 * System telemetry, performance, and resource utilization.
 */
export function metricsHandler(_req: Request, res: Response): void {
  const collector = MetricsCollector.getInstance();
  const snapshot = collector.getSnapshot();
  const native1m = Native1MProductionService.getInstance();
  const modelMeta = native1m.getModelMetadata();

  res.json({
    status: 'ok',
    metrics: snapshot,
    model: {
      initialized: native1m.isReady(),
      parameters: modelMeta?.parameters || 971520,
      layers: modelMeta?.layerCount || 6,
      hiddenDimension: modelMeta?.hiddenDimension || 256,
      vocabSize: modelMeta?.vocabSize || 1024,
    },
    safety: {
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      externalPretrainedModels: 0,
    },
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
  });
}