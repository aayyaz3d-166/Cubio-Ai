/**
 * 3D Memory Studio — Funnel 77
 * Component: ViewportOverlay
 */

import React from 'react';
import { CameraPreset, ViewportControlsState } from '../types';
import { Compass, RotateCcw, Maximize2, Grid, Axis3d } from 'lucide-react';

interface ViewportOverlayProps {
  controls: ViewportControlsState;
  onPreset: (preset: CameraPreset) => void;
  onToggleAxes: () => void;
  onToggleGrid: () => void;
}

export const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  controls,
  onPreset,
  onToggleAxes,
  onToggleGrid,
}) => {
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 font-mono text-[11px] select-none">
      {/* View Presets */}
      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-xs border border-zinc-800 p-1 rounded-xl shadow-lg">
        {(['TOP', 'FRONT', 'SIDE', 'ISOMETRIC'] as CameraPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => onPreset(preset)}
            className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
              controls.activePreset === preset
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {preset}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />

        <button
          onClick={() => onPreset('FIT')}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
          title="Fit Scene"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPreset('RESET')}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
          title="Reset Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid & Axis Toggles */}
      <div className="self-end flex items-center gap-1 bg-black/70 backdrop-blur-xs border border-zinc-800 p-1 rounded-xl shadow-lg">
        <button
          onClick={onToggleAxes}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
            controls.showAxes
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle 3D Axes"
        >
          <Axis3d className="w-3.5 h-3.5" />
          <span>AXES</span>
        </button>

        <button
          onClick={onToggleGrid}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
            controls.showGrid
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Reference Grid"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>GRID</span>
        </button>
      </div>
    </div>
  );
};
