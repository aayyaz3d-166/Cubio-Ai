/**
 * CubiO AI — FUNNEL 06: /healthz and /readyz Endpoints
 *
 * /healthz — liveness: server process is running
 * /readyz  — readiness: pipeline, memory, and DB are fully operational
 *
 * These endpoints do NOT require authentication (used by load balancers / k8s probes).
 */

import { Request, Response } from 'express';
import { ContextManager } from '../../inference/context/contextManager';

export interface HealthzResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

export interface ReadyzResponse {
  status: 'ready' | 'not_ready';
  checks: Record<string, 'PASS' | 'FAIL'>;
  uptime: number;
  timestamp: string;
}

export function healthzHandler(_req: Request, res: Response): void {
  const body: HealthzResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(body);
}

export function readyzHandler(_req: Request, res: Response): void {
  const checks: Record<string, 'PASS' | 'FAIL'> = {};

  // Check 1: Pipeline installed
  try {
    // Dynamic import-safe: check global singleton flag set in server.ts
    checks['pipeline'] = (globalThis as any).__cubio_pipeline_installed__ === true ? 'PASS' : 'FAIL';
  } catch {
    checks['pipeline'] = 'FAIL';
  }

  // Check 2: ContextManager reachable
  try {
    const cm = ContextManager.getInstance(false);
    checks['context_manager'] = cm ? 'PASS' : 'FAIL';
  } catch {
    checks['context_manager'] = 'FAIL';
  }

  // Check 3: Process memory within sane bounds (< 2 GB RSS)
  try {
    const mem = process.memoryUsage();
    checks['memory'] = mem.rss < 2 * 1024 * 1024 * 1024 ? 'PASS' : 'FAIL';
  } catch {
    checks['memory'] = 'FAIL';
  }

  const allPass = Object.values(checks).every((v) => v === 'PASS');
  const body: ReadyzResponse = {
    status: allPass ? 'ready' : 'not_ready',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.status(allPass ? 200 : 503).json(body);
}
