/**
 * 3D Memory Studio — Funnel 58
 * Component: GraphDiagnostics
 *
 * Glass HUD overlay displaying active 3D graph telemetry.
 */

import React from 'react';
import { GraphEngineStats } from '../types';
import { Network, GitBranch, Layers, ShieldCheck, Activity } from 'lucide-react';

interface GraphDiagnosticsProps {
  stats: GraphEngineStats;
}

export const GraphDiagnostics: React.FC<GraphDiagnosticsProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-teal-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-teal-400" />
          <span>3D RELATIONSHIP GRAPH</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800 font-bold">
          F58
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Dimension:</span>
          <span className="text-teal-400 font-bold">
            Z{stats.activeDimension} {stats.isComputationalProjection ? '(PROJECTION)' : '(SPATIAL)'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Graph Nodes:</span>
          <span className="text-white font-bold">{stats.visibleNodes} / {stats.totalNodes}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Visible Edges:</span>
          <span className="text-cyan-400 font-bold">{stats.visibleEdges} / {stats.totalRelationships}</span>
        </div>

        <div className="border-t border-zinc-800/80 pt-1 mt-1 space-y-0.5 text-[10px]">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Semantic:</span>
            <span className="text-sky-300">{stats.semanticCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Category:</span>
            <span className="text-emerald-300">{stats.categoryCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Domain:</span>
            <span className="text-purple-300">{stats.domainCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
