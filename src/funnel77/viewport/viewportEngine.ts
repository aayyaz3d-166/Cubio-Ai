/**
 * 3D Memory Studio — Funnel 77
 * Master Viewport Engine
 *
 * Central coordinator for 3D Viewport activation, canvas mounting,
 * scene synchronization, camera preset control, and spatial selection.
 */

import { CameraPreset, ViewportSnapshot, SpatialSelectionContext } from '../types';
import { ViewportMountManager } from './viewportMountManager';
import { ViewportResizeManager } from './viewportResizeManager';
import { ViewportStatusManager } from './viewportStatusManager';
import { SceneActivationManager } from '../scene/sceneActivationManager';
import { SceneSelectionBridge } from '../scene/sceneSelectionBridge';
import { SceneVisibilityManager } from '../scene/sceneVisibilityManager';

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { DataClassification } from '../../funnel47/types';
import { SimulationDimension } from '../../funnel52/types';
import { CameraPresetType } from '../../funnel61/types';

export class ViewportEngine {
  public readonly mountManager = new ViewportMountManager();
  public readonly resizeManager = new ViewportResizeManager();
  public readonly statusManager = new ViewportStatusManager();
  public readonly activationManager = new SceneActivationManager();
  public readonly selectionBridge = new SceneSelectionBridge();
  public readonly visibilityManager = new SceneVisibilityManager();

  private host: MemoryRendererHost | null = null;
  private scene: SceneEngine | null = null;
  private camera: CameraEngine | null = null;

  public mount(
    canvas: HTMLCanvasElement,
    host: MemoryRendererHost,
    scene: SceneEngine,
    camera: CameraEngine
  ): boolean {
    this.statusManager.updateStatus({ state: 'MOUNTING' });

    this.host = host;
    this.scene = scene;
    this.camera = camera;

    // 1. Attach Canvas
    this.statusManager.updateStatus({ state: 'ATTACHING' });
    const canvasAttached = this.mountManager.attachCanvas(canvas, host);
    if (!canvasAttached) {
      this.statusManager.updateStatus({
        state: 'ERROR',
        error: 'Failed to attach canvas to renderer host',
      });
      return false;
    }

    // 2. Activate Scene & Camera
    const sceneAttached = this.activationManager.activateScene(scene, host);
    if (host && typeof (host as any).setAttachedCamera === 'function') {
      (host as any).setAttachedCamera(camera);
    }

    // 3. Initial Resize
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.resizeManager.resize(rect.width, rect.height, host, camera);
    }

    // 4. Update Status
    const objects = this.activationManager.resolver.resolveRenderables(scene);
    this.statusManager.updateStatus({
      state: sceneAttached ? 'ACTIVE' : 'DEGRADED',
      isCanvasAttached: true,
      isSceneAttached: sceneAttached,
      objectCount: objects.length,
    });

    // 5. Explicit Synchronous Initial Render
    if (this.mountManager.isAttached()) {
      try {
        host.render();
      } catch {
        // Safe initial render guard
      }
    }

    return true;
  }

  public unmount(): void {
    if (this.host && typeof (this.host as any).setAttachedCamera === 'function') {
      (this.host as any).setAttachedCamera(null);
    }
    this.mountManager.detachCanvas();
    this.activationManager.deactivateScene();
    this.selectionBridge.clearSelection(this.scene);
    this.statusManager.updateStatus({
      state: 'WAITING',
      isCanvasAttached: false,
      isSceneAttached: false,
    });
    this.host = null;
    this.scene = null;
    this.camera = null;
  }

  public selectObject(
    id: string | null,
    position: [number, number, number] | null,
    classification: DataClassification,
    label?: string,
    dimension: SimulationDimension = 3
  ): SpatialSelectionContext | null {
    const sel = this.selectionBridge.selectObject(
      id,
      position,
      classification,
      label,
      dimension,
      this.scene,
      this.camera
    );

    this.statusManager.updateStatus({
      selectedObject: sel,
      objectCount: sel ? Math.max(this.statusManager.getSnapshot().objectCount, 1) : (id === null ? 0 : this.statusManager.getSnapshot().objectCount),
    });
    this.render();
    return sel;
  }

  public applyPreset(preset: CameraPreset): void {
    if (!this.camera || (this.camera as any).isDisposed) return;

    switch (preset) {
      case 'TOP':
      case 'FRONT':
      case 'SIDE':
        this.camera.navigation.setPreset(this.camera.state, preset as CameraPresetType);
        break;
      case 'ISOMETRIC':
        this.camera.state.position = [35, 35, 35];
        this.camera.state.target = [0, 0, 0];
        break;
      case 'RESET':
        this.camera.navigation.resetCamera(this.camera.state);
        break;
      case 'FIT':
        this.camera.navigation.focusManager.focusCore(this.camera.state, [0, 0, 0], 45);
        break;
    }

    this.statusManager.updateStatus({
      controls: { activePreset: preset },
    });
    this.render();
  }

  public toggleAxes(): void {
    const next = !this.visibilityManager.areAxesVisible();
    this.visibilityManager.setAxesVisible(next);
    this.statusManager.updateStatus({
      controls: { showAxes: next },
    });
    this.render();
  }

  public toggleGrid(): void {
    const next = !this.visibilityManager.isGridVisible();
    this.visibilityManager.setGridVisible(next);
    this.statusManager.updateStatus({
      controls: { showGrid: next },
    });
    this.render();
  }

  public setDimension(dimension: SimulationDimension): void {
    this.statusManager.updateStatus({
      controls: { activeDimension: dimension },
    });
    this.render();
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.resizeManager.resize(width, height, this.host, this.camera);
    this.render();
  }

  public render(): void {
    if (this.host && !(this.host as any).isDisposed && this.mountManager.isAttached()) {
      try {
        this.host.render();
      } catch {
        // Safe render guard
      }
    }
  }

  public getSnapshot(): ViewportSnapshot {
    return this.statusManager.getSnapshot();
  }

  public getProjectedDiagnostics(): readonly import('../../funnel55/types').ProjectedObjectDiagnostic[] {
    return this.host ? this.host.getProjectedDiagnostics() : [];
  }

  public dispose(): void {
    this.unmount();
    this.statusManager.updateStatus({ state: 'DISPOSED' });
  }
}
