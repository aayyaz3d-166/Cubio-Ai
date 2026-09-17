/**
 * 3D Memory Studio — Funnel 50
 * Component: StateHUD
 *
 * Selected information state floating inspector HUD with 369 stream,
 * coordinates, classification badge, and drill-down navigation buttons.
 */

import React from 'react';
import { SimulationStateSummary } from '../types';
import { ShieldCheck, ShieldAlert, Binary, Layers, GitBranch, ArrowRight } from 'lucide-react';

interface StateHUDProps {
  stateSummary?: SimulationStateSummary;
  onOpen369: () => void;
  onOpenGraph: () => void;
  onOpenProvenance: () => void;
  onClose: () => void;
}

export const StateHUD: React.FC<StateHUDProps> = ({
  stateSummary,
  onOpen369,
  onOpenGraph,
  onOpenProvenance,
  onClose,
}) => {
  if (!stateSummary) return null;

  const isGreen = stateSummary.classification === 'GREEN';

  return (
    <div className="absolute bottom-14 left-3 bg-[#111113]/95 backdrop-blur-md border border-cyan-700/60 p-3.5 rounded-lg text-xs font-mono select-none shadow-2xl z-20 max-w-sm w-full space-y-2.5">
      {/* Header with Close */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
              isGreen
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-rose-950 text-rose-300 border-rose-700'
            }`}
          >
            {isGreen ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            <span>{isGreen ? '🟢 GREEN / PROCESSABLE' : '🔴 RED / RESTRICTED'}</span>
          </span>
          <span className="text-zinc-400 text-[10px]">{stateSummary.category}</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      {/* State Identity & Source */}
      <div>
        <div className="text-[10px] text-zinc-500">STATE IDENTITY</div>
        <div className="text-white font-bold text-xs truncate" title={stateSummary.stateId}>
          {stateSummary.recordId}
        </div>
        <div className="text-cyan-400 text-[11px] truncate">{stateSummary.entityName}</div>
        <div className="text-zinc-400 text-[10px]">Source: {stateSummary.sourceDomain}</div>
      </div>

      {/* 369 & Coordinates */}
      {isGreen ? (
        <div className="bg-[#18181b] p-2 rounded border border-[#27272a] space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">369 Sequence:</span>
            <span className="text-amber-300 font-mono">{stateSummary.sequence369?.substring(0, 16) || 'None'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Z3 Coordinate:</span>
            <span className="text-cyan-300 font-mono">{stateSummary.coordinateZ3 || 'None'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Z8 Coordinate:</span>
            <span className="text-purple-300 font-mono truncate max-w-[160px]">{stateSummary.coordinateZ8 || 'None'}</span>
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/40 p-2 rounded border border-rose-800/60 text-[11px] text-rose-300 space-y-1">
          <div className="font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Processing Restricted</span>
          </div>
          <div className="text-[10px] text-rose-400">{stateSummary.restrictionReason || 'Restricted category or unallowlisted domain.'}</div>
          <div className="text-[9px] text-zinc-500">Coordinates and 369 numeric states are strictly blocked.</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <button
          onClick={onOpen369}
          disabled={!isGreen}
          className="p-1.5 rounded bg-zinc-800 hover:bg-cyan-950/80 hover:border-cyan-600 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-[10px] font-semibold transition flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Binary className="w-3 h-3" />
          <span>369 Core</span>
        </button>
        <button
          onClick={onOpenGraph}
          className="p-1.5 rounded bg-zinc-800 hover:bg-cyan-950/80 hover:border-cyan-600 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-[10px] font-semibold transition flex items-center justify-center gap-1"
        >
          <Layers className="w-3 h-3" />
          <span>Graph</span>
        </button>
        <button
          onClick={onOpenProvenance}
          className="p-1.5 rounded bg-zinc-800 hover:bg-cyan-950/80 hover:border-cyan-600 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-[10px] font-semibold transition flex items-center justify-center gap-1"
        >
          <GitBranch className="w-3 h-3" />
          <span>Provenance</span>
        </button>
      </div>
    </div>
  );
};
