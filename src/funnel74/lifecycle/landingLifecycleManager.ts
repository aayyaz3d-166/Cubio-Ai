/**
 * 3D Memory Studio — Funnel 74
 * Landing Lifecycle Manager
 *
 * Master coordinator for LandingEngine lifecycle, remount recovery,
 * generation tokens, and React StrictMode safety.
 */

import { LandingEngine } from '../../funnel63/landing/landingEngine';
import { LandingLifecycleState, LifecycleGenerationToken, LifecycleSnapshot } from '../types';
import { LandingLifecycleStateMachine } from './landingLifecycleState';
import { LandingLifecycleGenerationTracker } from './landingLifecycleGeneration';
import { LandingLifecycleGuard } from './landingLifecycleGuard';
import { LandingLifecycleRegistry } from './landingLifecycleRegistry';

export type LifecycleListener = (snapshot: LifecycleSnapshot) => void;

export class LandingLifecycleManager {
  public readonly stateMachine = new LandingLifecycleStateMachine();
  public readonly generationTracker = new LandingLifecycleGenerationTracker();
  public readonly guard = new LandingLifecycleGuard();
  public readonly registry = new LandingLifecycleRegistry();

  private currentEngine: LandingEngine | null = null;
  private currentToken: LifecycleGenerationToken | null = null;
  private lastError?: string;
  private readonly listeners: Set<LifecycleListener> = new Set();

  public getLifecycleState(): LandingLifecycleState {
    return this.stateMachine.getState();
  }

  public getEngine(): LandingEngine | null {
    return this.currentEngine;
  }

  public getToken(): LifecycleGenerationToken | null {
    return this.currentToken;
  }

  public getSnapshot(): LifecycleSnapshot {
    const isAct =
      this.stateMachine.isActive() &&
      this.currentEngine !== null &&
      !this.guard.isDisposed(this.currentEngine);
    return {
      state: this.stateMachine.getState(),
      generation: this.generationTracker.getGeneration(),
      hasActiveEngine: isAct,
      canStartStudio: isAct,
      timestamp: Date.now(),
      error: this.lastError,
    };
  }

  public subscribe(listener: LifecycleListener): () => void {
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

  public createEngine(): LandingEngine {
    // If an engine already exists, dispose it cleanly first
    if (this.currentEngine) {
      this.disposeEngine();
    }

    this.currentToken = this.generationTracker.nextToken();
    const engine = new LandingEngine();
    this.currentEngine = engine;
    this.registry.registerActive(engine);
    this.lastError = undefined;

    this.stateMachine.transitionTo('CREATED');
    this.notify();
    return engine;
  }

  public initializeEngine(): boolean {
    if (!this.currentEngine || !this.currentToken) {
      this.lastError = 'Cannot initialize: No engine created';
      this.stateMachine.transitionTo('FAILED');
      this.notify();
      return false;
    }

    if (!this.generationTracker.isTokenCurrent(this.currentToken)) {
      this.lastError = 'Stale initialization token rejected';
      return false;
    }

    const check = this.guard.verifyCanInitialize(this.currentEngine);
    if (!check.success) {
      this.lastError = check.error;
      this.stateMachine.transitionTo('FAILED');
      this.notify();
      return false;
    }

    try {
      this.stateMachine.transitionTo('INITIALIZING');
      this.notify();

      this.currentEngine.initialize();

      this.stateMachine.transitionTo('ACTIVE');
      this.notify();
      return true;
    } catch (err: any) {
      this.lastError = err?.message || 'LandingEngine initialization threw an exception';
      this.stateMachine.transitionTo('FAILED');
      this.notify();
      return false;
    }
  }

  public disposeEngine(): void {
    if (this.stateMachine.isDisposed()) {
      return; // Idempotent
    }

    this.stateMachine.transitionTo('DISPOSING');
    this.notify();

    if (this.currentToken) {
      this.generationTracker.invalidateToken(this.currentToken);
    }

    if (this.currentEngine) {
      this.guard.markDisposed(this.currentEngine);
      try {
        this.currentEngine.dispose();
      } catch (err) {
        // Ignore errors during disposal
      }
      this.registry.unregisterActive(this.currentEngine);
      this.currentEngine = null;
    }

    this.stateMachine.transitionTo('DISPOSED');
    this.notify();
  }

  public replaceEngine(): LandingEngine {
    this.disposeEngine();
    const fresh = this.createEngine();
    this.initializeEngine();
    return fresh;
  }

  public startStudio(): boolean {
    const check = this.guard.verifyCanStart(this.currentEngine, this.stateMachine.isActive());
    if (!check.success || !this.currentEngine) {
      this.lastError = check.error;
      return false;
    }

    return this.currentEngine.startStudio();
  }

  public resetLifecycle(): void {
    this.disposeEngine();
    this.stateMachine.reset();
    this.generationTracker.reset();
    this.registry.reset();
    this.lastError = undefined;
    this.notify();
  }
}
