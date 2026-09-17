/**
 * 3D Memory Studio — Funnel 72
 * Studio Boot Manager
 *
 * Master coordinator for the resilient Studio boot pipeline.
 * Ensures required systems initialize correctly while optional service failures
 * gracefully degrade rather than trapping the application in an infinite loading screen.
 */

import {
  BootStageId,
  BootState,
  RuntimeReadyState,
  StageState,
} from '../types';
import { BOOT_STAGE_DESCRIPTORS, REQUIRED_STAGES, OPTIONAL_STAGES } from './bootStages';
import { BootStateMachine } from './bootState';
import { BootProgressTracker } from './bootProgress';
import { StudioBootContext } from './bootContext';
import { SafeModeManager } from '../safety/safeModeManager';
import { BootTimeoutManager } from '../safety/bootTimeoutManager';
import { BootRecoveryManager } from '../safety/bootRecoveryManager';
import { createRuntimeReadyState } from '../runtime/runtimeReadyState';

// Adapters
import { SecurityBootAdapter } from '../adapters/securityBootAdapter';
import { RendererBootAdapter } from '../adapters/rendererBootAdapter';
import { SceneBootAdapter } from '../adapters/sceneBootAdapter';
import { CameraBootAdapter } from '../adapters/cameraBootAdapter';
import { StudioShellBootAdapter } from '../adapters/studioShellBootAdapter';
import { WorkspaceBootAdapter } from '../adapters/workspaceBootAdapter';
import { DimensionBootAdapter } from '../adapters/dimensionBootAdapter';
import { DatabaseBootAdapter } from '../adapters/databaseBootAdapter';
import { CoordinateBootAdapter } from '../adapters/coordinateBootAdapter';
import { AIBootAdapter } from '../adapters/aiBootAdapter';
import { ActionBootAdapter } from '../adapters/actionBootAdapter';
import { PersistenceBootAdapter } from '../adapters/persistenceBootAdapter';

export type BootListener = (state: RuntimeReadyState) => void;

export class StudioBootManager {
  public readonly stateMachine: BootStateMachine;
  public readonly progress: BootProgressTracker;
  public readonly context: StudioBootContext;
  public readonly safeMode: SafeModeManager;
  public readonly timeoutManager: BootTimeoutManager;
  public readonly recoveryManager: BootRecoveryManager;

  // Adapters
  public readonly securityAdapter = new SecurityBootAdapter();
  public readonly rendererAdapter = new RendererBootAdapter();
  public readonly sceneAdapter = new SceneBootAdapter();
  public readonly cameraAdapter = new CameraBootAdapter();
  public readonly studioShellAdapter = new StudioShellBootAdapter();
  public readonly workspaceAdapter = new WorkspaceBootAdapter();
  public readonly dimensionAdapter = new DimensionBootAdapter();
  public readonly databaseAdapter = new DatabaseBootAdapter();
  public readonly coordinateAdapter = new CoordinateBootAdapter();
  public readonly aiAdapter = new AIBootAdapter();
  public readonly actionAdapter = new ActionBootAdapter();
  public readonly persistenceAdapter = new PersistenceBootAdapter();

  private activeBootPromise: Promise<RuntimeReadyState> | null = null;
  private bootStartTime = 0;
  private bootDurationMs = 0;
  private readonly listeners: Set<BootListener> = new Set();

  constructor(context?: StudioBootContext) {
    this.stateMachine = new BootStateMachine();
    this.progress = new BootProgressTracker();
    this.context = context ?? new StudioBootContext();
    this.safeMode = new SafeModeManager();
    this.timeoutManager = new BootTimeoutManager();
    this.recoveryManager = new BootRecoveryManager();
  }

  public getBootState(): BootState {
    return this.stateMachine.getState();
  }

  public getStageState(stage: BootStageId): StageState | undefined {
    return this.progress.getStageState(stage);
  }

  public getReadyState(): RuntimeReadyState {
    return createRuntimeReadyState({
      bootState: this.stateMachine.getState(),
      completedStages: this.progress.getCompletedStages(),
      failedStages: this.progress.getFailedStages(),
      skippedStages: this.progress.getSkippedStages(),
      bootDurationMs: this.bootDurationMs,
      safeMode: this.safeMode.isSafeMode(),
    });
  }

  public subscribe(listener: BootListener): () => void {
    this.listeners.add(listener);
    listener(this.getReadyState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const ready = this.getReadyState();
    for (const listener of this.listeners) {
      listener(ready);
    }
  }

  public start(): Promise<RuntimeReadyState> {
    if (this.activeBootPromise) {
      return this.activeBootPromise;
    }

    if (this.stateMachine.getState() === 'READY') {
      return Promise.resolve(this.getReadyState());
    }

    this.stateMachine.transitionTo('BOOTING');
    this.progress.reset();
    this.bootStartTime = performance.now();
    this.notify();

    const promise = (async () => {
      try {
        return await this.executeBootPipeline();
      } finally {
        this.activeBootPromise = null;
      }
    })();

    this.activeBootPromise = promise;
    return promise;
  }

  private async executeBootPipeline(): Promise<RuntimeReadyState> {
    for (const descriptor of BOOT_STAGE_DESCRIPTORS) {
      if (descriptor.id === 'READY') continue;

      this.progress.setStageRunning(descriptor.id);
      this.notify();

      const stageStart = performance.now();
      try {
        await this.timeoutManager.executeWithTimeout(
          () => this.executeStage(descriptor.id),
          descriptor.timeoutMs,
          descriptor.name
        );
        this.progress.setStageReady(descriptor.id, performance.now() - stageStart);
        this.notify();
      } catch (err: any) {
        const errorMsg = err?.message || 'Stage execution failed';
        this.progress.setStageFailed(descriptor.id, errorMsg, performance.now() - stageStart);
        this.notify();

        if (descriptor.isRequired) {
          // Fatal required stage failure -> transition to FAILED
          this.stateMachine.transitionTo('FAILED');
          this.bootDurationMs = performance.now() - this.bootStartTime;
          this.notify();
          return this.getReadyState();
        } else {
          // Optional stage failure -> mark unavailable in safe mode and continue
          this.safeMode.markServiceUnavailable(descriptor.id);
        }
      }
    }

    // Terminal READY stage
    this.progress.setStageReady('READY', 0);
    this.bootDurationMs = performance.now() - this.bootStartTime;

    const failed = this.progress.getFailedStages();
    if (failed.length > 0) {
      this.safeMode.enableSafeMode(failed);
      this.stateMachine.transitionTo('DEGRADED');
    } else {
      this.stateMachine.transitionTo('READY');
    }

    this.notify();
    return this.getReadyState();
  }

  private async executeStage(stage: BootStageId): Promise<void> {
    switch (stage) {
      case 'APPLICATION':
        return;

      case 'SECURITY': {
        const res = await this.securityAdapter.activate();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'RENDERER': {
        const res = await this.rendererAdapter.activate(this.context.renderer);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'SCENE': {
        const res = await this.sceneAdapter.activate(this.context.scene);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'CAMERA': {
        const res = await this.cameraAdapter.activate(this.context.camera);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'STUDIO_SHELL': {
        const res = await this.studioShellAdapter.activate();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'WORKSPACE': {
        const res = await this.workspaceAdapter.activate(this.context.navigation, this.context.panels);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'DIMENSION': {
        const res = await this.dimensionAdapter.activate(this.context.dimension);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'DATABASE': {
        const res = await this.databaseAdapter.activate(this.context.database);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'AI': {
        const res = await this.aiAdapter.activate(this.context.ai);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'ACTIONS': {
        const res = await this.actionAdapter.activate(this.context.actions);
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'PERSISTENCE': {
        const res = await this.persistenceAdapter.activate(this.context.persistence);
        if (!res.success) throw new Error(res.error);
        return;
      }

      default:
        return;
    }
  }

  public async retryBoot(): Promise<RuntimeReadyState> {
    await this.recoveryManager.prepareForRetry(this.context);
    this.safeMode.disableSafeMode();
    this.stateMachine.reset();
    return this.start();
  }

  public continueSafeMode(): RuntimeReadyState {
    this.safeMode.enableSafeMode(this.progress.getFailedStages());
    this.stateMachine.transitionTo('DEGRADED');
    this.notify();
    return this.getReadyState();
  }

  public dispose(): void {
    this.stateMachine.transitionTo('DISPOSED');
    this.context.dispose();
    this.listeners.clear();
  }
}
