/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Circuit Breaker
 *
 * Implements CLOSED -> OPEN -> HALF_OPEN state transitions to protect providers from cascading failures.
 */

import { UniversalCircuitBreakerState, UniversalCircuitBreakerStatus } from './types';

export class CircuitBreaker {
  private state: UniversalCircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastStateChange = Date.now();

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number = 3,
    private readonly resetTimeoutMs: number = 1000,
    private readonly halfOpenSuccessThreshold: number = 2
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.checkStateTransition();

    if (this.state === 'OPEN') {
      throw new Error(`CIRCUIT_TRIPPED: Circuit breaker "${this.name}" is OPEN.`);
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (err: unknown) {
      this.recordFailure();
      throw err;
    }
  }

  private checkStateTransition() {
    if (this.state === 'OPEN' && Date.now() - this.lastStateChange >= this.resetTimeoutMs) {
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      this.lastStateChange = Date.now();
    }
  }

  private recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastStateChange = Date.now();
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
    }
  }

  public getStatus(): UniversalCircuitBreakerStatus {
    this.checkStateTransition();
    return Object.freeze({
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastStateChange: this.lastStateChange,
    });
  }

  public trip(): void {
    this.state = 'OPEN';
    this.lastStateChange = Date.now();
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
  }
}
