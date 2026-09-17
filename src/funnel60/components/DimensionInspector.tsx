/**
 * 3D Memory Studio — Funnel 60
 * Component: DimensionInspector
 *
 * Side drawer inspecting details of active dimension and projection metrics.
 */

import React from 'react';
import { DimensionEngineStats } from '../types';
import { Box, Sparkles, ShieldCheck } from 'lucide-react';

interface DimensionInspectorProps {
  stats: DimensionEngineStats;
  onClose: () => void;
}

export const DimensionInspector: React.FC<DimensionInspectorProps> = ({
  stats,
  onClose,
}) => {
  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-[#111114]/95 backdrop-blur-md border border-amber-900/60 rounded-xl p-3.5 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>DIMENSION INSPECTOR</span>
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div>
          <div className="text-[10px] text-zinc-500">DIMENSION LEVEL</div>
          <div className="text-amber-300 font-bold text-sm">
            {stats.activeDimensionId} ({stats.activeDimension}D)
          </div>
        </div>

        <div className="bg-[#18181c] p-2 rounded border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500">SPATIAL STATUS</div>
          <div className={`font-bold ${stats.isPhysicalSpatial ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stats.isPhysicalSpatial ? 'ACTUAL 3D SPATIAL MODE' : 'COMPUTATIONAL PROJECTION'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-zinc-500">PROJECTION:</span>{' '}
            <span className="text-white font-bold">{stats.projectionType}</span>
          </div>
          <div>
            <span className="text-zinc-500">STATES:</span>{' '}
            <span className="text-emerald-400 font-bold">{stats.projectedStatesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
