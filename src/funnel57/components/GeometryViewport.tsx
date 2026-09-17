/**
 * 3D Memory Studio — Funnel 57
 * Component: GeometryViewport
 *
 * Primary testing viewport for the 3D Geometry & Material Engine.
 */

import React, { useRef, useEffect } from 'react';
import { useGeometryEngine } from '../hooks/useGeometryEngine';
import { GeometryDiagnostics } from './GeometryDiagnostics';
import { GeometryQualityControl } from './GeometryQualityControl';

interface GeometryViewportProps {
  onExit?: () => void;
}

export const GeometryViewport: React.FC<GeometryViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { renderer, stats, qualityLevel, setQualityLevel } = useGeometryEngine();

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
      <GeometryDiagnostics stats={stats} />

      {/* Exit Button */}
      {onExit && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT GEOMETRY ENGINE
          </button>
        </div>
      )}

      {/* LOD & Quality Controls */}
      <GeometryQualityControl
        currentQuality={qualityLevel}
        onSelectQuality={setQualityLevel}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
