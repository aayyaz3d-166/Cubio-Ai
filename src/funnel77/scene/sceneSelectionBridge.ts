/**
 * 3D Memory Studio — Funnel 77
 * Scene Selection Bridge
 *
 * Bridges Studio Workspace selection (Database, Information, Coordinates, AI)
 * to F56 Scene highlight and F61 Camera focus.
 * Enforces maximum 1 selected object, maximum 1 selection marker, and F47 security.
 */

import { SpatialSelectionContext } from '../types';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { DataClassification } from '../../funnel47/types';
import { SimulationDimension } from '../../funnel52/types';

export class SceneSelectionBridge {
  private currentSelection: SpatialSelectionContext | null = null;

  public selectObject(
    id: string | null,
    position: [number, number, number] | null,
    classification: DataClassification,
    label?: string,
    dimension: SimulationDimension = 3,
    scene?: SceneEngine | null,
    camera?: CameraEngine | null
  ): SpatialSelectionContext | null {
    if (!id || classification === 'RED') {
      this.clearSelection(scene);
      return null;
    }

    const context: SpatialSelectionContext = {
      selectedId: id,
      position,
      classification,
      label: label ?? id,
      dimension,
    };

    this.currentSelection = context;

    // 1. Scene Highlight
    if (scene && !(scene as any).isDisposed) {
      scene.selection.selectObject(id);
    }

    // 2. Camera Focus
    if (camera && position && !(camera as any).isDisposed) {
      camera.navigation.focusManager.focusState(camera.state, id, position, 25);
    }

    return this.currentSelection;
  }

  public clearSelection(scene?: SceneEngine | null): void {
    this.currentSelection = null;
    if (scene && !(scene as any).isDisposed) {
      scene.selection.clearSelection();
      scene.highlights.clearHighlights();
    }
  }

  public getSelection(): SpatialSelectionContext | null {
    return this.currentSelection;
  }
}
