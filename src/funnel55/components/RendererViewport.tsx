/**
 * 3D Memory Studio — Funnel 55
 * Component: RendererViewport
 *
 * Primary 3D Canvas Viewport mounting MemoryRendererHost and diagnostics HUD.
 */

import React, { useEffect } from 'react';
import { useRenderer } from '../hooks/useRenderer';
import { RendererDiagnostics } from './RendererDiagnostics';
import { DimensionalInformationState } from '../../funnel49/types';
import { populateSceneWithGreenStates } from '../adapters/upstreamRendererAdapter';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';

interface RendererViewportProps {
  sourceStates?: readonly DimensionalInformationState[];
  onExit?: () => void;
}

export const RendererViewport: React.FC<RendererViewportProps> = ({
  sourceStates,
  onExit,
}) => {
  const { canvasRef, host, stats } = useRenderer();

  // Populate scene with authorized GREEN states
  useEffect(() => {
    const states = sourceStates || getStandardInformationUniverseFixture().states;
    populateSceneWithGreenStates(host.scene, states);
  }, [host, sourceStates]);

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden select-none font-mono">
      {/* Diagnostics HUD */}
      <RendererDiagnostics
        stats={stats}
        capabilities={host.capabilities}
      />

      {/* Exit Button */}
      {onExit && (
        <button
          onClick={onExit}
          className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
        >
          EXIT RENDERER
        </button>
      )}

      {/* Actual HTML Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
