/**
 * 3D Memory Studio — Funnel 62
 * Component: ClusterPanel
 *
 * Displays spatial cluster details from F59 Cluster Engine.
 */

import React from 'react';
import { Cluster } from '../../funnel59/types';
import { Layers } from 'lucide-react';

interface ClusterPanelProps {
  cluster?: Cluster;
  onSelectMemberState?: (stateId: string) => void;
}

export const ClusterPanel: React.FC<ClusterPanelProps> = ({
  cluster,
  onSelectMemberState,
}) => {
  if (!cluster) {
    return (
      <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 p-4 font-mono text-zinc-400 text-xs flex flex-col items-center justify-center select-none">
        <Layers className="w-8 h-8 text-zinc-600 mb-2" />
        <div>No cluster selected.</div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 flex flex-col font-mono text-zinc-300 select-none p-3 space-y-3">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
        <span className="font-bold text-xs text-white flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>CLUSTER METRICS</span>
        </span>
        <span className="text-[10px] text-fuchsia-400 bg-fuchsia-950 px-1.5 py-0.5 rounded border border-fuchsia-800 font-bold">
          {cluster.clusterType}
        </span>
      </div>

      {/* Cluster Info */}
      <div className="space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Cluster ID</div>
        <div className="text-xs font-bold text-white truncate">{cluster.clusterId}</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#18181c] p-2 rounded border border-zinc-800">
          <div className="text-[10px] text-zinc-500">MEMBERS</div>
          <div className="text-emerald-400 font-bold">{cluster.memberStateIds.length}</div>
        </div>
        <div className="bg-[#18181c] p-2 rounded border border-zinc-800">
          <div className="text-[10px] text-zinc-500">RADIUS</div>
          <div className="text-cyan-400 font-bold">{cluster.radius.toFixed(1)}m</div>
        </div>
      </div>

      {/* Center Position */}
      <div className="bg-[#18181c] p-2 rounded border border-zinc-800 space-y-1 text-xs">
        <div className="text-[10px] text-zinc-500">CENTROID POSITION</div>
        <div className="text-amber-300 font-bold">
          [{cluster.center.map((v) => v.toFixed(1)).join(', ')}]
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Member States</div>
        {cluster.memberStateIds.map((mId) => (
          <button
            key={mId}
            onClick={() => onSelectMemberState?.(mId)}
            className="w-full text-left p-1.5 rounded bg-[#18181c] hover:bg-zinc-800 text-[11px] text-zinc-300 truncate cursor-pointer transition"
          >
            {mId.split(':')[1] || mId}
          </button>
        ))}
      </div>
    </div>
  );
};
