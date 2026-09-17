/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Selection Controller
 *
 * Manages object selection state independently from underlying Reality X.
 * Selection changes NEVER alter Reality checksums or object geometry.
 */

import { InteractiveSelectionState } from './types';
import { WorkspaceReality } from '../p61/types';

export class SelectionController {
  private state: InteractiveSelectionState;

  constructor(initialId: string | null = null) {
    this.state = Object.freeze({
      selectedObjectId: initialId,
      multiSelectedIds: initialId ? [initialId] : [],
      selectionActive: initialId !== null,
      lastSelectedPosition: null,
    });
  }

  public getState(): InteractiveSelectionState {
    return this.state;
  }

  public select(objectId: string, reality: WorkspaceReality): InteractiveSelectionState {
    const found = reality.objects.find((o) => o.id === objectId);
    this.state = Object.freeze({
      selectedObjectId: objectId,
      multiSelectedIds: [objectId],
      selectionActive: true,
      lastSelectedPosition: found ? found.position : null,
    });
    return this.state;
  }

  public deselect(): InteractiveSelectionState {
    this.state = Object.freeze({
      selectedObjectId: null,
      multiSelectedIds: [],
      selectionActive: false,
      lastSelectedPosition: null,
    });
    return this.state;
  }

  public toggleMultiSelect(objectId: string, reality: WorkspaceReality): InteractiveSelectionState {
    const exists = this.state.multiSelectedIds.includes(objectId);
    const nextIds = exists
      ? this.state.multiSelectedIds.filter((id) => id !== objectId)
      : [...this.state.multiSelectedIds, objectId];

    const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
    const found = primaryId ? reality.objects.find((o) => o.id === primaryId) : null;

    this.state = Object.freeze({
      selectedObjectId: primaryId,
      multiSelectedIds: Object.freeze(nextIds),
      selectionActive: nextIds.length > 0,
      lastSelectedPosition: found ? found.position : null,
    });
    return this.state;
  }

  public pruneSelection(reality: WorkspaceReality): InteractiveSelectionState {
    // If selected object was deleted, clear selection
    if (this.state.selectedObjectId) {
      const exists = reality.objects.some((o) => o.id === this.state.selectedObjectId);
      if (!exists) {
        return this.deselect();
      }
    }
    return this.state;
  }
}
