/**
 * 3D Memory Studio — Funnel 53
 * Component: MemoryStudio
 *
 * Master 3D Memory Studio UI container.
 */

import React, { useEffect } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { useStudioCamera } from '../hooks/useStudioCamera';
import { useStudioRenderer } from '../hooks/useStudioRenderer';
import { DimensionSpace } from './DimensionSpace';
import { StudioSearch } from './StudioSearch';
import { StudioTelemetry } from './StudioTelemetry';
import { StudioControls } from './StudioControls';
import { StateInspector } from './StateInspector';
import { ProjectionIndicator } from './ProjectionIndicator';
import { SimulationDimension } from '../../funnel52/types';

interface MemoryStudioProps {
  sourceStates?: readonly DimensionalInformationState[];
  onExitToClassicStudio?: () => void;
}

export const MemoryStudio: React.FC<MemoryStudioProps> = ({
  sourceStates,
  onExitToClassicStudio,
}) => {
  const {
    camera,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetCamera,
  } = useStudioCamera();

  const { viewModel, engine, setHoveredNodeId } = useStudioRenderer(sourceStates, camera);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (viewModel.isPaused) engine.resume();
        else engine.pause();
      } else if (e.key === 'r' || e.key === 'R') {
        engine.restart();
        resetCamera();
      } else if (e.key === 'Escape') {
        engine.selectState(null);
      } else if (e.key === '1') {
        engine.setDimension(1 as SimulationDimension);
      } else if (e.key === '2') {
        engine.setDimension(2 as SimulationDimension);
      } else if (e.key === '3') {
        engine.setDimension(3 as SimulationDimension);
      } else if (e.key === '4') {
        engine.setDimension(4 as SimulationDimension);
      } else if (e.key === '8') {
        engine.setDimension(8 as SimulationDimension);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewModel.isPaused, engine, resetCamera]);

  return (
    <div className="relative w-screen h-screen bg-[#070709] text-zinc-200 select-none overflow-hidden font-mono">
      {/* Top Bar: Search on Left, Telemetry on Right */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <StudioSearch
            searchQuery={viewModel.searchQuery}
            onSearchChange={(q) => engine.setSearchQuery(q)}
          />
        </div>

        <div className="pointer-events-auto">
          <StudioTelemetry telemetry={viewModel.telemetry} />
        </div>
      </div>

      {/* Projection Mode Indicator Card */}
      <ProjectionIndicator projection={viewModel.projection} />

      {/* Main 3D Spatial Canvas */}
      <DimensionSpace
        viewModel={viewModel}
        isDragging={isDragging}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onSelectNode={(id) => engine.selectState(id)}
        onHoverNode={(id) => setHoveredNodeId(id)}
      />

      {/* Floating State Inspector */}
      <StateInspector
        selectedNode={viewModel.selectedNode}
        onClose={() => engine.selectState(null)}
      />

      {/* Bottom Control Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <StudioControls
            isPaused={viewModel.isPaused}
            speed={viewModel.speed}
            activeDimension={viewModel.activeDimension}
            activeFilter={viewModel.activeFilter}
            onTogglePause={() => {
              if (viewModel.isPaused) engine.resume();
              else engine.pause();
            }}
            onRestart={() => engine.restart()}
            onResetCamera={resetCamera}
            onSetSpeed={(s) => engine.setSpeed(s)}
            onSelectDimension={(dim) => engine.setDimension(dim)}
            onSetFilter={(f) => engine.setFilter(f)}
          />
        </div>
      </div>
    </div>
  );
};
