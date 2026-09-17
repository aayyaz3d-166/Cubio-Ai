/**
 * 3D Memory Studio — Funnel 54
 * Component: FinalStateInspector
 *
 * Final state inspector overlay displaying 369 streams, base-3 numeric state,
 * coordinates, and security classification.
 */

import React from 'react';
import { AdvancedSceneNode } from '../types';
import { X, Layers, Binary, ShieldCheck, Database, Compass, CheckCircle2 } from 'lucide-react';

interface FinalStateInspectorProps {
  selectedNode: AdvancedSceneNode | null;
  onClose: () => void;
}

export const FinalStateInspector: React.FC<FinalStateInspectorProps> = ({
  selectedNode,
  onClose,
}) => {
  if (!selectedNode) return null;

  const isGreen = selectedNode.classification === 'GREEN';

  return (
    <div className="absolute bottom-20 right-4 z-40 w-84 bg-[#111114]/95 backdrop-blur-md border border-cyan-500/70 rounded-xl p-4 text-xs font-mono text-zinc-300 shadow-2xl space-y-3 select-none">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedNode.colorHex }}
            />
            <span className="font-bold text-white tracking-wide truncate max-w-[200px]">
              {selectedNode.entityName}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 truncate">{selectedNode.stateId}</div>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* State Fields Grid */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-500 flex items-center gap-1">
            <Database className="w-3 h-3 text-cyan-400" /> Category:
          </span>
          <span className="text-white font-semibold">{selectedNode.category}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Domain:</span>
          <span className="text-cyan-400 font-semibold">{selectedNode.sourceDomain}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Classification:
          </span>
          <span className={isGreen ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {isGreen ? '🟢 GREEN (Permitted)' : '🔴 RED (Restricted)'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Lifecycle:
          </span>
          <span className="text-purple-300 font-bold">{selectedNode.lifecycleStage}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500 flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" /> Coordinate:
          </span>
          <span className="text-amber-400 font-bold">{selectedNode.formattedCoordinate}</span>
        </div>
      </div>

      {/* 369 Ternary Stream */}
      {selectedNode.sequence369 && (
        <div className="bg-[#18181c] p-2 rounded-lg border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Binary className="w-3 h-3 text-cyan-400" />
            <span>369 Stream:</span>
          </div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 break-all">
            {selectedNode.sequence369Formatted}
          </div>
        </div>
      )}

      {/* Checksum */}
      <div className="text-[9px] text-zinc-500 truncate flex justify-between">
        <span>Checksum:</span>
        <span className="text-zinc-400">{selectedNode.checksum}</span>
      </div>
    </div>
  );
};
