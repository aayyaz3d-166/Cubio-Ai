/**
 * 3D Memory Studio — Funnel 61
 * Component: CameraPresetControls
 *
 * Camera presets toolbar (DEFAULT, TOP, FRONT, SIDE, CORE, CLUSTER, GRAPH, DIMENSION).
 */

import React from 'react';
import { CameraPresetType } from '../types';
import { Compass, RotateCcw } from 'lucide-react';

interface CameraPresetControlsProps {
  currentPreset: CameraPresetType | 'CUSTOM';
  onApplyPreset: (preset: CameraPresetType) => void;
  onReset: () => void;
}

const PRESETS: CameraPresetType[] = [
  'DEFAULT',
  'TOP',
  'FRONT',
  'SIDE',
  'CORE',
  'CLUSTER',
  'GRAPH',
  'DIMENSION',
];

export const CameraPresetControls: React.FC<CameraPresetControlsProps> = ({
  currentPreset,
  onApplyPreset,
  onReset,
}) => {
  return (
    <div className="absolute top-4 right-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera Presets</span>
        </span>
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>RESET</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((p) => {
          const active = currentPreset === p;
          return (
            <button
              key={p}
              onClick={() => onApplyPreset(p)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer text-left ${
                active
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
};
