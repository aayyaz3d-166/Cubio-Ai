/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F1: Engine Registry & Lifecycle Manager
 *
 * Manages dynamic registration, capability negotiation, priority resolution,
 * and health monitoring for all present and future intelligence engines.
 */

import {
  IIntelligenceEngine,
  EngineCapability,
  EngineHealthReport,
} from './types';

export class CubiOEngineRegistry {
  private engines: Map<string, IIntelligenceEngine> = new Map();
  private coreInstance?: any;

  constructor(core?: any) {
    this.coreInstance = core;
  }

  public setCoreInstance(core: any): void {
    this.coreInstance = core;
  }

  /**
   * Registers an intelligence engine synchronously without awaiting initialize.
   */
  public registerEngineSync(engine: IIntelligenceEngine): void {
    if (!engine || !engine.engineId) {
      throw new Error('Engine Registry Error: Engine must provide a valid engineId.');
    }

    if (this.engines.has(engine.engineId)) {
      throw new Error(`Engine Registry Error: Engine '${engine.engineId}' is already registered.`);
    }

    try {
      engine.initialize(this.coreInstance);
    } catch {}
    this.engines.set(engine.engineId, engine);
  }

  /**
   * Registers a new intelligence engine into the core foundation.
   */
  public async registerEngine(engine: IIntelligenceEngine): Promise<void> {
    if (!engine || !engine.engineId) {
      throw new Error('Engine Registry Error: Engine must provide a valid engineId.');
    }

    if (this.engines.has(engine.engineId)) {
      throw new Error(`Engine Registry Error: Engine '${engine.engineId}' is already registered.`);
    }

    await engine.initialize(this.coreInstance);
    this.engines.set(engine.engineId, engine);
  }

  /**
   * Unregisters and disposes an existing intelligence engine.
   */
  public async unregisterEngine(engineId: string): Promise<boolean> {
    const engine = this.engines.get(engineId);
    if (!engine) {
      return false;
    }

    try {
      await engine.dispose();
    } catch {
      // Best effort disposal
    }

    return this.engines.delete(engineId);
  }

  /**
   * Retrieves an engine by its unique ID.
   */
  public getEngine(engineId: string): IIntelligenceEngine | undefined {
    return this.engines.get(engineId);
  }

  /**
   * Returns all registered engines.
   */
  public listEngines(): readonly IIntelligenceEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Resolves engines matching required capabilities, ordered by priority (PRIMARY > SECONDARY > FALLBACK).
   */
  public findEnginesForCapabilities(
    capabilities: readonly EngineCapability[]
  ): readonly IIntelligenceEngine[] {
    if (!capabilities || capabilities.length === 0) {
      return this.listEngines();
    }

    const priorityScore = (priority: string) => {
      switch (priority) {
        case 'PRIMARY':
          return 3;
        case 'SECONDARY':
          return 2;
        case 'FALLBACK':
          return 1;
        default:
          return 0;
      }
    };

    // First try strict match (engines matching all requested capabilities)
    let matching = Array.from(this.engines.values()).filter((engine) =>
      capabilities.every((cap) => engine.capabilities.includes(cap))
    );

    // If no exact match, find engines that match any requested capability
    if (matching.length === 0) {
      matching = Array.from(this.engines.values()).filter((engine) =>
        capabilities.some((cap) => engine.capabilities.includes(cap))
      );
    }

    return matching.sort((a, b) => {
      const matchCountB = capabilities.filter((c) => b.capabilities.includes(c)).length;
      const matchCountA = capabilities.filter((c) => a.capabilities.includes(c)).length;
      if (matchCountB !== matchCountA) {
        return matchCountB - matchCountA;
      }
      return priorityScore(b.priority) - priorityScore(a.priority);
    });
  }

  /**
   * Collects health reports across all registered engines.
   */
  public async getHealthSummary(): Promise<Record<string, EngineHealthReport>> {
    const summary: Record<string, EngineHealthReport> = {};
    for (const [id, engine] of this.engines.entries()) {
      try {
        summary[id] = await engine.getHealth();
      } catch (err: any) {
        summary[id] = {
          status: 'UNHEALTHY',
          uptimeMs: 0,
          totalExecutions: 0,
          failedExecutions: 1,
          avgLatencyMs: 0,
          lastError: err?.message || 'Health probe failed',
        };
      }
    }
    return summary;
  }
}
