/**
 * 3D Memory Studio — Funnel 65
 * Master Runtime Bootstrap Coordinator
 */

import { RuntimeStateMachine } from './runtimeState';
import { RuntimeLifecycleManager } from './runtimeLifecycle';
import { LandingEngine } from '../../funnel63/landing/landingEngine';
import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';
import { RuntimeDiagnosticReport, RuntimeScreen } from '../types';

export class RuntimeBootstrap {
  public readonly stateMachine: RuntimeStateMachine;
  public readonly lifecycle: RuntimeLifecycleManager;
  public readonly landingEngine: LandingEngine;
  public readonly workspace: StudioWorkspaceManager;

  private currentScreen: RuntimeScreen = 'LANDING';
  private rootMounted = true;
  private isDisposed = false;

  constructor() {
    this.stateMachine = new RuntimeStateMachine();
    this.lifecycle = new RuntimeLifecycleManager();
    this.landingEngine = new LandingEngine();
    this.workspace = new StudioWorkspaceManager();
  }

  public async initializeRuntime(): Promise<boolean> {
    if (this.isDisposed) throw new Error('Cannot initialize disposed RuntimeBootstrap.');

    const firstTime = this.lifecycle.initialize();
    if (!firstTime) return false;

    this.landingEngine.initialize();
    await this.workspace.initialize();

    this.stateMachine.transitionTo('LANDING');
    this.currentScreen = 'LANDING';
    return true;
  }

  public enterStudio(): boolean {
    if (this.isDisposed || this.currentScreen === 'STUDIO') return false;

    // Trigger F63 landing transition
    const ok = this.landingEngine.startStudio();
    this.stateMachine.transitionTo('STARTING_STUDIO');

    // Mount studio
    this.stateMachine.transitionTo('STUDIO_ACTIVE');
    this.currentScreen = 'STUDIO';
    return true;
  }

  public returnToLanding(): void {
    if (this.isDisposed) return;
    this.landingEngine.reset();
    this.workspace.resetWorkspace();
    this.stateMachine.transitionTo('LANDING');
    this.currentScreen = 'LANDING';
  }

  public get screen(): RuntimeScreen {
    return this.currentScreen;
  }

  public getDiagnosticReport(): RuntimeDiagnosticReport {
    const wsSnap = this.workspace.getContextSnapshot();
    const vpBounds = this.workspace.viewportAdapter.getViewportBounds();

    return {
      state: this.stateMachine.mode,
      screen: this.currentScreen,
      rootMounted: this.rootMounted,
      landingMounted: this.currentScreen === 'LANDING',
      studioMounted: this.currentScreen === 'STUDIO',
      rendererCreated: this.workspace.viewportAdapter.rendererHost !== undefined,
      canvasAttached: vpBounds.width > 0 && vpBounds.height > 0,
      canvasWidth: vpBounds.width,
      canvasHeight: vpBounds.height,
      rafOwner: 'F55 Single Loop Authority',
      cameraConnected: this.workspace.cameraAdapter !== undefined,
      sceneConnected: true,
      workspaceVisible: this.currentScreen === 'STUDIO',
      activePanel: wsSnap.activePanelId,
      activeDimension: wsSnap.activeDimension,
      timestamp: Date.now(),
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.stateMachine.transitionTo('DISPOSED');
    this.landingEngine.dispose();
    this.workspace.dispose();
    this.lifecycle.dispose();
  }
}
