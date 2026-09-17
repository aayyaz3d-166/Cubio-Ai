/**
 * 3D Memory Studio — Funnel 72
 * Studio Boot Context
 *
 * Holds and shares references to existing upstream authorities without duplicating instances.
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { StudioNavigationManager } from '../../funnel66/navigation/navigationManager';
import { PanelOrchestrator } from '../../funnel66/panels/panelOrchestrator';
import { DatabaseRegistry } from '../../funnel67/database/databaseRegistry';
import { ChatController } from '../../funnel69/chat/chatController';
import { StudioActionEngine } from '../../funnel70/engine/studioActionEngine';
import { PersistenceManager } from '../../funnel71/persistence/persistenceManager';

export interface BootContextOptions {
  renderer?: MemoryRendererHost;
  scene?: SceneEngine;
  camera?: CameraEngine;
  dimension?: DimensionEngine;
  navigation?: StudioNavigationManager;
  panels?: PanelOrchestrator;
  database?: DatabaseRegistry;
  ai?: ChatController;
  actions?: StudioActionEngine;
  persistence?: PersistenceManager;
}

export class StudioBootContext {
  public renderer?: MemoryRendererHost;
  public scene?: SceneEngine;
  public camera?: CameraEngine;
  public dimension?: DimensionEngine;
  public navigation?: StudioNavigationManager;
  public panels?: PanelOrchestrator;
  public database?: DatabaseRegistry;
  public ai?: ChatController;
  public actions?: StudioActionEngine;
  public persistence?: PersistenceManager;

  constructor(options?: BootContextOptions) {
    this.renderer = options?.renderer;
    this.scene = options?.scene;
    this.camera = options?.camera;
    this.dimension = options?.dimension;
    this.navigation = options?.navigation;
    this.panels = options?.panels;
    this.database = options?.database;
    this.ai = options?.ai;
    this.actions = options?.actions;
    this.persistence = options?.persistence;
  }

  public resetTransientStates(): void {
    // Re-verify engine references without reconstructing heavy Three.js instances
  }

  public dispose(): void {
    this.renderer = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.dimension = undefined;
    this.navigation = undefined;
    this.panels = undefined;
    this.database = undefined;
    this.ai = undefined;
    this.actions = undefined;
    this.persistence = undefined;
  }
}
