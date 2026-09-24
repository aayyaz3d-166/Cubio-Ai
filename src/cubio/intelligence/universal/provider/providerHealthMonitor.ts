/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Provider Health Monitor
 *
 * Tracks live provider health heartbeats and latency EMA.
 */

import { UniversalProviderHealth, UniversalProviderProfile } from './types';

export class ProviderHealthMonitor {
  private providers: Map<string, UniversalProviderProfile> = new Map();

  public register(profile: UniversalProviderProfile): void {
    this.providers.set(profile.id, profile);
  }

  public updateHealth(
    providerId: string,
    health: UniversalProviderHealth,
    latencyMs?: number
  ): void {
    const existing = this.providers.get(providerId);
    if (!existing) return;

    const updatedLatency = latencyMs !== undefined
      ? Math.round(existing.latencyMs * 0.7 + latencyMs * 0.3) // EMA
      : existing.latencyMs;

    this.providers.set(providerId, {
      ...existing,
      health,
      latencyMs: updatedLatency,
      lastCheckedAt: Date.now(),
    });
  }

  public get(providerId: string): UniversalProviderProfile | undefined {
    return this.providers.get(providerId);
  }

  public getAll(): readonly UniversalProviderProfile[] {
    return Array.from(this.providers.values());
  }
}
