/**
 * 3D Memory Studio — Funnel 60
 * Component: DimensionDiagnostics
 *
 * Glass HUD overlay displaying active 3D dimension and projection telemetry.
 */

import React from 'react';
import { DimensionEngineStats } from '../types';
import { Box, Compass, Sparkles, Activity } from 'lucide-react';

interface DimensionDiagnosticsProps {
  stats: DimensionEngineStats;
}

export const DimensionDiagnostics: React.FC<DimensionDiagnosticsProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-amber-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>3D DIMENSION ENGINE</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
          F60
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Dimension:</span>
          <span className="text-amber-400 font-bold">
            {stats.activeDimensionId} ({stats.isPhysicalSpatial ? 'ACTUAL 3D SPATIAL' : 'COMPUTATIONAL PROJECTION'})
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Projection Mode:</span>
          <span className="text-cyan-400 font-bold">{stats.projectionType}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Projected States:</span>
          <span className="text-emerald-400 font-bold">{stats.projectedStatesCount}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Supported Dims:</span>
          <span className="text-zinc-300 font-bold">{stats.totalSupportedDimensions} (Z1..Z16)</span>
        </div>
      </div>
    </div>
  );
};
