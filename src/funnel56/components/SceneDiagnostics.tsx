/**
 * 3D Memory Studio — Funnel 56
 * Component: SceneDiagnostics
 *
 * Minimal glass diagnostic HUD for Scene Engine hierarchy, object counts, and lifecycle.
 */

import React from 'react';
import { SceneEngineStats } from '../types';
import { Network, Layers, ShieldCheck, Activity, Box } from 'lucide-react';

interface SceneDiagnosticsProps {
  stats: SceneEngineStats;
}

export const SceneDiagnostics: React.FC<SceneDiagnosticsProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-cyan-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D SCENE ENGINE</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
          F56
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Lifecycle State:</span>
          <span className="text-emerald-400 font-bold">{stats.lifecycleState}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Dimension:</span>
          <span className="text-cyan-400 font-bold">
            Z{stats.activeDimension} {stats.activeDimension > 3 ? '(PROJECTION)' : '(SPATIAL)'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Total Scene Objects:</span>
          <span className="text-white font-bold">{stats.totalObjects} / 150</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Visible States:</span>
          <span className="text-emerald-400 font-bold">{stats.visibleStates} / 50</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Visible Relationships:</span>
          <span className="text-sky-400 font-bold">{stats.visibleRelationships} / 100</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Clusters:</span>
          <span className="text-purple-300 font-bold">{stats.totalClusters}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Search Highlights:</span>
          <span className="text-amber-400 font-bold">{stats.highlightedCount}</span>
        </div>
      </div>
    </div>
  );
};
