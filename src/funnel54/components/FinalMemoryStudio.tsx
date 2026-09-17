/**
 * 3D Memory Studio — Funnel 54
 * Component: FinalMemoryStudio
 *
 * Master Final 3D Memory Studio container coordinating advanced spatial rendering,
 * depth fields, focus modes, auto-framing, search synchronization, and controls.
 */

import React, { useEffect } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { useAdvancedCamera } from '../hooks/useAdvancedCamera';
import { useFinalStudio } from '../hooks/useFinalStudio';
import { AdvancedMemoryCore } from './AdvancedMemoryCore';
import { AdvancedStateLayer } from './AdvancedStateLayer';
import { AdvancedRelationshipLayer } from './AdvancedRelationshipLayer';
import { AdvancedClusterLayer } from './AdvancedClusterLayer';
import { DepthField } from './DepthField';
import { FinalProjectionIndicator } from './FinalProjectionIndicator';
import { FinalStateInspector } from './FinalStateInspector';
import { FinalStudioTelemetry } from './FinalStudioTelemetry';
import { FinalStudioControls } from './FinalStudioControls';
import { StudioSearch } from '../../funnel53/components/StudioSearch';
import { SimulationDimension } from '../../funnel52/types';

interface FinalMemoryStudioProps {
  sourceStates?: readonly DimensionalInformationState[];
  onExitToClassicStudio?: () => void;
  initialReducedMotion?: boolean;
}

export const FinalMemoryStudio: React.FC<FinalMemoryStudioProps> = ({
  sourceStates,
  onExitToClassicStudio,
  initialReducedMotion = false,
}) => {
  const {
    camera,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetCamera,
    focusOnNode,
    focusOnCluster,
    autoFrameDimension,
  } = useAdvancedCamera();

  const {
    sceneModel,
    engine,
    setHoveredNodeId,
    presentationMode,
    setPresentationMode,
    focusedClusterId,
    setFocusedClusterId,
    prefersReducedMotion,
  } = useFinalStudio(sourceStates, camera, 'SPACE', initialReducedMotion);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (sceneModel.isPaused) engine.resume();
        else engine.pause();
      } else if (e.key === 'r' || e.key === 'R') {
        engine.restart();
        resetCamera();
      } else if (e.key === 'Escape') {
        engine.selectState(null);
        setFocusedClusterId(null);
      } else if (e.key === 'f' || e.key === 'F') {
        setPresentationMode((prev) => (prev === 'FOCUS' ? 'SPACE' : 'FOCUS'));
      } else if (e.key === '1') {
        engine.setDimension(1 as SimulationDimension);
        autoFrameDimension(1);
      } else if (e.key === '2') {
        engine.setDimension(2 as SimulationDimension);
        autoFrameDimension(2);
      } else if (e.key === '3') {
        engine.setDimension(3 as SimulationDimension);
        autoFrameDimension(3);
      } else if (e.key === '4') {
        engine.setDimension(4 as SimulationDimension);
        autoFrameDimension(4);
      } else if (e.key === '8') {
        engine.setDimension(8 as SimulationDimension);
        autoFrameDimension(8);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sceneModel.isPaused, engine, resetCamera, autoFrameDimension, setFocusedClusterId, setPresentationMode]);

  return (
    <div className="relative w-screen h-screen bg-[#070709] text-zinc-200 select-none overflow-hidden font-mono">
      {/* Top Bar: Search on Left, Telemetry on Right */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <StudioSearch
            searchQuery={sceneModel.searchQuery}
            onSearchChange={(q) => engine.setSearchQuery(q)}
          />
        </div>

        <div className="pointer-events-auto">
          <FinalStudioTelemetry telemetry={sceneModel.telemetry} />
        </div>
      </div>

      {/* Projection Mode Indicator Card */}
      <FinalProjectionIndicator projection={sceneModel.projection} />

      {/* Main 3D Spatial Canvas Viewport */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={() => {
          engine.selectState(null);
          setFocusedClusterId(null);
        }}
        className={`relative w-full h-full bg-[#070709] overflow-hidden select-none font-mono ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Ambient Depth & Particle Field */}
        <DepthField
          particles={sceneModel.particles}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Semantic Clusters Layer */}
        <AdvancedClusterLayer
          clusters={sceneModel.clusters}
          onSelectCluster={(cId) => {
            setFocusedClusterId(cId === focusedClusterId ? null : cId);
            const cluster = sceneModel.clusters.find((c) => c.clusterId === cId);
            if (cluster) focusOnCluster(cluster);
          }}
        />

        {/* Relational Graph Lines Layer */}
        <AdvancedRelationshipLayer edges={sceneModel.edges} />

        {/* Central Computational Memory Core */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AdvancedMemoryCore
            core={sceneModel.core}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>

        {/* Interactive Information State Nodes Layer */}
        <AdvancedStateLayer
          nodes={sceneModel.nodes}
          onSelectNode={(id) => {
            engine.selectState(id);
            const target = sceneModel.nodes.find((n) => n.stateId === id);
            if (target) focusOnNode(target);
          }}
          onHoverNode={(id) => setHoveredNodeId(id)}
        />
      </div>

      {/* Floating State Inspector */}
      <FinalStateInspector
        selectedNode={sceneModel.selectedNode}
        onClose={() => engine.selectState(null)}
      />

      {/* Bottom Control Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <FinalStudioControls
            isPaused={sceneModel.isPaused}
            speed={sceneModel.speed}
            activeDimension={sceneModel.activeDimension}
            activeFilter={sceneModel.activeFilter}
            presentationMode={presentationMode}
            onTogglePause={() => {
              if (sceneModel.isPaused) engine.resume();
              else engine.pause();
            }}
            onRestart={() => {
              engine.restart();
              resetCamera();
            }}
            onResetCamera={resetCamera}
            onSetSpeed={(s) => engine.setSpeed(s)}
            onSelectDimension={(dim) => {
              engine.setDimension(dim);
              autoFrameDimension(dim);
            }}
            onSetFilter={(f) => engine.setFilter(f)}
            onSetPresentationMode={(m) => setPresentationMode(m)}
          />
        </div>
      </div>
    </div>
  );
};
