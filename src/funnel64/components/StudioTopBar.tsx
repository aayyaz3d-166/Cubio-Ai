/**
 * 3D Memory Studio — Funnel 64
 * Component: StudioTopBar
 *
 * Minimal top application bar for the 3D Studio workspace.
 */

import React from 'react';
import { SimulationDimension } from '../../funnel52/types';
import { WorkspaceLayoutType } from '../types';
import { Box, Compass, Layout, Activity, RotateCcw, Sparkles } from 'lucide-react';

interface StudioTopBarProps {
  activeDimension: SimulationDimension;
  onSwitchDimension: (dim: SimulationDimension) => void;
  layout: WorkspaceLayoutType;
  onSwitchLayout: (layout: WorkspaceLayoutType) => void;
  onResetWorkspace: () => void;
  onOpenDiagnostics: () => void;
}

const DIMS: SimulationDimension[] = [1, 2, 3, 4, 8, 12, 16];

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  activeDimension,
  onSwitchDimension,
  layout,
  onSwitchLayout,
  onResetWorkspace,
  onOpenDiagnostics,
}) => {
  return (
    <header className="h-14 bg-[#0d0d10]/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-40 select-none font-mono text-zinc-300">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Box className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="font-extrabold text-white text-xs tracking-wider">
            3D MEMORY STUDIO
          </div>
          <div className="text-[9px] text-zinc-500">
            {activeDimension === 3 ? 'ACTUAL 3D SPATIAL WORKSPACE' : `Z${activeDimension} COMPUTATIONAL PROJECTION`}
          </div>
        </div>
      </div>

      {/* Center Layout Toggles */}
      <div className="hidden md:flex items-center gap-1 bg-[#18181c] border border-zinc-800 p-1 rounded-lg text-[10px]">
        <span className="text-zinc-500 px-1 font-bold">LAYOUT:</span>
        {(['SIDEBAR', 'SPLIT', 'THREE_COLUMN', 'FULL'] as WorkspaceLayoutType[]).map((l) => (
          <button
            key={l}
            onClick={() => onSwitchLayout(l)}
            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
              layout === l ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Dimension selector */}
        <div className="flex items-center gap-1 bg-[#18181c] border border-zinc-800 p-1 rounded-lg text-[10px]">
          <span className="text-zinc-500 px-1 font-bold">DIM:</span>
          {DIMS.map((d) => (
            <button
              key={d}
              onClick={() => onSwitchDimension(d)}
              className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                activeDimension === d ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Z{d}
            </button>
          ))}
        </div>

        {/* Reset View */}
        <button
          onClick={onResetWorkspace}
          className="p-2 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Reset Workspace"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="p-2 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-zinc-800 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
          title="System Diagnostics"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
