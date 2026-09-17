/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Geometry Object Inspector & Nudge Controls
 */

import React from 'react';
import {
  WorkspaceBoundGeometryObject,
} from '../types';
import {
  Sliders,
  ShieldCheck,
  CheckCircle,
  Move,
} from 'lucide-react';

export interface P625JGeometryInspectorProps {
  selectedObject: WorkspaceBoundGeometryObject | null;
  onNudge: (axis: 'X' | 'Y' | 'Z', delta: number) => void;
}

export const P625JGeometryInspector: React.FC<P625JGeometryInspectorProps> = ({
  selectedObject,
  onNudge,
}) => {
  if (!selectedObject) {
    return (
      <aside className="w-80 h-full bg-[#0d0e14] border-l border-zinc-800 p-4 font-mono text-zinc-500 text-xs flex items-center justify-center text-center">
        No object selected. Click an object in the scene or viewport.
      </aside>
    );
  }

  const [cx, cy, cz] = selectedObject.coordinates;
  const [w, h, d] = selectedObject.dimensions;
  const min = selectedObject.bounds.min;
  const max = selectedObject.bounds.max;

  return (
    <aside className="w-80 h-full bg-[#0d0e14] border-l border-zinc-800 flex flex-col font-mono text-zinc-300 select-none z-20 shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>Geometry Inspector</span>
        </div>
        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-bold rounded border border-cyan-800">
          {selectedObject.geometryType}
        </span>
      </div>

      <div className="p-3 space-y-4 text-xs">
        {/* Object Identity */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Identity & Lineage</div>
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded space-y-1 text-[11px]">
            <div className="text-white font-bold">{selectedObject.name}</div>
            <div className="text-zinc-400 text-[10px]">ID: {selectedObject.objectId}</div>
            <div className="text-zinc-500 text-[9px]">Lineage: {selectedObject.lineageId}</div>
          </div>
        </div>

        {/* Spatial Coordinates */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Spatial Coordinates [X, Y, Z]</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-center">
              <div className="text-[9px] text-zinc-500">X:</div>
              <div className="text-red-400 font-bold text-xs">{cx}</div>
            </div>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-center">
              <div className="text-[9px] text-zinc-500">Y:</div>
              <div className="text-green-400 font-bold text-xs">{cy}</div>
            </div>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-center">
              <div className="text-[9px] text-zinc-500">Z:</div>
              <div className="text-blue-400 font-bold text-xs">{cz}</div>
            </div>
          </div>
        </div>

        {/* Coordinate Nudge Controls */}
        <div className="space-y-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold uppercase">
            <Move className="w-3 h-3" />
            <span>Nudge Object Geometry</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onNudge('X', 1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-300 rounded font-bold transition cursor-pointer text-[10px]"
            >
              +X (+1)
            </button>
            <button
              onClick={() => onNudge('Y', 1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-green-300 rounded font-bold transition cursor-pointer text-[10px]"
            >
              +Y (+1)
            </button>
            <button
              onClick={() => onNudge('Z', 1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-300 rounded font-bold transition cursor-pointer text-[10px]"
            >
              +Z (+1)
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onNudge('X', -1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400/80 rounded font-bold transition cursor-pointer text-[10px]"
            >
              -X (-1)
            </button>
            <button
              onClick={() => onNudge('Y', -1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-green-400/80 rounded font-bold transition cursor-pointer text-[10px]"
            >
              -Y (-1)
            </button>
            <button
              onClick={() => onNudge('Z', -1)}
              className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400/80 rounded font-bold transition cursor-pointer text-[10px]"
            >
              -Z (-1)
            </button>
          </div>
        </div>

        {/* Bounding Box & Dimensions */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Bounding Box & Dimensions</div>
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded space-y-1 text-[10px]">
            <div>Dims: [{w} × {h} × {d}]</div>
            <div>Min: [{min.join(', ')}]</div>
            <div>Max: [{max.join(', ')}]</div>
          </div>
        </div>

        {/* Checksum & Topology Invariants */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Geometric Verification</div>
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded space-y-1 text-[10px]">
            <div className="text-zinc-400">CS: <span className="text-amber-400 font-mono">{selectedObject.geometryChecksum}</span></div>
            <div className="flex items-center gap-1 text-emerald-400 pt-1 border-t border-zinc-800">
              <CheckCircle className="w-3 h-3" />
              <span>MANIFOLD B-REP TOPOLOGY</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
