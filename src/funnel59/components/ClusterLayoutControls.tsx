/**
 * 3D Memory Studio — Funnel 59
 * Component: ClusterLayoutControls
 *
 * Layout mode selector and spatial control dock.
 */

import React from 'react';
import { ClusterLayoutMode } from '../types';
import { Compass } from 'lucide-react';

interface ClusterLayoutControlsProps {
  currentMode: ClusterLayoutMode;
  onChangeMode: (mode: ClusterLayoutMode) => void;
}

const MODES: ClusterLayoutMode[] = [
  'RADIAL',
  'GRID',
  'ORBITAL',
  'HIERARCHICAL',
  'DOMAIN_RADIAL',
];

export const ClusterLayoutControls: React.FC<ClusterLayoutControlsProps> = ({
  currentMode,
  onChangeMode,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <Compass className="w-3.5 h-3.5 text-fuchsia-400" />
        <span>Spatial Organization Layout</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {MODES.map((mode) => {
          const active = currentMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onChangeMode(mode)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/50'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
};
