/**
 * CubiO AI — FUNNEL 06: Security Headers Middleware
 *
 * Applies production-grade security HTTP response headers to all routes.
 * CORS is tightened to configured origins.
 *
 * Env vars:
 *   CUBIO_CORS_ORIGINS — comma-separated allowed origins (default: * in dev, strict in prod)
 *   NODE_ENV           — 'production' enables strict CORS
 */

import { Request, Response, NextFunction } from 'express';

const isProd = process.env.NODE_ENV === 'production';
const rawOrigins = process.env.CUBIO_CORS_ORIGINS || '';
const allowedOrigins: string[] = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent embedding in iframes (clickjacking)
    res.setHeader('X-Frame-Options', 'DENY');
    // Enable XSS filter in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Strict Transport Security (prod only)
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    // Content Security Policy — production SPA baseline
    // 'self' permits same-origin Vite-compiled JS/CSS/assets.
    // 'unsafe-inline' on style-src: React inline style={{ }} attributes
    //   and Tailwind CSS inject <style> tags at runtime.
    // blob: on default-src: file-export features use URL.createObjectURL().
    // No unsafe-eval, no external origins.
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    // Remove server fingerprinting
    res.removeHeader('X-Powered-By');
    next();
  };
}

/**
 * CORS middleware — replaces the wildcard '*' CORS from server.ts on protected routes.
 * Allows configured origins; rejects all others in production.
 */
export function corsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers['origin'] as string | undefined;

    let allowOrigin = '';
    if (!isProd || allowedOrigins.length === 0) {
      // Dev: allow all
      allowOrigin = origin || '*';
    } else {
      // Prod: only configured origins
      if (origin && allowedOrigins.includes(origin)) {
        allowOrigin = origin;
      }
    }

    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    // If prod and no allowed origin matched, reject
    if (isProd && allowedOrigins.length > 0 && !allowOrigin && origin) {
      res.status(403).json({ error: 'Forbidden', code: 'CORS_ORIGIN_REJECTED' });
      return;
    }

    next();
  };
}
