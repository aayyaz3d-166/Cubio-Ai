/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Rate Limiter
 *
 * Multi-dimensional rate limiter protecting against brute-force and credential-stuffing attacks.
 */

import { RateLimitResult, RateLimitDimension } from './types';
import { IAuthRateLimitRepository } from './repositories/types';
import { MemoryAuthRateLimitRepository } from './repositories/memoryRepositories';

export class CubiOAuthRateLimiter {
  private repository: IAuthRateLimitRepository;
  private readonly defaultLimit: number;
  private readonly defaultWindowMs: number;

  constructor(
    repository?: IAuthRateLimitRepository,
    options: { defaultLimit?: number; defaultWindowMs?: number } = {}
  ) {
    this.repository = repository || new MemoryAuthRateLimitRepository();
    this.defaultLimit = options.defaultLimit || 5; // 5 attempts
    this.defaultWindowMs = options.defaultWindowMs || 60_000; // per 60 seconds
  }

  /**
   * Checks if an authentication attempt is within rate limits across specified dimensions.
   */
  public async evaluateLimit(
    dimension: RateLimitDimension,
    identifier: string,
    limit = this.defaultLimit,
    windowMs = this.defaultWindowMs
  ): Promise<RateLimitResult> {
    const key = `RATELIMIT:${dimension}:${identifier.trim().toLowerCase()}`;
    return this.repository.checkAndConsume(key, limit, windowMs);
  }

  /**
   * Resets rate-limit bucket for a specific dimension & identifier (e.g. after successful login).
   */
  public async resetLimit(dimension: RateLimitDimension, identifier: string): Promise<void> {
    const key = `RATELIMIT:${dimension}:${identifier.trim().toLowerCase()}`;
    await this.repository.reset(key);
  }
}
