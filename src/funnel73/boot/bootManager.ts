/**
 * 3D Memory Studio — Funnel 73
 * Master Browser Runtime Boot Manager
 *
 * Coordinates the full deterministic browser mount, deadlock timeout protection,
 * and subsystem readiness validation.
 */

import { BootPhase, BootDiagnosticsData } from '../types';
import { ORDERED_BOOT_PHASES } from './bootPhase';
import { BootStateMachine } from './bootState';
import { BootPhaseManager } from './bootPhaseManager';
import { BootEventHistory } from './bootEventHistory';
import { BootTimeoutManager } from './bootTimeoutManager';
import { BootRetryManager } from './bootRetryManager';
import { BootPerformanceCollector } from '../diagnostics/bootPerformance';
import { BootErrorClassifier, ClassifiedError } from '../diagnostics/bootErrorClassifier';
import { BootDiagnosticsAggregator } from '../diagnostics/bootDiagnostics';
import { RuntimeDiagnosticsLogger } from '../diagnostics/runtimeDiagnostics';

// Adapters
import { RuntimeMountVerifier } from '../runtime/runtimeMountVerifier';
import { RendererRuntimeAdapter } from '../runtime/rendererRuntimeAdapter';
import { SceneRuntimeAdapter } from '../runtime/sceneRuntimeAdapter';
import { StudioRuntimeAdapter } from '../runtime/studioRuntimeAdapter';
import { F72RuntimeAdapter } from '../runtime/f72RuntimeAdapter';
import { RafRuntimeGuard } from '../runtime/rafRuntimeGuard';

export type BootDiagnosticsListener = (diagnostics: BootDiagnosticsData) => void;

export class BrowserBootManager {
  public readonly stateMachine = new BootStateMachine();
  public readonly phaseManager = new BootPhaseManager();
  public readonly eventHistory = new BootEventHistory();
  public readonly timeoutManager = new BootTimeoutManager();
  public readonly retryManager = new BootRetryManager();
  public readonly performanceCollector = new BootPerformanceCollector();
  public readonly errorClassifier = new BootErrorClassifier();
  public readonly diagnosticsAggregator = new BootDiagnosticsAggregator();
  public readonly logger = new RuntimeDiagnosticsLogger();

  // Adapters
  public readonly mountVerifier = new RuntimeMountVerifier();
  public readonly rendererAdapter = new RendererRuntimeAdapter();
  public readonly sceneAdapter = new SceneRuntimeAdapter();
  public readonly studioAdapter = new StudioRuntimeAdapter();
  public readonly f72Adapter = new F72RuntimeAdapter();
  public readonly rafGuard = new RafRuntimeGuard();

  private activeBootPromise: Promise<BootDiagnosticsData> | null = null;
  private lastError: ClassifiedError | null = null;
  private readonly listeners: Set<BootDiagnosticsListener> = new Set();
  private isDisposed = false;

  public getPhase(): BootPhase {
    return this.stateMachine.getPhase();
  }

  public getLastError(): ClassifiedError | null {
    return this.lastError;
  }

  public getDiagnostics(): BootDiagnosticsData {
    const metrics = this.performanceCollector.getMetrics();
    return this.diagnosticsAggregator.compileReport({
      rootMounted: this.phaseManager.getPhaseRecord('ROOT_READY')?.status === 'COMPLETED',
      rendererAvailable: this.phaseManager.getPhaseRecord('CHECKING_RENDERER')?.status === 'COMPLETED',
      sceneAvailable: this.phaseManager.getPhaseRecord('CHECKING_SCENE')?.status === 'COMPLETED',
      cameraAvailable: true,
      studioAvailable: this.phaseManager.getPhaseRecord('CHECKING_STUDIO')?.status === 'COMPLETED',
      f72Ready: this.phaseManager.getPhaseRecord('ACTIVATING_F72')?.status === 'COMPLETED',
      databaseAvailable: true,
      persistenceAvailable: true,
      finalState: this.stateMachine.getPhase(),
      failedPhase: this.lastError?.phase,
      errorMessage: this.lastError?.message,
      events: this.eventHistory.getEvents(),
      metrics,
    });
  }

  public subscribe(listener: BootDiagnosticsListener): () => void {
    this.listeners.add(listener);
    listener(this.getDiagnostics());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const diag = this.getDiagnostics();
    for (const listener of this.listeners) {
      listener(diag);
    }
  }

  public start(): Promise<BootDiagnosticsData> {
    if (this.isDisposed) {
      return Promise.reject(new Error('Cannot start disposed BrowserBootManager.'));
    }

    if (this.activeBootPromise) {
      return this.activeBootPromise;
    }

    if (this.stateMachine.isReady()) {
      return Promise.resolve(this.getDiagnostics());
    }

    const promise = (async () => {
      try {
        return await this.executePipeline();
      } finally {
        this.activeBootPromise = null;
      }
    })();

    this.activeBootPromise = promise;
    return promise;
  }

  private async executePipeline(): Promise<BootDiagnosticsData> {
    this.performanceCollector.startTotal();
    this.phaseManager.reset();
    this.lastError = null;

    for (const phase of ORDERED_BOOT_PHASES) {
      if (this.isDisposed) break;

      this.stateMachine.transitionTo(phase);
      this.phaseManager.markPhaseInProgress(phase);
      this.eventHistory.addEvent(phase, `Entering boot phase: ${phase}`, 'INFO');
      this.logger.logPhase(phase);
      this.notify();

      const phaseStart = performance.now();
      try {
        const record = this.phaseManager.getPhaseRecord(phase);
        const timeoutMs = record?.timeoutMs || 10000;

        await this.timeoutManager.executeWithTimeout(
          () => this.executePhaseAction(phase),
          timeoutMs,
          phase
        );

        const duration = performance.now() - phaseStart;
        this.phaseManager.markPhaseCompleted(phase, duration);
        this.performanceCollector.recordPhaseDuration(phase, duration);
        this.eventHistory.addEvent(phase, `Completed boot phase: ${phase} (${duration.toFixed(1)}ms)`, 'SUCCESS');
        this.notify();
      } catch (err: any) {
        const duration = performance.now() - phaseStart;
        const classified = this.errorClassifier.classify(phase, err);
        this.lastError = classified;

        this.phaseManager.markPhaseFailed(phase, classified.message, duration);
        this.stateMachine.transitionTo('ERROR');
        this.eventHistory.addEvent(phase, `Failed boot phase ${phase}: ${classified.message}`, 'ERROR');
        this.logger.logError(phase, classified.message);
        this.performanceCollector.endTotal();
        this.notify();

        return this.getDiagnostics();
      }
    }

    this.performanceCollector.endTotal();
    this.stateMachine.transitionTo('READY');
    this.eventHistory.addEvent('READY', '3D Memory Studio runtime boot completed successfully', 'SUCCESS');
    this.logger.logPhase('READY');
    this.notify();

    return this.getDiagnostics();
  }

  private async executePhaseAction(phase: BootPhase): Promise<void> {
    switch (phase) {
      case 'UNMOUNTED':
      case 'MOUNTING':
        return;

      case 'ROOT_READY': {
        const res = this.mountVerifier.verifyRoot();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'BOOTSTRAPPING':
        return;

      case 'CHECKING_RENDERER': {
        const res = await this.rendererAdapter.verifyRenderer();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'CHECKING_SCENE': {
        const res = await this.sceneAdapter.verifyScene();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'CHECKING_STUDIO': {
        const res = await this.studioAdapter.verifyStudio();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'CHECKING_RUNTIME': {
        const res = this.rafGuard.verifySingleLoop();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'ACTIVATING_F72': {
        const res = await this.f72Adapter.activateF72();
        if (!res.success) throw new Error(res.error);
        return;
      }

      case 'READY':
        return;

      default:
        return;
    }
  }

  public async retryBoot(): Promise<BootDiagnosticsData> {
    if (!this.retryManager.beginRetry()) {
      return this.getDiagnostics();
    }

    try {
      this.stateMachine.transitionTo('BOOTSTRAPPING');
      this.eventHistory.addEvent('BOOTSTRAPPING', `Initiating retry attempt #${this.retryManager.getRetryCount()}`, 'WARN');
      return await this.start();
    } finally {
      this.retryManager.finishRetry();
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.stateMachine.reset();
    this.listeners.clear();
  }
}
