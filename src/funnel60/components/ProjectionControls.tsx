/**
 * 3D Memory Studio — Funnel 60
 * Component: ProjectionControls
 *
 * Dimension level & Projection algorithm selector dock.
 */

import React from 'react';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType } from '../types';
import { Sparkles, Layers } from 'lucide-react';

interface ProjectionControlsProps {
  currentDimension: SimulationDimension;
  currentProjection: ProjectionType;
  onSwitchDimension: (dim: SimulationDimension, proj?: ProjectionType) => void;
}

const DIMS: SimulationDimension[] = [1, 2, 3, 4, 8, 12, 16];
const PROJS: ProjectionType[] = [
  'DIRECT',
  'RADIAL',
  'ORTHOGRAPHIC',
  'LAYER',
  'PAIRWISE',
  'AXIS_SLICING',
  'CLAMPED',
];

export const ProjectionControls: React.FC<ProjectionControlsProps> = ({
  currentDimension,
  currentProjection,
  onSwitchDimension,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Dimension Level (Z1 .. Z16)</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {DIMS.map((dim) => {
          const active = currentDimension === dim;
          return (
            <button
              key={dim}
              onClick={() => onSwitchDimension(dim, currentProjection)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Z{dim}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/80">
        <span className="text-[10px] text-zinc-500 mr-1">Projection:</span>
        <div className="flex flex-wrap gap-1">
          {PROJS.map((proj) => (
            <button
              key={proj}
              onClick={() => onSwitchDimension(currentDimension, proj)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                currentProjection === proj
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {proj}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
