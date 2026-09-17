/**
 * CubiO AI — FUNNEL 06: API Audit Logger
 *
 * Append-only structured audit log for all API requests.
 * Security Invariant: Never logs Authorization headers, tokens, or full request bodies.
 *
 * Env vars:
 *   CUBIO_AUDIT_LOG_PATH — path to audit log file (default: data/api_audit.log)
 *   CUBIO_AUDIT_ENABLED  — set to 'false' to disable (default: true)
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const AUDIT_LOG_PATH = path.resolve(process.cwd(), process.env.CUBIO_AUDIT_LOG_PATH || 'data/api_audit.log');
const AUDIT_ENABLED = process.env.CUBIO_AUDIT_ENABLED !== 'false';

// Ensure data dir exists
try {
  fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
} catch { /* ignore */ }

let auditStream: fs.WriteStream | null = null;
if (AUDIT_ENABLED) {
  try {
    auditStream = fs.createWriteStream(AUDIT_LOG_PATH, { flags: 'a', encoding: 'utf8' });
    console.log('[AUDIT] Audit log active:', AUDIT_LOG_PATH);
  } catch (e: any) {
    console.warn('[AUDIT] Could not open audit log:', e.message);
  }
}

export interface AuditEntry {
  ts: string;
  method: string;
  path: string;
  ip: string;
  status: number;
  ms: number;
  keyId?: string;
  role?: string;
  contentLength: number;
}

export function writeAuditEntry(entry: AuditEntry): void {
  if (!AUDIT_ENABLED || !auditStream) return;
  try {
    auditStream.write(JSON.stringify(entry) + '\n');
  } catch { /* non-fatal */ }
}

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Express middleware — logs all requests to audit file.
 * Attaches keyId/role from res.locals (set by authMiddleware).
 */
export function auditLogMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startMs = Date.now();
    const ip = getClientIp(req);
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    res.on('finish', () => {
      const entry: AuditEntry = {
        ts: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip,
        status: res.statusCode,
        ms: Date.now() - startMs,
        contentLength,
        keyId: res.locals['keyId'],
        role: res.locals['role'],
      };
      writeAuditEntry(entry);
    });

    next();
  };
}
