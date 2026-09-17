/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Live Production Studio Workspace Host
 *
 * Mounts the production Studio Workspace (`WorkspaceShell`) with first-class
 * Phase 6 User Workspace integration (Header, Dock, State Persistence, Space Switching).
 */

import React, { useState, useCallback, useMemo } from 'react';
import { StudioWorkspaceManager } from '../../../../funnel64/workspace/workspaceManager';
import { WorkspaceShell } from '../../../../funnel64/components/WorkspaceShell';
import { StudioWorkspaceBridge } from '../studioWorkspaceBridge';
import { StudioWorkspaceHeader } from './StudioWorkspaceHeader';
import { StudioWorkspaceDock } from './StudioWorkspaceDock';

export interface LiveStudioWorkspaceHostProps {
  workspace: StudioWorkspaceManager;
}

export const LiveStudioWorkspaceHost: React.FC<LiveStudioWorkspaceHostProps> = ({ workspace }) => {
  const adapter = useMemo(() => StudioWorkspaceBridge.getAdapter(), []);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [, setTick] = useState(0);

  const forceRefresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const state = adapter.getState();
  const activeSpace = state.spaces.find((s) => s.spaceId === state.activeSpaceId && !s.isDeleted) ?? null;

  const handleCreateSpace = useCallback(
    (name: string) => {
      adapter.createSpace(name, [5, 3, 6]);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleOpenSpace = useCallback(
    (spaceId: string) => {
      adapter.openSpace(spaceId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleDeleteSpace = useCallback(
    (spaceId: string) => {
      adapter.deleteSpace(spaceId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleSaveState = useCallback(
    (stateName: string) => {
      adapter.saveCurrentState(stateName);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleResetState = useCallback(() => {
    adapter.resetCurrentState();
    forceRefresh();
  }, [adapter, forceRefresh]);

  const handleModifyCoords = useCallback(
    (coords: [number, number, number]) => {
      adapter.modifyState({ coordinates: coords });
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden flex flex-col font-mono select-none">
      {/* 1. Production Studio Workspace Header Bar */}
      <StudioWorkspaceHeader
        activeSpace={activeSpace}
        spacesCount={state.spaces.filter((s) => !s.isDeleted).length}
        isDockOpen={isDockOpen}
        onToggleDock={() => setIsDockOpen((prev) => !prev)}
        onCreateSpace={handleCreateSpace}
        onSaveState={handleSaveState}
        onResetState={handleResetState}
        stateChecksum={state.currentChecksum}
      />

      {/* 2. Main Studio Workspace Layout (Dock + WorkspaceShell) */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* User Workspace Interactive Dock */}
        <StudioWorkspaceDock
          isOpen={isDockOpen}
          onClose={() => setIsDockOpen(false)}
          spaces={state.spaces}
          activeSpaceId={state.activeSpaceId}
          experiments={state.experiments}
          savedStates={state.savedStates}
          recentViews={state.recentViews}
          selectedObjectId={state.selectedObjectId}
          onOpenSpace={handleOpenSpace}
          onCreateSpace={handleCreateSpace}
          onDeleteSpace={handleDeleteSpace}
          onLoadSavedState={(stId) => {
            adapter.loadSavedState(stId);
            forceRefresh();
          }}
          onModifyCoordinates={handleModifyCoords}
        />

        {/* Core Studio Workspace Shell (Navigation Rail, Panels, 3D Canvas Viewport) */}
        <div className="flex-1 h-full overflow-hidden relative">
          <WorkspaceShell workspace={workspace} />
        </div>
      </div>
    </div>
  );
};
