/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Workspace Dashboard (Personal Workspace Environment)
 */

import React, { useState, useMemo, useReducer } from 'react';
import {
  PersonalSpace,
  PersonalWorkspaceState,
} from '../types';
import { WorkspacePersistenceCoordinator } from '../workspacePersistence';
import { WorkspaceValidationEngine } from '../workspaceValidation';
import { WorkspaceHistoryManager } from '../workspaceHistory';
import { P68SpaceBrowser } from './P68SpaceBrowser';
import { P68SpaceEditor } from './P68SpaceEditor';
import { P68ExperimentPanel } from './P68ExperimentPanel';
import { P68SavedStatesPanel } from './P68SavedStatesPanel';
import { P68RecentViewsPanel } from './P68RecentViewsPanel';
import { P68WorkspaceInspector } from './P68WorkspaceInspector';
import { P68ValidationPanel } from './P68ValidationPanel';
import { LayoutDashboard, Undo2, Redo2 } from 'lucide-react';

export const P68WorkspaceDashboard: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const coordinator = useMemo(() => {
    const coord = new WorkspacePersistenceCoordinator('Dr. Alice Chen');
    const sp = coord.spaceManager.createSpace('Dr. Alice Chen', 'Primary Research Space');
    coord.setActiveSpaceId(sp.spaceId);
    return coord;
  }, []);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const activeSpace: PersonalSpace | undefined = coordinator.getActiveSpace();
  const history = useMemo(() => activeSpace ? new WorkspaceHistoryManager(activeSpace) : null, [coordinator]);

  const workspaceState: PersonalWorkspaceState = coordinator.assembleWorkspaceState();
  const validationReport = useMemo(
    () => WorkspaceValidationEngine.validateWorkspaceState(workspaceState),
    [workspaceState]
  );

  // ── Handlers ──
  const handleOpenSpace = (spaceId: string) => {
    coordinator.setActiveSpaceId(spaceId);
    const sp = coordinator.getActiveSpace();
    if (sp) {
      coordinator.recentViewsEngine.recordView(
        sp.spaceId,
        sp.view,
        sp.dimension,
        sp.observers,
        sp.view.selectedObjectId
      );
    }
    forceUpdate();
  };

  const handleCreateSpace = (name: string) => {
    const sp = coordinator.spaceManager.createSpace(coordinator.getUserId(), name);
    coordinator.setActiveSpaceId(sp.spaceId);
    history?.recordSpace(sp, `Created Space ${name}`);
    forceUpdate();
  };

  const handleDuplicateSpace = (space: PersonalSpace) => {
    const dup = coordinator.spaceManager.saveAs(space, `${space.name} (Copy)`);
    coordinator.setActiveSpaceId(dup.spaceId);
    history?.recordSpace(dup, `Duplicated Space ${space.name}`);
    forceUpdate();
  };

  const handleRenameSpace = (space: PersonalSpace, newName: string) => {
    const renamed = coordinator.spaceManager.renameSpace(space, newName);
    history?.recordSpace(renamed, `Renamed Space to ${newName}`);
    forceUpdate();
  };

  const handleDeleteSpace = (spaceId: string) => {
    coordinator.spaceManager.deleteSpace(spaceId);
    const remaining = coordinator.spaceManager.getRepository().list();
    if (remaining.length > 0) {
      coordinator.setActiveSpaceId(remaining[0].spaceId);
    }
    forceUpdate();
  };

  const handleResetSpace = (space: PersonalSpace) => {
    const reset = coordinator.spaceManager.resetSpace(space);
    history?.recordSpace(reset, `Reset Space ${space.name}`);
    forceUpdate();
  };

  const handleCreateExperiment = (name: string) => {
    if (!activeSpace) return;
    coordinator.experimentManager.createExperiment(activeSpace, name);
    forceUpdate();
  };

  const handleCreateSavedState = (label: string) => {
    if (!activeSpace) return;
    coordinator.savedStateManager.createSavedState(activeSpace, label);
    forceUpdate();
  };

  const handleRestoreSavedState = (stateId: string) => {
    if (!activeSpace) return;
    const restored = coordinator.savedStateManager.restoreSavedState(activeSpace, stateId);
    coordinator.spaceManager.saveSpace(restored);
    history?.recordSpace(restored, `Restored state ${stateId}`);
    forceUpdate();
  };

  const handleDeleteSavedState = (stateId: string) => {
    coordinator.savedStateManager.deleteSavedState(stateId);
    forceUpdate();
  };

  const handleClearRecentViews = () => {
    coordinator.recentViewsEngine.clear();
    forceUpdate();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-amber-400">
            P6.8 — MY SPACES & WORKSPACE PERSISTENCE
          </span>
          <span className="text-xs text-zinc-500">Phase 6: User Workspace</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: MY SPACES */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P68SpaceBrowser
            spaces={workspaceState.spaces}
            activeSpaceId={coordinator.getActiveSpaceId()}
            onOpenSpace={handleOpenSpace}
            onCreateSpace={handleCreateSpace}
            onDuplicateSpace={handleDuplicateSpace}
            onRenameSpace={handleRenameSpace}
            onDeleteSpace={handleDeleteSpace}
            onResetSpace={handleResetSpace}
          />
        </div>

        {/* CENTER: ACTIVE SPACE 3D CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P68SpaceEditor space={activeSpace} width={560} height={360} />
        </div>

        {/* RIGHT: INSPECTOR, SAVED STATES, EXPERIMENTS, RECENT VIEWS */}
        <div className="w-[320px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P68WorkspaceInspector
            activeSpace={activeSpace}
            workspaceChecksum={workspaceState.workspaceChecksum}
          />
          <P68SavedStatesPanel
            savedStates={activeSpace ? coordinator.savedStateManager.listSavedStates(activeSpace.spaceId) : []}
            activeSpace={activeSpace}
            onCreateSavedState={handleCreateSavedState}
            onRestoreSavedState={handleRestoreSavedState}
            onDeleteSavedState={handleDeleteSavedState}
          />
          <P68ExperimentPanel
            experiments={coordinator.experimentManager.listExperiments(activeSpace?.spaceId)}
            activeSpace={activeSpace}
            onCreateExperiment={handleCreateExperiment}
          />
          <P68RecentViewsPanel
            recentViews={coordinator.recentViewsEngine.listRecentViews(activeSpace?.spaceId)}
            onClearRecentViews={handleClearRecentViews}
          />
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <P68ValidationPanel validationReport={validationReport} />
    </div>
  );
};
