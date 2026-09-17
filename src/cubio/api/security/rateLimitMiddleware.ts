/**
 * CubiO AI — FUNNEL 06: API Rate Limit Middleware
 *
 * IP-based sliding-window rate limiter for Express routes.
 *
 * Env vars:
 *   CUBIO_RATE_LIMIT_MAX       — requests per window (default: 60)
 *   CUBIO_RATE_LIMIT_WINDOW_MS — window in ms (default: 60000)
 */

import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  windowStart: number;
}

export class ApiRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private buckets: Map<string, Bucket> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.maxRequests = parseInt(process.env.CUBIO_RATE_LIMIT_MAX || '60', 10);
    this.windowMs = parseInt(process.env.CUBIO_RATE_LIMIT_WINDOW_MS || '60000', 10);
    this.cleanupInterval = setInterval(() => this.prune(), 5 * 60_000);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = this.getClientIp(req);
      const now = Date.now();
      let bucket = this.buckets.get(ip);
      if (!bucket || now - bucket.windowStart >= this.windowMs) {
        bucket = { count: 0, windowStart: now };
      }
      bucket.count++;
      this.buckets.set(ip, bucket);

      const remaining = Math.max(0, this.maxRequests - bucket.count);
      const resetAt = bucket.windowStart + this.windowMs;

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

      if (bucket.count > this.maxRequests) {
        res.setHeader('Retry-After', Math.ceil((resetAt - now) / 1000));
        res.status(429).json({
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: Math.ceil((resetAt - now) / 1000),
        });
        return;
      }
      next();
    };
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart >= this.windowMs * 2) this.buckets.delete(key);
    }
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
