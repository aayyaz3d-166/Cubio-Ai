/**
 * 3D Memory Studio — Funnel 76
 * Master Studio Boot Manager
 *
 * Coordinates startup dependency readiness, bounded timeouts,
 * generation tokens, and deterministic workspace activation.
 */

import { StudioBootState, BootDependencyId, StudioBootSnapshot, BootGenerationToken } from '../types';
import { StudioBootStateMachine } from './studioBootState';
import { BootDependencyManager } from './bootDependencyManager';
import { BootGenerationTracker } from './bootGeneration';
import { BootTimeoutManager, DEFAULT_DEP_TIMEOUT_MS } from './bootTimeoutManager';
import { BootReadinessManager } from './bootReadinessManager';

import { RendererBootAdapter } from '../adapters/rendererBootAdapter';
import { CameraBootAdapter } from '../adapters/cameraBootAdapter';
import { SceneBootAdapter } from '../adapters/sceneBootAdapter';
import { LandingBootAdapter } from '../adapters/landingBootAdapter';
import { WorkspaceBootAdapter } from '../adapters/workspaceBootAdapter';
import { RuntimeBootAdapter } from '../adapters/runtimeBootAdapter';
import { DataBootAdapter } from '../adapters/dataBootAdapter';

export type StudioBootListener = (snapshot: StudioBootSnapshot) => void;

export class StudioBootManager {
  public readonly stateMachine = new StudioBootStateMachine();
  public readonly dependencyManager = new BootDependencyManager();
  public readonly generationTracker = new BootGenerationTracker();
  public readonly timeoutManager = new BootTimeoutManager();
  public readonly readinessManager = new BootReadinessManager();

  public readonly rendererAdapter = new RendererBootAdapter();
  public readonly cameraAdapter = new CameraBootAdapter();
  public readonly sceneAdapter = new SceneBootAdapter();
  public readonly landingAdapter = new LandingBootAdapter();
  public readonly workspaceAdapter = new WorkspaceBootAdapter();
  public readonly runtimeAdapter = new RuntimeBootAdapter();
  public readonly dataAdapter = new DataBootAdapter();

  private currentToken: BootGenerationToken | null = null;
  private activeBootPromise: Promise<boolean> | null = null;
  private failedDependencyId?: BootDependencyId;
  private lastError?: string;
  private readonly listeners: Set<StudioBootListener> = new Set();

  public getBootState(): StudioBootState {
    return this.stateMachine.getState();
  }

  public isReady(): boolean {
    return this.stateMachine.isReady();
  }

  public isActive(): boolean {
    return this.stateMachine.isActive();
  }

  public getSnapshot(): StudioBootSnapshot {
    return {
      state: this.stateMachine.getState(),
      generation: this.generationTracker.getGeneration(),
      progressPercentage: this.dependencyManager.getProgressPercentage(),
      isReady: this.stateMachine.isReady(),
      isActive: this.stateMachine.isActive(),
      dependencies: this.dependencyManager.getAllDependencies(),
      failedDependency: this.failedDependencyId,
      error: this.lastError,
      timestamp: Date.now(),
    };
  }

  public subscribe(listener: StudioBootListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public async startBoot(): Promise<boolean> {
    if (this.activeBootPromise) {
      return this.activeBootPromise;
    }

    if (this.stateMachine.isActive()) {
      return true;
    }

    const token = this.generationTracker.nextToken();
    this.currentToken = token;
    this.failedDependencyId = undefined;
    this.lastError = undefined;

    this.activeBootPromise = this.executeBootPipeline(token);
    try {
      return await this.activeBootPromise;
    } finally {
      this.activeBootPromise = null;
    }
  }

  private async executeBootPipeline(token: BootGenerationToken): Promise<boolean> {
    this.stateMachine.transitionTo('BOOT_REQUESTED');
    this.notify();

    if (!this.generationTracker.isTokenCurrent(token)) return false;

    this.stateMachine.transitionTo('BOOTSTRAPPING');
    this.dependencyManager.reset();
    this.notify();

    // 1. RENDERER
    const rendererOk = await this.checkSingleDependency(
      token,
      'RENDERER',
      'CHECKING_RENDERER',
      () => this.rendererAdapter.checkReadiness()
    );
    if (!rendererOk) return false;

    // 2. CAMERA
    const cameraOk = await this.checkSingleDependency(
      token,
      'CAMERA',
      'CHECKING_CAMERA',
      () => this.cameraAdapter.checkReadiness()
    );
    if (!cameraOk) return false;

    // 3. SCENE
    const sceneOk = await this.checkSingleDependency(
      token,
      'SCENE',
      'CHECKING_SCENE',
      () => this.sceneAdapter.checkReadiness()
    );
    if (!sceneOk) return false;

    // 4. LANDING
    const landingOk = await this.checkSingleDependency(
      token,
      'LANDING',
      'CHECKING_LANDING',
      () => this.landingAdapter.checkReadiness()
    );
    if (!landingOk) return false;

    // 5. WORKSPACE
    const workspaceOk = await this.checkSingleDependency(
      token,
      'WORKSPACE',
      'CHECKING_WORKSPACE',
      () => this.workspaceAdapter.checkReadiness()
    );
    if (!workspaceOk) return false;

    // 6. RUNTIME
    const runtimeOk = await this.checkSingleDependency(
      token,
      'RUNTIME',
      'CHECKING_RUNTIME',
      () => this.runtimeAdapter.checkReadiness()
    );
    if (!runtimeOk) return false;

    // 7. DATA (Optional)
    await this.checkSingleDependency(
      token,
      'DATA',
      'CHECKING_DATA',
      () => this.dataAdapter.checkReadiness()
    );

    if (!this.generationTracker.isTokenCurrent(token)) return false;

    // Final Readiness Check
    const readiness = this.readinessManager.verifyReadiness(this.dependencyManager);
    if (!readiness.ready) {
      this.lastError = readiness.error;
      this.stateMachine.transitionTo('FAILED');
      this.notify();
      return false;
    }

    this.stateMachine.transitionTo('READY');
    this.notify();

    // Activate workspace
    return this.activateWorkspace(token);
  }

  private async checkSingleDependency(
    token: BootGenerationToken,
    id: BootDependencyId,
    state: StudioBootState,
    checkFn: () => Promise<{ ready: boolean; error?: string }>
  ): Promise<boolean> {
    if (!this.generationTracker.isTokenCurrent(token)) return false;

    this.stateMachine.transitionTo(state);
    this.dependencyManager.markChecking(id);
    this.notify();

    try {
      const result = await this.timeoutManager.executeWithTimeout(
        checkFn,
        DEFAULT_DEP_TIMEOUT_MS,
        `Dependency check for '${id}' timed out after ${DEFAULT_DEP_TIMEOUT_MS}ms`
      );

      if (!this.generationTracker.isTokenCurrent(token)) return false;

      if (result.ready) {
        this.dependencyManager.markReady(id);
        this.notify();
        return true;
      } else {
        const err = result.error || `Dependency check for '${id}' failed`;
        this.dependencyManager.markFailed(id, err);
        this.failedDependencyId = id;
        this.lastError = err;
        this.stateMachine.transitionTo('FAILED');
        this.notify();
        return false;
      }
    } catch (err: any) {
      if (!this.generationTracker.isTokenCurrent(token)) return false;

      const message = err?.message || String(err);
      this.dependencyManager.markFailed(id, message);
      this.failedDependencyId = id;
      this.lastError = message;
      this.stateMachine.transitionTo('FAILED');
      this.notify();
      return false;
    }
  }

  public activateWorkspace(token?: BootGenerationToken): boolean {
    if (token && !this.generationTracker.isTokenCurrent(token)) {
      return false;
    }

    if (this.stateMachine.isActive()) {
      return true; // Already active, idempotent
    }

    if (!this.stateMachine.isReady()) {
      return false;
    }

    this.stateMachine.transitionTo('ACTIVE');
    this.notify();
    return true;
  }

  public async retry(): Promise<boolean> {
    this.activeBootPromise = null;
    this.stateMachine.transitionTo('RETRYING');
    this.notify();
    return this.startBoot();
  }

  public dispose(): void {
    if (this.currentToken) {
      this.generationTracker.invalidateToken(this.currentToken);
    }
    this.activeBootPromise = null;
    this.stateMachine.transitionTo('DISPOSED');
    this.notify();
  }

  public reset(): void {
    this.dispose();
    this.stateMachine.reset();
    this.dependencyManager.reset();
    this.activeBootPromise = null;
    this.failedDependencyId = undefined;
    this.lastError = undefined;
    this.notify();
  }
}
