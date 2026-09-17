/**
 * 3D Memory Studio — Funnel 59
 * Component: ClusterInspector
 *
 * Side drawer inspecting details of selected cluster.
 */

import React from 'react';
import { Cluster } from '../types';
import { Layers, ShieldCheck, Activity, Network } from 'lucide-react';

interface ClusterInspectorProps {
  cluster: Cluster | null;
  onClose: () => void;
}

export const ClusterInspector: React.FC<ClusterInspectorProps> = ({
  cluster,
  onClose,
}) => {
  if (!cluster) return null;

  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-[#111114]/95 backdrop-blur-md border border-fuchsia-900/60 rounded-xl p-3.5 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>CLUSTER INSPECTOR</span>
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
          <div className="text-[10px] text-zinc-500">CLUSTER ID / NAME</div>
          <div className="text-fuchsia-300 font-bold truncate">{cluster.name}</div>
          <div className="text-[9px] text-zinc-500 truncate">{cluster.clusterId}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#18181c] p-2 rounded border border-zinc-800">
          <div>
            <span className="text-zinc-500">TYPE:</span>{' '}
            <span className="text-white font-bold">{cluster.clusterType}</span>
          </div>
          <div>
            <span className="text-zinc-500">MEMBERS:</span>{' '}
            <span className="text-emerald-400 font-bold">{cluster.memberStateIds.length}</span>
          </div>
          <div>
            <span className="text-zinc-500">RADIUS:</span>{' '}
            <span className="text-cyan-400 font-bold">{cluster.radius}</span>
          </div>
          <div>
            <span className="text-zinc-500">STATUS:</span>{' '}
            <span className="text-emerald-400 font-bold">{cluster.classification}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500">GRAPH METRICS</div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500 text-[9px]">Internal Edges</div>
              <div className="text-sky-400 font-bold">{cluster.metrics.internalEdgeCount}</div>
            </div>
            <div className="bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500 text-[9px]">Density</div>
              <div className="text-emerald-400 font-bold">{(cluster.metrics.density * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-500 mb-0.5">CENTER COORDINATES</div>
          <div className="text-[10px] text-zinc-400 bg-black/40 p-1.5 rounded">
            [{cluster.center[0]}, {cluster.center[1]}, {cluster.center[2]}]
          </div>
        </div>
      </div>
    </div>
  );
};
