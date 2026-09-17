/**
 * 3D Memory Studio — Funnel 62
 * Component: StudioShell
 *
 * Primary application shell composing the 3D viewport and modular panels.
 */

import React, { useRef, useEffect, useState } from 'react';
import { StudioCoordinator } from '../integration/studioCoordinator';
import { StudioHeader } from '../components/StudioHeader';
import { StudioToolbar } from '../components/StudioToolbar';
import { DatabasePanel } from '../panels/DatabasePanel';
import { CoordinatePanel } from '../panels/CoordinatePanel';
import { InformationPanel } from '../panels/InformationPanel';
import { GraphPanel } from '../panels/GraphPanel';
import { ClusterPanel } from '../panels/ClusterPanel';
import { ChatPanel } from '../panels/ChatPanel';
import { StudioDiagnostics } from '../components/StudioDiagnostics';

interface StudioShellProps {
  coordinator: StudioCoordinator;
  onExit?: () => void;
}

export const StudioShell: React.FC<StudioShellProps> = ({ coordinator, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [, setTick] = useState(0);

  // Attach canvas to renderer host
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      coordinator.renderer.attach(canvas);
      coordinator.renderer.start();
    }
    return () => {
      coordinator.renderer.dispose();
    };
  }, [coordinator]);

  const forceUpdate = () => setTick((t) => t + 1);

  const { sessionState } = coordinator;
  const selectedState = sessionState.selectedStateId
    ? coordinator.sceneEngine.registry.get(sessionState.selectedStateId)
    : undefined;

  const connectedRelationships = sessionState.selectedStateId
    ? coordinator.graphEngine.registry.getBySource(sessionState.selectedStateId)
    : [];

  const selectedCluster = sessionState.selectedStateId
    ? coordinator.clusterEngine.registry.getByState(sessionState.selectedStateId)[0]
    : undefined;

  const selectedCoord = sessionState.selectedStateId
    ? coordinator.dimensionEngine.getCoordinate(sessionState.selectedStateId)
    : undefined;

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden flex flex-col font-mono select-none">
      {/* Top Studio Header */}
      <StudioHeader
        activeDimension={sessionState.activeDimension}
        onSwitchDimension={(d) => {
          coordinator.switchDimension(d);
          forceUpdate();
        }}
        activePanel={sessionState.activePanel}
        onSelectPanel={(p) => {
          sessionState.activePanel = p;
          forceUpdate();
        }}
        moreOptionsOpen={sessionState.moreOptionsOpen}
        onToggleMoreOptions={() => {
          sessionState.moreOptionsOpen = !sessionState.moreOptionsOpen;
          forceUpdate();
        }}
        onResetView={() => {
          coordinator.resetStudio();
          forceUpdate();
        }}
        onOpenDiagnostics={() => {
          sessionState.diagnosticsOpen = true;
          forceUpdate();
        }}
        onSearch={async (q) => {
          await coordinator.searchAndSelect(q);
          sessionState.activePanel = 'INFORMATION';
          forceUpdate();
        }}
        onApplyPreset={(preset) => {
          coordinator.applyCameraPreset(preset);
          forceUpdate();
        }}
      />

      {/* Main Studio Viewport & Side Panels */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Side Panel (Database or Coordinates) */}
        {sessionState.activePanel === 'DATABASE' && (
          <DatabasePanel
            dataProvider={coordinator.dataProvider}
            selectedStateId={sessionState.selectedStateId}
            onSelectState={(id) => {
              coordinator.selectState(id);
              forceUpdate();
            }}
          />
        )}

        {sessionState.activePanel === 'COORDINATE' && (
          <CoordinatePanel
            activeDimension={sessionState.activeDimension}
            projectionMode={sessionState.projectionMode}
            selectedCoordinate={selectedCoord}
          />
        )}

        {/* Central 3D Canvas Viewport */}
        <div className="relative flex-1 h-full bg-[#070709]">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Floating Camera Preset Dock */}
          <StudioToolbar
            currentPreset={sessionState.cameraPreset}
            onApplyPreset={(preset) => {
              coordinator.applyCameraPreset(preset);
              forceUpdate();
            }}
            onResetCamera={() => {
              coordinator.cameraEngine.navigation.resetCamera(coordinator.cameraEngine.state);
              forceUpdate();
            }}
          />
        </div>

        {/* Right Side Panel (Information, Graph, Cluster, or Chat) */}
        {sessionState.activePanel === 'INFORMATION' && (
          <InformationPanel
            selectedState={selectedState as any}
            onClose={() => {
              sessionState.activePanel = 'NONE';
              forceUpdate();
            }}
          />
        )}

        {sessionState.activePanel === 'GRAPH' && (
          <GraphPanel
            relationships={connectedRelationships}
            onSelectTargetState={(id) => {
              coordinator.selectState(id);
              forceUpdate();
            }}
          />
        )}

        {sessionState.activePanel === 'CLUSTER' && (
          <ClusterPanel
            cluster={selectedCluster}
            onSelectMemberState={(id) => {
              coordinator.selectState(id);
              forceUpdate();
            }}
          />
        )}

        {sessionState.activePanel === 'CHAT' && (
          <ChatPanel
            modelRegistry={coordinator.modelRegistry}
            selectedModelId={sessionState.selectedModelId}
            onSelectModel={(mId) => {
              sessionState.selectedModelId = mId;
              forceUpdate();
            }}
            aiContext={coordinator.getSelectedAIContext()}
          />
        )}
      </div>

      {/* Diagnostics Modal Overlay */}
      {sessionState.diagnosticsOpen && (
        <StudioDiagnostics
          coordinator={coordinator}
          onClose={() => {
            sessionState.diagnosticsOpen = false;
            forceUpdate();
          }}
        />
      )}
    </div>
  );
};
