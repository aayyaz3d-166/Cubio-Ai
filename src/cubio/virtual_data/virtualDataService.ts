/**
 * CUBiO AI — Phase 2: Virtual Data Service
 *
 * The logical Source of Truth access layer for 3D Memory Studio.
 * Enforces contracts and delegates to the configured StorageAdapter.
 */

import {
  IStorageAdapter,
  LogicalOrganization,
  LogicalProject,
  LogicalDataset,
  LogicalTrainingRun,
  LogicalModel,
  LogicalCheckpoint,
  LogicalEvent,
  LogicalSpatialMemoryState,
  LogicalConversationalMemory,
  LogicalSystemState
} from './contracts';
import { SQLiteStorageAdapter } from './storageAdapter';
import { ContextManager } from '../inference/context/contextManager';

export class VirtualDataService {
  private static instance: VirtualDataService | null = null;
  private readonly adapter: IStorageAdapter;

  constructor(adapter?: IStorageAdapter) {
    this.adapter = adapter ?? new SQLiteStorageAdapter();
  }

  public static getInstance(adapter?: IStorageAdapter): VirtualDataService {
    if (!VirtualDataService.instance) {
      VirtualDataService.instance = new VirtualDataService(adapter);
    }
    return VirtualDataService.instance;
  }

  public getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  // ── Organizations Domain ───────────────────────────────────────────────────
  public async getOrganization(id: string): Promise<LogicalOrganization | undefined> {
    return this.adapter.get<LogicalOrganization>('organizations', id);
  }

  public async saveOrganization(org: LogicalOrganization): Promise<LogicalOrganization> {
    return this.adapter.save<LogicalOrganization>('organizations', { id: org.id, ...org });
  }

  // ── Projects Domain ────────────────────────────────────────────────────────
  public async getProject(id: string): Promise<LogicalProject | undefined> {
    return this.adapter.get<LogicalProject>('projects', id);
  }

  public async saveProject(proj: LogicalProject): Promise<LogicalProject> {
    return this.adapter.save<LogicalProject>('projects', { id: proj.id, ...proj });
  }

  // ── Datasets Domain ────────────────────────────────────────────────────────
  public async getDataset(id: string): Promise<LogicalDataset | undefined> {
    return this.adapter.get<LogicalDataset>('datasets', id);
  }

  public async registerDataset(dataset: LogicalDataset): Promise<LogicalDataset> {
    return this.adapter.save<LogicalDataset>('datasets', { id: dataset.id, ...dataset });
  }

  // ── Training Runs Domain ───────────────────────────────────────────────────
  public async getTrainingRun(runId: string): Promise<LogicalTrainingRun | undefined> {
    return this.adapter.get<LogicalTrainingRun>('training_runs', runId);
  }

  public async registerTrainingRun(run: LogicalTrainingRun): Promise<LogicalTrainingRun> {
    return this.adapter.save<LogicalTrainingRun & { id: string }>('training_runs', { id: run.runId, ...run });
  }

  // ── Models Domain ──────────────────────────────────────────────────────────
  public async getModel(modelId: string): Promise<LogicalModel | undefined> {
    return this.adapter.get<LogicalModel>('models', modelId);
  }

  public async registerModel(model: LogicalModel): Promise<LogicalModel> {
    return this.adapter.save<LogicalModel & { id: string }>('models', { id: model.modelId, ...model });
  }

  // ── Checkpoints Domain ─────────────────────────────────────────────────────
  public async getCheckpoint(checkpointId: string): Promise<LogicalCheckpoint | undefined> {
    return this.adapter.get<LogicalCheckpoint>('checkpoints', checkpointId);
  }

  public async registerCheckpoint(checkpoint: LogicalCheckpoint): Promise<LogicalCheckpoint> {
    return this.adapter.save<LogicalCheckpoint & { id: string }>('checkpoints', { id: checkpoint.checkpointId, ...checkpoint });
  }

  // ── Events Domain (Unified Audit Logging) ──────────────────────────────────
  public async recordEvent(event: LogicalEvent): Promise<LogicalEvent> {
    return this.adapter.save<LogicalEvent & { id: string }>('events', { id: event.eventId, ...event });
  }

  // ── Memory Domain: Spatial ─────────────────────────────────────────────────
  public getSpatialMemoryState(): LogicalSpatialMemoryState {
    return {
      totalCells: 343,
      symbolicAnchors: 26,
      totalAddresses: 369,
      latticeDimensions: [7, 7, 7],
      centerCellIndex: 171,
      center369Address: 197,
      phaseInvariantSatisfied: true,
    };
  }

  // ── Memory Domain: Conversational ──────────────────────────────────────────
  public getConversationalMemory(sessionId: string, tenantId: string = 'tenant_default'): LogicalConversationalMemory | undefined {
    const ctx = ContextManager.getInstance();
    const session = ctx.getSession(sessionId, tenantId);
    if (!session) return undefined;

    return {
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      facts: {},
      historyTurns: session.getHistory().length,
      integrityChecksum: 'SESSION_ACTIVE',
      lastPersistedAt: Date.now(),
    };
  }

  // ── System State Domain ────────────────────────────────────────────────────
  public getSystemState(): LogicalSystemState {
    return {
      uptime: process.uptime(),
      isActuationBlocked: true,
      qwenEradicated: true,
      activeExternalModels: 0,
      nativeInferenceStatus: 'NATIVE_INFERENCE_NOT_YET_AVAILABLE',
      deterministicPipelineReady: (globalThis as any).__cubio_pipeline_installed__ === true,
      timestamp: new Date().toISOString(),
    };
  }
}
