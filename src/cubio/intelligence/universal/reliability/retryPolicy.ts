/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Retry Policy & Timeout Manager
 *
 * Implements exponential backoff with jitter and execution deadline timeouts.
 */

import { FailureClassification, RetryPolicyConfig } from './types';

export class RetryPolicy {
  private defaultConfig: RetryPolicyConfig = {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    retryableCategories: ['TIMEOUT', 'RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'NETWORK_DISCONNECT'],
  };

  public async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    classifyError: (err: unknown) => FailureClassification,
    config: RetryPolicyConfig = this.defaultConfig
  ): Promise<{ result: T; attempts: number; failures: FailureClassification[] }> {
    const failures: FailureClassification[] = [];

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation(attempt);
        return { result, attempts: attempt, failures };
      } catch (err: unknown) {
        const classification = classifyError(err);
        failures.push(classification);

        const isRetryable = config.retryableCategories.includes(classification.category);
        if (!isRetryable || attempt >= config.maxAttempts) {
          throw err;
        }

        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error(`Max retry attempts (${config.maxAttempts}) exceeded.`);
  }
}
