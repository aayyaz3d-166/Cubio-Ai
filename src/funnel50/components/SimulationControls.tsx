/**
 * 3D Memory Studio — Funnel 50
 * Component: SimulationControls
 *
 * Camera control buttons ([RESET VIEW], [CENTER UNIVERSE], [FOCUS STATE], [ZOOM CLUSTER],
 * plus keyboard WASD navigation helper hints).
 */

import React from 'react';
import { RotateCcw, Crosshair, ZoomIn, ZoomOut, Compass, Move } from 'lucide-react';

interface SimulationControlsProps {
  onResetView: () => void;
  onCenterUniverse: () => void;
  onFocusState: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  hasSelectedState: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  onResetView,
  onCenterUniverse,
  onFocusState,
  onZoomIn,
  onZoomOut,
  hasSelectedState,
}) => {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#111113]/90 backdrop-blur-md border border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-mono select-none shadow-2xl z-20 flex items-center gap-2 pointer-events-auto">
      <button
        onClick={onResetView}
        className="px-2.5 py-1 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-semibold transition flex items-center gap-1"
        title="Reset Camera (R)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset (R)</span>
      </button>

      <button
        onClick={onCenterUniverse}
        className="px-2.5 py-1 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-semibold transition flex items-center gap-1"
        title="Center Universe Origin"
      >
        <Crosshair className="w-3.5 h-3.5" />
        <span>Center</span>
      </button>

      <button
        onClick={onFocusState}
        disabled={!hasSelectedState}
        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded text-[11px] font-bold transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Focus Selected State"
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Focus State</span>
      </button>

      <div className="h-4 w-px bg-zinc-800" />

      <button
        onClick={onZoomIn}
        className="p-1 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded text-xs"
        title="Zoom In (+)"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onZoomOut}
        className="p-1 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded text-xs"
        title="Zoom Out (-)"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <div className="hidden lg:flex items-center gap-1.5 pl-2 text-[10px] text-zinc-500 border-l border-zinc-800">
        <Move className="w-3 h-3 text-zinc-400" />
        <span>WASD: Orbit • Drag: Pan • Scroll: Zoom</span>
      </div>
    </div>
  );
};
