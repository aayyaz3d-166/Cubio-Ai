/**
 * 3D Memory Studio — Funnel 62
 * Component: StudioToolbar
 *
 * Bottom floating dock for camera presets and viewport adjustments.
 */

import React from 'react';
import { CameraPresetType } from '../../funnel61/types';
import { Video, RotateCcw } from 'lucide-react';

interface StudioToolbarProps {
  currentPreset: CameraPresetType | 'CUSTOM';
  onApplyPreset: (preset: CameraPresetType) => void;
  onResetCamera: () => void;
}

const PRESETS: CameraPresetType[] = [
  'DEFAULT',
  'TOP',
  'FRONT',
  'SIDE',
  'CORE',
  'CLUSTER',
  'GRAPH',
];

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  currentPreset,
  onApplyPreset,
  onResetCamera,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#111114]/90 backdrop-blur-md border border-zinc-800 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl font-mono select-none">
      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold px-1">
        <Video className="w-3.5 h-3.5 text-cyan-400" />
        <span>VIEW:</span>
      </div>

      <div className="flex items-center gap-1">
        {PRESETS.map((p) => {
          const active = currentPreset === p;
          return (
            <button
              key={p}
              onClick={() => onApplyPreset(p)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-cyan-500 text-black font-extrabold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-zinc-800 mx-1" />

      <button
        onClick={onResetCamera}
        className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        title="Reset Camera"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
