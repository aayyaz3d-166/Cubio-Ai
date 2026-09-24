/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Provider & Engine Fallback Manager
 *
 * Implements multi-tier failover chains across primary, secondary, and local sovereign providers.
 */

import { ProviderFallbackChain } from './types';

export class FallbackManager {
  private fallbackChains: Map<string, ProviderFallbackChain> = new Map();

  constructor() {
    this.registerChain('LLM_REASONING', {
      primaryProvider: 'GEMINI_PRO',
      fallbackProviders: ['GEMINI_FLASH', 'CLAUDE_SONNET', 'LOCAL_SOVEREIGN_REASONER'],
      activeProvider: 'GEMINI_PRO',
      failoverCount: 0,
    });

    this.registerChain('SPATIAL_GEOMETRY', {
      primaryProvider: 'GPU_ACCELERATED_NEURAL_SPATIAL',
      fallbackProviders: ['WASM_SPATIAL_ENGINE', 'PURE_TS_HEURISTIC_SPATIAL'],
      activeProvider: 'GPU_ACCELERATED_NEURAL_SPATIAL',
      failoverCount: 0,
    });
  }

  public registerChain(capability: string, chain: ProviderFallbackChain): void {
    this.fallbackChains.set(capability, chain);
  }

  public async executeWithFallback<T>(
    capability: string,
    executePrimary: (provider: string) => Promise<T>,
    executeFallback?: (provider: string) => Promise<T>
  ): Promise<{ result: T; providerUsed: string; failoverCount: number }> {
    const chain = this.fallbackChains.get(capability) || {
      primaryProvider: 'PRIMARY_DEFAULT',
      fallbackProviders: ['SECONDARY_DEFAULT', 'SOVEREIGN_FALLBACK'],
      activeProvider: 'PRIMARY_DEFAULT',
      failoverCount: 0,
    };

    try {
      const result = await executePrimary(chain.primaryProvider);
      return { result, providerUsed: chain.primaryProvider, failoverCount: chain.failoverCount };
    } catch {
      // Failover to secondary/fallback
      for (const fallback of chain.fallbackProviders) {
        try {
          const result = executeFallback
            ? await executeFallback(fallback)
            : await executePrimary(fallback);
          const updated: ProviderFallbackChain = {
            ...chain,
            activeProvider: fallback,
            failoverCount: chain.failoverCount + 1,
          };
          this.fallbackChains.set(capability, updated);
          return { result, providerUsed: fallback, failoverCount: updated.failoverCount };
        } catch {
          continue;
        }
      }
      throw new Error(`All providers in fallback chain for "${capability}" failed.`);
    }
  }

  public getChain(capability: string): ProviderFallbackChain | undefined {
    return this.fallbackChains.get(capability);
  }
}
