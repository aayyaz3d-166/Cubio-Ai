/**
 * CUBiO AI — Phase 10: Production Express API Server Factory
 * src/cubio/api/server.ts
 *
 * Configures the complete Express application stack:
 * Security Headers -> CORS -> Audit Logging -> Concurrency Limit ->
 * Rate Limiting -> Request Size Guard -> JSON Parsing -> Versioned Router ->
 * Error Sanitization.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import {
  securityHeaders,
  corsMiddleware,
  auditLogMiddleware,
  ApiRateLimiter,
  requestSizeGuard,
  apiKeyValidator,
} from './security';
import { v1Router } from './v1/router';
import { LifecycleManager } from '../infra/process/lifecycleManager';
import { MetricsCollector } from '../infra/observability/metricsCollector';

export interface ApiServerOptions {
  readonly maxConcurrent?: number;
  readonly requestTimeoutMs?: number;
  readonly rateLimiter?: ApiRateLimiter;
}

export function createCubiOApiApp(options: ApiServerOptions = {}): Express {
  apiKeyValidator.reload();
  const app = express();
  const maxConcurrent = options.maxConcurrent ?? 32;
  const requestTimeoutMs = options.requestTimeoutMs ?? 30000;
  const rateLimiter = options.rateLimiter ?? new ApiRateLimiter();

  // 0. Graceful Shutdown Rejection Guard & Active Tracking
  const lifecycle = LifecycleManager.getInstance();
  app.use((_req: Request, res: Response, next: NextFunction): void => {
    if (lifecycle.isTerminating()) {
      res.status(503).json({
        error: 'Service Unavailable',
        code: 'SERVER_SHUTTING_DOWN',
        detail: 'Server is undergoing graceful shutdown and cannot accept new connections.',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    lifecycle.incrementActiveRequests();
    let decremented = false;
    const cleanup = () => {
      if (!decremented) {
        decremented = true;
        lifecycle.decrementActiveRequests();
      }
    };
    res.on('finish', cleanup);
    res.on('close', cleanup);
    next();
  });

  // Real-time Metrics Collector
  app.use(MetricsCollector.getInstance().middleware());

  // 1. Security HTTP Headers (nosniff, DENY frame, CSP, remove x-powered-by)
  app.use(securityHeaders());

  // 2. Strict CORS policy
  app.use(corsMiddleware());

  // 3. Structured append-only audit logger
  app.use(auditLogMiddleware());

  // 4. Bounded Concurrency Governor (Fail closed with 503 upon saturation)
  let activeRequests = 0;
  app.use((_req: Request, res: Response, next: NextFunction): void => {
    if (activeRequests >= maxConcurrent) {
      res.status(503).json({
        error: 'Service Unavailable',
        code: 'CONCURRENCY_LIMIT_EXCEEDED',
        detail: `Server reached maximum capacity (${maxConcurrent} concurrent requests).`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    activeRequests++;
    let decremented = false;
    const cleanup = () => {
      if (!decremented) {
        decremented = true;
        activeRequests = Math.max(0, activeRequests - 1);
      }
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);
    next();
  });

  // 5. Request Timeout Guard
  app.use((_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Gateway Timeout',
          code: 'REQUEST_TIMEOUT',
          detail: `Request exceeded time budget of ${requestTimeoutMs}ms.`,
          timestamp: new Date().toISOString(),
        });
      }
    }, requestTimeoutMs);

    if (timer.unref) timer.unref();

    const clear = () => clearTimeout(timer);
    res.on('finish', clear);
    res.on('close', clear);
    next();
  });

  // 6. Sliding-window IP Rate Limiter
  app.use(rateLimiter.middleware());

  // 7. Request Body Size Guard (Pre-parser byte check)
  app.use(requestSizeGuard());

  // 8. JSON Body Parser with 64KB ceiling
  app.use(express.json({ limit: '64kb' }));

  // 9. JSON Syntax Error Trapper (Converts parser crashes to clean 400 Bad Request)
  app.use((err: any, _req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({
        error: 'Bad Request',
        code: 'INVALID_JSON',
        detail: 'Request body contains invalid JSON syntax.',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(err);
  });

  // 10. Mount Versioned API Router
  app.use('/api/v1', v1Router);

  // 11. Legacy or Alias Route Handlers if needed
  app.get('/healthz', (_req, res) => res.redirect(301, '/api/v1/health'));
  app.get('/readyz', (_req, res) => res.redirect(301, '/api/v1/readiness'));

  // 12. Centralized 404 Handler
  app.use((req: Request, res: Response): void => {
    res.status(404).json({
      error: 'Not Found',
      code: 'ROUTE_NOT_FOUND',
      detail: `Path '${req.path}' not recognized on CUBiO AI API.`,
      timestamp: new Date().toISOString(),
    });
  });

  // 13. Centralized Sanitized 500 Handler (Zero stack traces or paths leaked)
  app.use((_err: any, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected internal error occurred. Sanitized error contract enforced.',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
