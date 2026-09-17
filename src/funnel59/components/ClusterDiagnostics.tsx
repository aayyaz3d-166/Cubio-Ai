/**
 * 3D Memory Studio — Funnel 59
 * Component: ClusterDiagnostics
 *
 * Glass HUD overlay displaying active 3D cluster telemetry.
 */

import React from 'react';
import { ClusterEngineStats } from '../types';
import { Layers, Compass, Network, Activity } from 'lucide-react';

interface ClusterDiagnosticsProps {
  stats: ClusterEngineStats;
}

export const ClusterDiagnostics: React.FC<ClusterDiagnosticsProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-fuchsia-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>3D CLUSTER ENGINE</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800 font-bold">
          F59
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Dimension:</span>
          <span className="text-fuchsia-400 font-bold">
            Z{stats.activeDimension} {stats.isComputationalProjection ? '(PROJECTION)' : '(SPATIAL)'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Layout Mode:</span>
          <span className="text-cyan-400 font-bold">{stats.layoutMode}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Clusters:</span>
          <span className="text-white font-bold">{stats.visibleClusters} / {stats.totalClusters}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Total Members:</span>
          <span className="text-emerald-400 font-bold">{stats.totalMembers}</span>
        </div>

        <div className="border-t border-zinc-800/80 pt-1 mt-1 space-y-0.5 text-[10px]">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Internal Edges:</span>
            <span className="text-sky-300">{stats.internalEdges}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">External Edges:</span>
            <span className="text-amber-300">{stats.externalEdges}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
