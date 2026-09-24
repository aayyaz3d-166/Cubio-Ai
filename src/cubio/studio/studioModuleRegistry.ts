/**
 * CUBiO AI — Phase 4: Studio Module Registry
 *
 * The single authoritative registry of all logical modules coordinated by
 * 3D Memory Studio as the Master Control Center.
 */

import { StudioModuleDefinition } from './studioControlContract';

export class StudioModuleRegistry {
  private static instance: StudioModuleRegistry | null = null;
  private readonly modules: Map<string, StudioModuleDefinition> = new Map();

  constructor() {
    this.registerDefaultModules();
  }

  public static getInstance(): StudioModuleRegistry {
    if (!StudioModuleRegistry.instance) {
      StudioModuleRegistry.instance = new StudioModuleRegistry();
    }
    return StudioModuleRegistry.instance;
  }

  private registerDefaultModules(): void {
    const now = Date.now();

    // 1. Dashboard Module
    this.modules.set('dashboard', {
      moduleId: 'dashboard',
      name: 'Master Control Dashboard',
      type: 'CORE',
      version: '1.0.0',
      requiredRole: 'user',
      dependencies: ['virtual_db', 'memory_3d', 'cubio_ai'],
      sourceOfTruth: 'StudioControlService aggregation',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 2. Virtual Database Module
    this.modules.set('virtual_db', {
      moduleId: 'virtual_db',
      name: 'Virtual Data Layer',
      type: 'DATA',
      version: '1.0.0',
      requiredRole: 'user',
      dependencies: [],
      sourceOfTruth: 'SQLiteDataStore (Funnel 71) via SQLiteStorageAdapter',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 3. 3D Memory Module
    this.modules.set('memory_3d', {
      moduleId: 'memory_3d',
      name: '7x7x7 Spatial Memory & 369 Addressing',
      type: 'CORE',
      version: '1.0.0',
      requiredRole: 'user',
      dependencies: ['virtual_db'],
      sourceOfTruth: 'EulerMemoryEngine (343 cells) + 369 Addressing Core',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 4. CubiO AI Module
    this.modules.set('cubio_ai', {
      moduleId: 'cubio_ai',
      name: 'CubiO Intelligence Hub',
      type: 'INTELLIGENCE',
      version: '1.0.0',
      requiredRole: 'user',
      dependencies: ['virtual_db', 'memory_3d'],
      sourceOfTruth: 'CalibratedAuthoritativePipeline (Deterministic active)',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 5. CubiO Network Module (RESERVED / NOT IMPLEMENTED - Phase 7)
    this.modules.set('cubio_network', {
      moduleId: 'cubio_network',
      name: 'CubiO Network Infrastructure',
      type: 'INFRASTRUCTURE',
      version: '0.0.0-reserved',
      requiredRole: 'admin',
      dependencies: [],
      sourceOfTruth: 'RESERVED_PHASE_7',
      status: 'RESERVED',
      health: 'NOT_IMPLEMENTED',
      readiness: 'NOT_IMPLEMENTED',
      lastUpdated: now,
      errorState: 'CubiO Network is strictly reserved for Phase 7'
    });

    // 6. Workflows Module (CONTRACT ONLY / NOT IMPLEMENTED)
    this.modules.set('workflows', {
      moduleId: 'workflows',
      name: 'Job & Training Workflows',
      type: 'OPERATIONS',
      version: '1.0.0-contract',
      requiredRole: 'admin',
      dependencies: ['virtual_db'],
      sourceOfTruth: 'CONTRACT_ONLY',
      status: 'DISABLED',
      health: 'NOT_IMPLEMENTED',
      readiness: 'NOT_IMPLEMENTED',
      lastUpdated: now,
      errorState: 'Workflow engine contract defined; engine not implemented'
    });

    // 7. Monitoring Module
    this.modules.set('monitoring', {
      moduleId: 'monitoring',
      name: 'System Telemetry & Metrics',
      type: 'OPERATIONS',
      version: '1.0.0',
      requiredRole: 'user',
      dependencies: [],
      sourceOfTruth: 'MemoryStudioPhysicalStore (physicalStore.ts)',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 8. Logs Module
    this.modules.set('logs', {
      moduleId: 'logs',
      name: 'Security & API Audit Logs',
      type: 'OPERATIONS',
      version: '1.0.0',
      requiredRole: 'admin',
      dependencies: [],
      sourceOfTruth: 'Append-only audit sink (data/api_audit.log)',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });

    // 9. Admin Module
    this.modules.set('admin', {
      moduleId: 'admin',
      name: 'Administration & RBAC Control',
      type: 'ADMIN',
      version: '1.0.0',
      requiredRole: 'admin',
      dependencies: ['virtual_db', 'logs'],
      sourceOfTruth: 'ApiKeyValidator & authMiddleware RBAC',
      status: 'READY',
      health: 'HEALTHY',
      readiness: 'READY',
      lastUpdated: now
    });
  }

  public getModule(moduleId: string): StudioModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }

  public getAllModules(): readonly StudioModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  public updateModuleStatus(moduleId: string, updates: Partial<StudioModuleDefinition>): void {
    const existing = this.modules.get(moduleId);
    if (!existing) {
      throw new Error(`MODULE_NOT_FOUND: Cannot update non-existent module ${moduleId}`);
    }
    this.modules.set(moduleId, {
      ...existing,
      ...updates,
      lastUpdated: Date.now()
    });
  }

  public validateDependencyGraph(): { valid: boolean; circular: boolean; errors: string[] } {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const errors: string[] = [];
    let hasCycle = false;

    const isCyclic = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const mod = this.modules.get(node);
      if (mod) {
        for (const dep of mod.dependencies) {
          if (!this.modules.has(dep)) {
            errors.push(`Unresolved dependency: Module ${node} depends on non-existent ${dep}`);
          } else if (!visited.has(dep)) {
            if (isCyclic(dep)) return true;
          } else if (recStack.has(dep)) {
            errors.push(`Circular dependency detected: ${node} -> ${dep}`);
            return true;
          }
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const modId of this.modules.keys()) {
      if (!visited.has(modId)) {
        if (isCyclic(modId)) {
          hasCycle = true;
        }
      }
    }

    return {
      valid: errors.length === 0 && !hasCycle,
      circular: hasCycle,
      errors
    };
  }
}
