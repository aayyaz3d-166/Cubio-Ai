/**
 * 3D Memory Studio — Funnel 57
 * Component: GeometryQualityControl
 *
 * Quality level / LOD selector dock.
 */

import React from 'react';
import { GeometryQualityLevel } from '../types';

interface GeometryQualityControlProps {
  currentQuality: GeometryQualityLevel;
  onSelectQuality: (q: GeometryQualityLevel) => void;
}

const QUALITY_OPTIONS: GeometryQualityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'AUTO'];

export const GeometryQualityControl: React.FC<GeometryQualityControlProps> = ({
  currentQuality,
  onSelectQuality,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        Geometry LOD & Detail
      </div>

      <div className="flex items-center gap-1.5">
        {QUALITY_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelectQuality(opt)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
              currentQuality === opt
                ? 'bg-cyan-500 text-black shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
