/**
 * 3D Memory Studio — Funnel 64
 * Workspace Context Snapshot Factory
 */

import { WorkspaceContextSnapshot, PanelId, WorkspaceLayoutType } from '../types';
import { SimulationDimension } from '../../funnel52/types';

export function createWorkspaceContextSnapshot(
  activePanelId: PanelId | null,
  visiblePanelIds: readonly PanelId[],
  layout: WorkspaceLayoutType,
  selectedStateId: string | null,
  selectedRelationshipId: string | null,
  selectedClusterId: string | null,
  activeDimension: SimulationDimension = 3,
  cameraMode = 'ORBIT',
  registeredPanelsCount = 10
): WorkspaceContextSnapshot {
  return {
    activePanelId,
    visiblePanelIds: [...visiblePanelIds],
    layout,
    selectedStateId,
    selectedRelationshipId,
    selectedClusterId,
    activeDimension,
    cameraMode,
    registeredPanelsCount,
  };
}
