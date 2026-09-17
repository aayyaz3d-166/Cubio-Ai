/**
 * 3D Memory Studio — Funnel 74
 * Landing Lifecycle Generation Tracker
 *
 * Prevents stale asynchronous operations or closures from mutating disposed engines.
 */

import { LifecycleGenerationToken } from '../types';

export class LandingLifecycleGenerationTracker {
  private currentGeneration = 0;

  public getGeneration(): number {
    return this.currentGeneration;
  }

  public nextToken(): LifecycleGenerationToken {
    this.currentGeneration++;
    return {
      generation: this.currentGeneration,
      createdAt: Date.now(),
      isDisposed: false,
    };
  }

  public isTokenCurrent(token: LifecycleGenerationToken): boolean {
    return token.generation === this.currentGeneration && !token.isDisposed;
  }

  public invalidateToken(token: LifecycleGenerationToken): void {
    token.isDisposed = true;
  }

  public reset(): void {
    this.currentGeneration = 0;
  }
}
