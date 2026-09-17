/**
 * 3D Memory Studio — Funnel 60
 * Component: DimensionViewport
 *
 * Primary testing viewport for the 3D Dimension & Projection Engine.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useDimensionEngine } from '../hooks/useDimensionEngine';
import { DimensionDiagnostics } from './DimensionDiagnostics';
import { DimensionInspector } from './DimensionInspector';
import { ProjectionControls } from './ProjectionControls';

interface DimensionViewportProps {
  onExit?: () => void;
}

export const DimensionViewport: React.FC<DimensionViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { dimEngine, renderer, stats, switchDimension } = useDimensionEngine();
  const [showInspector, setShowInspector] = useState(true);

  // Attach canvas to renderer host
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      renderer.attach(canvas);
      renderer.start();
    }
    return () => {
      renderer.dispose();
    };
  }, [renderer]);

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden select-none font-mono">
      {/* Top Diagnostics HUD */}
      <DimensionDiagnostics stats={stats} />

      {/* Exit Button */}
      {onExit && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT DIMENSION ENGINE
          </button>
        </div>
      )}

      {/* Dimension Inspector Drawer */}
      {showInspector && (
        <DimensionInspector
          stats={stats}
          onClose={() => setShowInspector(false)}
        />
      )}

      {/* Projection Controls */}
      <ProjectionControls
        currentDimension={stats.activeDimension}
        currentProjection={stats.projectionType}
        onSwitchDimension={switchDimension}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
