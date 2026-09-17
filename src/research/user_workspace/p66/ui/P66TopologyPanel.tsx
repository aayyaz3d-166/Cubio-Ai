/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Topology Structure & B-Rep Inspector Panel
 */

import React from 'react';
import { AdvancedGeometryObject } from '../types';
import { Network, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface P66TopologyPanelProps {
  selectedObject: AdvancedGeometryObject | null;
}

export const P66TopologyPanel: React.FC<P66TopologyPanelProps> = ({ selectedObject }) => {
  const top = selectedObject?.topology;

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5" /> B-REP TOPOLOGY STRUCTURE
        </span>
        <span className="text-[9px] text-zinc-500">{selectedObject ? selectedObject.name : 'None'}</span>
      </div>

      {top ? (
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-0.5">
            <div>Vertices: <strong className="text-zinc-200">{top.vertexCount}</strong></div>
            <div>Edges: <strong className="text-zinc-200">{top.edgeCount}</strong></div>
            <div>Faces: <strong className="text-zinc-200">{top.faceCount}</strong></div>
            <div>Shells: <strong className="text-zinc-200">{top.shellCount}</strong></div>
          </div>
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-0.5">
            <div>Manifold: <strong className={top.isManifold ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{top.isManifold ? 'YES' : 'NO'}</strong></div>
            <div>Closed Shell: <strong className="text-zinc-200">{top.isClosed ? 'YES' : 'NO'}</strong></div>
            <div>Boundaries: <strong className="text-amber-400">{top.boundaryEdgeCount}</strong></div>
            <div>Non-Manifold: <strong className={top.nonManifoldEdgeCount === 0 ? 'text-emerald-400' : 'text-red-400'}>{top.nonManifoldEdgeCount}</strong></div>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-2 text-[9px]">
          Select an object with topological data to view B-Rep structure.
        </div>
      )}
    </div>
  );
};
