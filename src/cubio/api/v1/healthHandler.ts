/**
 * CUBiO AI — Phase 10: API v1 Health & Readiness Handlers
 * src/cubio/api/v1/healthHandler.ts
 *
 * GET /api/v1/health     - Fast liveness probe (no auth required)
 * GET /api/v1/readiness  - Deep dependency readiness probe (no auth required)
 */

import { Request, Response } from 'express';
import { CubiOChatEngine } from '../../intelligence/chat/chatEngine';
import { CubiOAICoreEngine } from '../../intelligence/core/coreEngine';
import { MemoryService } from '../../virtual_data/memoryService';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../../intelligence/chat/chatEngineContract';

export interface HealthResponse {
  readonly status: 'ok';
  readonly uptime: number;
  readonly timestamp: string;
}

export interface ReadinessResponse {
  readonly status: 'ready' | 'not_ready';
  readonly checks: Readonly<Record<string, 'PASS' | 'FAIL'>>;
  readonly uptime: number;
  readonly timestamp: string;
}

/**
 * Fast liveness probe.
 * Checks server process is responsive.
 */
export function healthHandler(_req: Request, res: Response): void {
  const body: HealthResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(body);
}

/**
 * Deep readiness probe.
 * Validates dependencies: Virtual Data, Chat Engine, Core Engine, Memory,
 * Permanent Actuation Lock, and Offline Isolation.
 */
export function readinessHandler(_req: Request, res: Response): void {
  const checks: Record<string, 'PASS' | 'FAIL'> = {};

  // 1. Virtual Data / MemoryService
  try {
    const memoryService = MemoryService.getInstance();
    checks['virtual_data'] = memoryService !== null ? 'PASS' : 'FAIL';
  } catch {
    checks['virtual_data'] = 'FAIL';
  }

  // 2. Chat & Context Engine
  try {
    const chatEngine = CubiOChatEngine.getInstance();
    checks['chat_engine'] = chatEngine !== null ? 'PASS' : 'FAIL';
  } catch {
    checks['chat_engine'] = 'FAIL';
  }

  // 3. Core Engine
  try {
    const coreEngine = CubiOAICoreEngine.getInstance();
    checks['core_engine'] = coreEngine !== null ? 'PASS' : 'FAIL';
  } catch {
    checks['core_engine'] = 'FAIL';
  }

  // 4. Memory bounds (< 2 GB RSS)
  try {
    const mem = process.memoryUsage();
    checks['memory_rss'] = mem.rss < 2 * 1024 * 1024 * 1024 ? 'PASS' : 'FAIL';
  } catch {
    checks['memory_rss'] = 'FAIL';
  }

  // 5. Permanent Actuation Lock
  checks['actuation_locked'] = IS_ACTUATION_BLOCKED === true ? 'PASS' : 'FAIL';

  // 6. 100% Offline Isolation
  checks['offline_isolated'] = OFFLINE_ISOLATED === true ? 'PASS' : 'FAIL';

  const allPass = Object.values(checks).every((v) => v === 'PASS');
  const body: ReadinessResponse = {
    status: allPass ? 'ready' : 'not_ready',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  res.status(allPass ? 200 : 503).json(body);
}
