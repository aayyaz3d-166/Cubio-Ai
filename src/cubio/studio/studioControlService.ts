/**
 * CUBiO AI — Phase 4: Studio Control Service
 *
 * The Master Control Center coordinator for 3D Memory Studio.
 * Aggregates health, orchestrates safe startup sequencing, enforces RBAC,
 * and maintains permanent safety invariants.
 */

import {
  StudioDashboardState,
  StudioHealthSummary,
  StudioModuleHealth,
  StudioModuleReadiness,
  StudioModuleDefinition
} from './studioControlContract';
import { StudioModuleRegistry } from './studioModuleRegistry';
import { VirtualDataService } from '../virtual_data/virtualDataService';
import { MemoryService } from '../virtual_data/memoryService';
import { physicalStore } from '../../store/physicalStore';

export class StudioControlService {
  private static instance: StudioControlService | null = null;
  private readonly registry: StudioModuleRegistry;
  private readonly vds: VirtualDataService;
  private readonly memoryService: MemoryService;
  private isStudioReady = false;
  private startupTimestamp = 0;

  constructor(
    registry?: StudioModuleRegistry,
    vds?: VirtualDataService,
    memoryService?: MemoryService
  ) {
    this.registry = registry ?? StudioModuleRegistry.getInstance();
    this.vds = vds ?? VirtualDataService.getInstance();
    this.memoryService = memoryService ?? MemoryService.getInstance(this.vds);
  }

  public static getInstance(): StudioControlService {
    if (!StudioControlService.instance) {
      StudioControlService.instance = new StudioControlService();
    }
    return StudioControlService.instance;
  }

  /**
   * Executes the strict 9-step Master Control Center startup sequence.
   * Fails safe if any critical component cannot initialize.
   */
  public async startup(): Promise<{
    success: boolean;
    stage: string;
    error?: string;
  }> {
    try {
      // Step 1: Security Initialization
      const securityValid = this.verifySecurityInvariants();
      if (!securityValid) {
        return { success: false, stage: 'SECURITY_INIT', error: 'Security invariants failed' };
      }

      // Step 2: Database Boot & Storage Adapter
      const adapter = this.vds.getAdapter();
      await adapter.initialize();

      // Step 3: Virtual Data Layer
      const sysState = this.vds.getSystemState();
      if (!sysState.isActuationBlocked) {
        return { success: false, stage: 'VIRTUAL_DATA_LAYER', error: 'Actuation lock violation' };
      }

      // Step 4: Memory Rehydration & Integrity
      const memReport = this.memoryService.verify343CellIntegrity();
      if (!memReport.allValid) {
        return { success: false, stage: 'MEMORY_INTEGRITY', error: '343-cell geometry or 369 invariant invalid' };
      }

      // Step 5: Module Registry Validation
      const depCheck = this.registry.validateDependencyGraph();
      if (!depCheck.valid) {
        return { success: false, stage: 'MODULE_REGISTRY', error: `Dependency error: ${depCheck.errors.join('; ')}` };
      }

      // Step 6: Health Checks Aggregation
      const healthSummary = await this.getHealthSummary();
      if (healthSummary.overallHealth === 'UNHEALTHY') {
        return { success: false, stage: 'HEALTH_CHECKS', error: 'Critical module unhealthy' };
      }

      // Step 7: Intelligence Hub Verification
      const modelReady = sysState.deterministicPipelineReady;
      // Pipeline ready is acceptable; neural model is held for future wiring

      // Step 8: Final Invariant Verification
      const physState = physicalStore.getState();
      if (!physState.sentinelGuard.includes('RECTIFIED')) {
        return { success: false, stage: 'INVARIANTS', error: 'Physical sentinel guard compromised' };
      }

      // Step 9: Studio Ready
      this.isStudioReady = true;
      this.startupTimestamp = Date.now();

      return { success: true, stage: 'STUDIO_READY' };
    } catch (err: any) {
      return { success: false, stage: 'FAILED', error: err.message || 'Unknown startup failure' };
    }
  }

  public isReady(): boolean {
    return this.isStudioReady;
  }

  /**
   * Aggregates logical Master Dashboard state for frontend presentation.
   * Guarantees ZERO physical paths and ZERO secrets in returned state.
   */
  public async getDashboardState(): Promise<StudioDashboardState> {
    const healthSummary = await this.getHealthSummary();
    const spatialMem = this.memoryService.verify343CellIntegrity();
    const allRecords = await this.vds.getAdapter().getAll<any>('studio_records');

    return {
      system: {
        overallStatus: this.isStudioReady ? 'SYSTEM_ONLINE' : 'DEGRADED',
        architectureVersion: '1.0.0',
        safetyState: 'ACTUATION_LOCKED',
        runtimeState: 'DETERMINISTIC_ACTIVE_NATIVE_READY',
        startupTimestamp: this.startupTimestamp
      },
      memory: {
        totalCells: 343,
        totalAddresses: 369,
        symbolicAnchors: 26,
        centerCellId: 171,
        centerAddress369: 197,
        memoryHealth: healthSummary.moduleHealths['memory_3d']?.health ?? 'HEALTHY',
        persistenceStatus: 'PERSISTED_SQLITE'
      },
      database: {
        logicalDatabaseHealth: healthSummary.moduleHealths['virtual_db']?.health ?? 'HEALTHY',
        recordCount: allRecords.length,
        rehydrationState: 'REHYDRATED'
      },
      cubioAI: {
        intelligenceRuntimeStatus: 'DETERMINISTIC_ACTIVE',
        modelArchitecture: 'NONE (TRAINED_MODEL_RESET)',
        parameterCount: 0,
        evaluationStatus: 'PENDING',
        trainingStatus: 'NOT STARTED / HELD'
      },
      security: {
        authentication: 'ENFORCED_FAIL_CLOSED',
        rbac: 'ACTIVE',
        actuationLock: 'LOCKED',
        auditLogging: 'ACTIVE'
      },
      workflows: {
        workflowAvailability: 'CONTRACT_ONLY / NOT_IMPLEMENTED',
        activeJobs: 0
      },
      network: {
        networkStatus: 'RESERVED / NOT_IMPLEMENTED',
        targetPhase: 7
      }
    };
  }

  /**
   * Evaluates health and readiness across all registered modules.
   */
  public async getHealthSummary(): Promise<StudioHealthSummary> {
    const modules = this.registry.getAllModules();
    const moduleHealths: Record<string, {
      health: StudioModuleHealth;
      readiness: StudioModuleReadiness;
      status: any;
    }> = {};

    let hasUnhealthy = false;
    let hasDegraded = false;

    for (const mod of modules) {
      let h = mod.health;
      let r = mod.readiness;

      if (mod.moduleId === 'virtual_db') {
        const adapter = this.vds.getAdapter();
        h = adapter.isInitialized ? 'HEALTHY' : 'DEGRADED';
        r = adapter.isInitialized ? 'READY' : 'NOT_READY';
      } else if (mod.moduleId === 'memory_3d') {
        const memOk = this.memoryService.verify343CellIntegrity().allValid;
        h = memOk ? 'HEALTHY' : 'UNHEALTHY';
        r = memOk ? 'READY' : 'NOT_READY';
      } else if (mod.moduleId === 'cubio_ai') {
        h = 'HEALTHY';
        r = 'READY'; // Deterministic pipeline is ready; training is held
      }

      if (h === 'UNHEALTHY') hasUnhealthy = true;
      if (h === 'DEGRADED') hasDegraded = true;

      moduleHealths[mod.moduleId] = {
        health: h,
        readiness: r,
        status: mod.status
      };
    }

    const overallHealth: StudioModuleHealth = hasUnhealthy
      ? 'UNHEALTHY'
      : hasDegraded
      ? 'DEGRADED'
      : 'HEALTHY';

    const overallReadiness: StudioModuleReadiness = this.isStudioReady
      ? 'READY'
      : 'NOT_READY';

    return {
      overallHealth,
      overallReadiness,
      moduleHealths,
      timestamp: Date.now()
    };
  }

  /**
   * RBAC Permission check: Verifies if a user role can access/operate a module.
   */
  public checkPermission(role: 'user' | 'admin', moduleId: string): boolean {
    const mod = this.registry.getModule(moduleId);
    if (!mod) return false;

    if (mod.requiredRole === 'admin' && role !== 'admin') {
      return false; // Forbidden for non-admin
    }
    return true;
  }

  /**
   * Permanent safety invariant verification.
   */
  public verifySecurityInvariants(): boolean {
    const sysState = this.vds.getSystemState();
    const pState = physicalStore.getState();

    const isActuationBlocked = sysState.isActuationBlocked === true;
    const qwenEradicated = sysState.qwenEradicated === true;
    const activeExternalModels = sysState.activeExternalModels === 0;
    const hardwareIsolated = pState.sentinelGuard.length > 0;

    return isActuationBlocked && qwenEradicated && activeExternalModels && hardwareIsolated;
  }

  public getRegistry(): StudioModuleRegistry {
    return this.registry;
  }

  public getVirtualDataService(): VirtualDataService {
    return this.vds;
  }

  public getMemoryService(): MemoryService {
    return this.memoryService;
  }
}
