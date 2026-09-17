/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Selection Visualization Engine
 *
 * Maps visual object selection directly to downstream workspace & reality references.
 * Invariant: Selection NEVER mutates Reality (Delta Reality = 0).
 */

import {
  R7SceneGraph,
  R7SelectionVisualState,
  R7VisualObject,
} from './types';

export class SelectionVisualizationEngine {
  public static createEmptySelection(): R7SelectionVisualState {
    return Object.freeze({
      selectedVisualObjectId: null,
      selectedRelationshipId: null,
      selectedSpatialId: null,
      hoveredVisualObjectId: null,
    });
  }

  public static selectVisualObject(
    visualObjectId: string | null,
    currentSelection: R7SelectionVisualState = SelectionVisualizationEngine.createEmptySelection()
  ): R7SelectionVisualState {
    return Object.freeze({
      ...currentSelection,
      selectedVisualObjectId: visualObjectId,
      selectedRelationshipId: null,
      selectedSpatialId: null,
    });
  }

  public static hoverVisualObject(
    visualObjectId: string | null,
    currentSelection: R7SelectionVisualState
  ): R7SelectionVisualState {
    return Object.freeze({
      ...currentSelection,
      hoveredVisualObjectId: visualObjectId,
    });
  }

  public static findSelectedObject(
    sceneGraph: R7SceneGraph,
    selection: R7SelectionVisualState
  ): R7VisualObject | null {
    if (!selection.selectedVisualObjectId) return null;
    const node = sceneGraph.nodes.find(
      (n) => n.visualObject.identity.visualObjectId === selection.selectedVisualObjectId
    );
    return node ? node.visualObject : null;
  }
}
