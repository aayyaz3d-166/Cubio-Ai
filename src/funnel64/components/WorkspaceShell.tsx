/**
 * 3D Memory Studio — Funnel 64
 * Component: WorkspaceShell
 *
 * Full Studio Workspace Shell coordinating TopBar, Navigation, Panels, and 3D Viewport.
 * Integrated with Funnel 77 Authoritative 3D Viewport & Scene Activation.
 */

import React, { useState } from 'react';
import { StudioWorkspaceManager } from '../workspace/workspaceManager';
import { StudioTopBar } from './StudioTopBar';
import { StudioNavigation } from './StudioNavigation';
import { PanelContainer } from './PanelContainer';
import { WorkspaceDiagnostics } from '../diagnostics/WorkspaceDiagnostics';
import { StudioViewport } from '../../funnel77/components/StudioViewport';
import { PanelId } from '../types';

interface WorkspaceShellProps {
  workspace: StudioWorkspaceManager;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ workspace }) => {
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [, setTick] = useState(0);

  const forceUpdate = () => setTick((t) => t + 1);

  const activePanels = workspace.panelRegistry.getActivePanels();
  const visiblePanels = workspace.panelRegistry.getVisiblePanels();
  const primaryPanel = activePanels[0] || visiblePanels[0];

  const handleTogglePanel = (panelId: PanelId) => {
    workspace.panelManager.togglePanel(panelId);
    forceUpdate();
  };

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden flex flex-col font-mono select-none">
      {/* Top Header */}
      <StudioTopBar
        activeDimension={workspace.dimensionAdapter.activeDimension}
        onSwitchDimension={(d) => {
          workspace.switchDimension(d);
          forceUpdate();
        }}
        layout={workspace.layoutEngine.layout}
        onSwitchLayout={(l) => {
          workspace.layoutEngine.setLayout(l);
          forceUpdate();
        }}
        onResetWorkspace={() => {
          workspace.resetWorkspace();
          forceUpdate();
        }}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Navigation Icon Rail */}
        <StudioNavigation
          activePanelId={primaryPanel?.panelId ?? null}
          onTogglePanel={handleTogglePanel}
        />

        {/* Active Side Panel */}
        {primaryPanel && (
          <PanelContainer
            panel={primaryPanel}
            workspace={workspace}
            onUpdate={forceUpdate}
            onClose={() => {
              workspace.panelManager.closePanel(primaryPanel.panelId);
              forceUpdate();
            }}
          />
        )}

        {/* Central 3D Canvas Viewport */}
        <div className="relative flex-1 h-full bg-[#070709]">
          <StudioViewport
            workspace={workspace}
            activeDimension={workspace.dimensionAdapter.activeDimension}
            selectedStateId={workspace.selectionManager.currentStateId}
          />
        </div>
      </div>

      {/* Diagnostics Modal */}
      {diagnosticsOpen && (
        <WorkspaceDiagnostics
          workspace={workspace}
          onClose={() => setDiagnosticsOpen(false)}
        />
      )}
    </div>
  );
};
