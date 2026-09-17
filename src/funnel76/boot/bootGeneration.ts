/**
 * 3D Memory Studio — Funnel 76
 * Boot Generation Tracker
 */

import { BootGenerationToken } from '../types';

export class BootGenerationTracker {
  private currentGeneration = 0;

  public getGeneration(): number {
    return this.currentGeneration;
  }

  public nextToken(): BootGenerationToken {
    this.currentGeneration++;
    return {
      generation: this.currentGeneration,
      createdAt: Date.now(),
      isDisposed: false,
    };
  }

  public isTokenCurrent(token: BootGenerationToken): boolean {
    return token.generation === this.currentGeneration && !token.isDisposed;
  }

  public invalidateToken(token: BootGenerationToken): void {
    token.isDisposed = true;
  }

  public reset(): void {
    this.currentGeneration = 0;
  }
}
