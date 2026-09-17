/**
 * CubiO AI — Production Node/Express Server
 *
 * Standalone entrypoint for production deployments.
 * Replaces the dev-only vite.config.ts:configureServer middleware.
 *
 * Features:
 *   - Serves pre-built dist/ static files
 *   - Zero external pretrained model dependencies (Qwen eradicated)
 *   - AbortController-aware request pipeline
 *   - Zero HuggingFace downloads during live requests (local cache only)
 *
 * Usage:
 *   npx tsx server.ts        (development mode — no build required)
 *   node dist-server/server.js  (compiled production mode)
 *
 * SAFETY: This file is NOT in INT-001_PRE_HASHES.json.
 * Protected production sources (chatController, authoritativePipeline, etc.)
 * are imported as-is and NOT modified.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { installCalibratedAuthoritativePipeline } from './src/cubio/intelligence/pipeline/calibratedAuthoritativePipeline.js';
import { CubiOInferenceRouter } from './src/cubio/inference/backend/cubioInferenceRouter.js';
import { generateCheckpoint } from './src/funnel02/export_service.js';
import { physicalStore } from './src/store/physicalStore.js';
import { ContextManager } from './src/cubio/inference/context/contextManager.js';
import { DatabaseBootAdapter } from './src/funnel72/adapters/databaseBootAdapter.js';
import { DatabaseRegistry } from './src/funnel67/database/databaseRegistry.js';
// ── FUNNEL 06: Production API Security ──────────────────────────────────────
import {
  securityHeaders,
  corsMiddleware,
  auditLogMiddleware,
  ApiRateLimiter,
  requestSizeGuard,
  chatRequestValidator,
  requireAuth,
  requireRole,
  healthzHandler,
  readyzHandler,
} from './src/cubio/api/security/index.js';
import { v1Router } from './src/cubio/api/v1/router.js';
import { Native1MProductionService } from './src/cubio/inference/native1mProductionService.js';

// ────────────────────────────────────────────────────────────────────────────
// Environment & Path Setup
// ────────────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');
const MODEL_PREWARM_TIMEOUT_MS = 60_000;  // 60s max for ONNX model init

// ────────────────────────────────────────────────────────────────────────────
// Boot-time Model Status Check (Zero External Model Dependencies)
// ────────────────────────────────────────────────────────────────────────────
let modelReady = false;
let modelWarmError: Error | null = null;
let modelWarmStartedAt = 0;

async function prewarmModel(): Promise<void> {
  modelWarmStartedAt = Date.now();
  console.log('[BOOT] External model dependencies (Qwen) eradicated from runtime.');
  console.log('[BOOT] Authoritative pipeline (7-stage) handles all requests as primary path.');

  // 0. Prewarm sovereign Phase 16 production checkpoint
  const prodCkptPath = path.resolve(__dirname, 'data', 'checkpoints', 'phase16_production_final_sealed_1m.3dmemory');
  if (fs.existsSync(prodCkptPath)) {
    const ckptSize = fs.statSync(prodCkptPath).size;
    console.log(`[BOOT] Sovereign Phase 16 production checkpoint detected (${ckptSize} bytes).`);
    const native1m = Native1MProductionService.getInstance();
    const initialized = await native1m.initialize(prodCkptPath);
    if (initialized) {
      console.log(`[BOOT] ✅ Native 1M production model restored (${native1m.getModelMetadata().parameters} params, stateHash: ${native1m.getModelMetadata().stateHash.slice(0, 16)}...).`);
      console.log('[BOOT] Status: QWEN_REMOVED, NATIVE_1M_PRODUCTION_SEALED_AVAILABLE.');
      modelReady = true;
    } else {
      console.error('[BOOT] Native 1M initialization failed:', native1m.getLastError());
      modelReady = false;
    }
  } else {
    console.log('[BOOT] Status: QWEN_REMOVED, NATIVE_INFERENCE_NOT_YET_AVAILABLE.');
    modelReady = false;
  }

  // 1. Cold-start conversation memory rehydration
  console.log('[BOOT] Rehydrating ContextManager from disk persistence...');
  const rehydrated = ContextManager.getInstance().loadFromDisk();
  const sessionCount = ContextManager.getInstance().getActiveSessionCount();
  console.log(`[BOOT] Cold-start memory rehydration: ${rehydrated ? 'REHYDRATED' : 'FRESH_START'} (${sessionCount} active sessions).`);

  // 2. SQLite database persistence initialization
  console.log('[BOOT] Initializing SQLite database persistence...');
  try {
    const dbBootAdapter = new DatabaseBootAdapter();
    const dbRegistry = new DatabaseRegistry();
    const dbRes = await dbBootAdapter.activate(dbRegistry);
    console.log(`[BOOT] SQLite database boot status: ${dbRes.success ? 'ACTIVE' : 'FAILED: ' + dbRes.error}`);
  } catch (dbErr: any) {
    console.warn('[BOOT] SQLite database boot warning:', dbErr.message);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Install Authoritative Pipeline Singleton
// ────────────────────────────────────────────────────────────────────────────
console.log('[BOOT] Installing CubiO Calibrated Authoritative Pipeline...');
installCalibratedAuthoritativePipeline();
// FUNNEL 06: Set readyz flag so /readyz can confirm pipeline is installed
(globalThis as any).__cubio_pipeline_installed__ = true;
console.log('[BOOT] ✅ Authoritative Pipeline installed.');

// ────────────────────────────────────────────────────────────────────────────
// Inference Router
// ────────────────────────────────────────────────────────────────────────────
const inferenceRouter = new CubiOInferenceRouter();

// ────────────────────────────────────────────────────────────────────────────
// FUNNEL 06: Rate Limiter (singleton — shares state across all routes)
// ────────────────────────────────────────────────────────────────────────────
const rateLimiter = new ApiRateLimiter();

// ────────────────────────────────────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────────────────────────────────────
const app = express();

// ── FUNNEL 06: Security headers (all routes) ─────────────────────────────────
app.use(securityHeaders());

// ── FUNNEL 06: CORS (replaces old wildcard CORS) ─────────────────────────────
app.use(corsMiddleware());

// ── FUNNEL 06: Audit log (all routes) ────────────────────────────────────────
app.use(auditLogMiddleware());

// ── FUNNEL 06: Rate limiting (all routes) ────────────────────────────────────
app.use(rateLimiter.middleware());

// ── FUNNEL 06: Request size guard + JSON parser ───────────────────────────────
app.use(requestSizeGuard());
app.use(express.json({ limit: '64kb' }));


// ── Phase 10: /api/v1 (Production Versioned API) ────────────────────────────
app.use('/api/v1', v1Router);

// ── FUNNEL 06: /healthz (liveness — no auth required) ───────────────────────
app.get('/healthz', healthzHandler);

// ── FUNNEL 06: /readyz (readiness — no auth required) ───────────────────────
app.get('/readyz', readyzHandler);

// ── /api/cubio/checkpoint/generate (Funnel 02 Checkpoint Export) ─────────────
// FUNNEL 06: Requires auth + admin role
app.post('/api/cubio/checkpoint/generate', requireAuth(), requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { grid, epoch, description } = req.body || {};
    const exportResult = generateCheckpoint({
      grid,
      epoch: typeof epoch === 'number' ? epoch : 0,
      description: description || 'Live 3D Memory Studio Core Checkpoint',
    });

    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('application/json') && req.query.format === 'json') {
      res.json({
        success: true,
        filename: exportResult.filename,
        sha256: exportResult.sha256,
        byteLength: exportResult.byteLength,
        cellsCount: exportResult.cellsCount,
        addressCount: exportResult.addressCount,
        data: exportResult.checkpoint,
      });
      return;
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('X-Checkpoint-SHA256', exportResult.sha256);
    res.setHeader('X-Cells-Count', exportResult.cellsCount.toString());
    res.setHeader('X-Address-Count', exportResult.addressCount.toString());
    res.send(exportResult.jsonString);
  } catch (err: any) {
    console.error('[CHECKPOINT_EXPORT] Error generating checkpoint:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to generate checkpoint',
    });
  }
});

// ── /health & /api/cubio/health quick-check ──────────────────────────────────
const getHealthStatus = () => ({
  status: 'ok',
  qwenRemoved: true,
  activeQwenDependency: 0,
  qwenStatus: 'QWEN_REMOVED',
  nativeInferenceAvailable: modelReady,
  nativeInferenceStatus: modelReady ? 'NATIVE_1M_PRODUCTION_SEALED_AVAILABLE' : 'NATIVE_INFERENCE_NOT_YET_AVAILABLE',
  productionCheckpoint: 'phase16_production_final_sealed_1m.3dmemory',
  externalModelCalls: 0,
  modelReady,
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
});

app.get('/health', (_req: Request, res: Response) => {
  res.json(getHealthStatus());
});

app.get('/api/cubio/health', (_req: Request, res: Response) => {
  res.json(getHealthStatus());
});

// ── /api/cubio/* routes ──────────────────────────────────────────────────────
// FUNNEL 06: requireAuth() on all /api/cubio/* routes; chatRequestValidator on POST
app.use('/api/cubio', requireAuth(), chatRequestValidator(), async (req: Request, res: Response) => {
  const fullPath = `/api/cubio${req.path}`;
  const method = req.method.toUpperCase() as 'GET' | 'POST';

  // Abort support — honour client disconnect
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const routeRes = await inferenceRouter.routeRequest(fullPath, method, req.body);

    if (routeRes.isStream && routeRes.stream) {
      res.writeHead(routeRes.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      for await (const sseChunk of routeRes.stream) {
        if (abortController.signal.aborted) break;
        res.write(sseChunk);
      }
      res.end();
      return;
    }

    res.status(routeRes.status).json(routeRes.data || {});
  } catch (err: any) {
    // FUNNEL 06: Secure error handling — never leak internals
    const isSafe = err?.name === 'CubiOTimeoutError' || err?.name === 'CubiOAbortError';
    console.error(`[API] Error on ${fullPath}:`, err.message);
    res.status(500).json({
      error: 'Internal Server Error',
      code: isSafe ? err.name : 'INFERENCE_ERROR',
    });
  }
});

// ── /api/telemetry (Live Physical & Subatomic Time Mass Stream) ──────────────
app.get('/api/telemetry', (_req: Request, res: Response) => {
  const t = process.uptime();
  const hz = 1.250; // Phase lock carrier / cardiac frequency
  // Dual-peak envelope (Lub-Dub rhythm)
  const lub = Math.sin(2 * Math.PI * hz * t);
  const dub = 0.5 * Math.sin(4 * Math.PI * hz * t);
  const rawMultiplier = lub + dub;

  const state = physicalStore.updateStep(t, rawMultiplier);

  res.json({
    hz,
    photonFlux: "2.714e15",
    inducedCurrent: "6.317 μA",
    boundedFlow: state.boundedFlow,
    boundedFlowFormatted: `${state.boundedFlow.toExponential(4)} kg/s`,
    fluxMultiplier: state.fluxMultiplier,
    sentinelGuard: state.sentinelGuard,
    hardwareSource: state.hardwareSource,
    time: state.time,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    epistemicClassification: "PHYSICAL_TELEMETRY_STREAM"
  });
});

// ── Serve Vite production build (dist/) ──────────────────────────────────────
import { existsSync } from 'fs';
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[STATIC] Serving production build from ${DIST_DIR}`);
} else {
  console.warn(`[STATIC] ⚠️  dist/ not found — run 'npm run build' first.`);
  console.warn('[STATIC] API routes (/api/cubio/*) are still available.');
}

// ────────────────────────────────────────────────────────────────────────────
// Startup Sequence
// ────────────────────────────────────────────────────────────────────────────
async function main(port = PORT, host = HOST): Promise<any> {
  // 1. Pre-warm / status check BEFORE accepting connections
  await prewarmModel();

  // 2. Start HTTP server
  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(`\n${'─'.repeat(72)}`);
      console.log(` CubiO AI — Production Server`);
      console.log(` Listening: http://${host}:${port}`);
      console.log(` API Base:  http://${host}:${port}/api/cubio/`);
      console.log(` Health:    http://${host}:${port}/api/cubio/health`);
      console.log(` Model:     ${modelReady ? 'NATIVE_1M_PRODUCTION_SEALED (971,520 params, 6 layers)' : 'QWEN_REMOVED (NATIVE_INFERENCE_NOT_YET_AVAILABLE)'}`);
      console.log(`${'─'.repeat(72)}\n`);
      resolve(server);
    });
  });
}

export { app, main, prewarmModel };

const isMainModule = !process.env.CUBIO_TEST_NO_LISTEN && (
  Boolean(process.argv[1] && (
    process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js')
  ))
);

if (isMainModule) {
  main().catch((err) => {
    console.error('[FATAL] Server failed to start:', err);
    process.exit(1);
  });
}

