/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Observer Set & Combination Selection Panel
 */

import React from 'react';
import { MultiObserverWorkspace } from '../multiObserverWorkspace';
import { ObserverKey, ObserverCombinationKey } from '../types';
import { Camera, GitMerge, RotateCcw, Layers } from 'lucide-react';

interface P63ObserverPanelProps {
  workspace: MultiObserverWorkspace;
  onRefresh: () => void;
}

export const P63ObserverPanel: React.FC<P63ObserverPanelProps> = ({
  workspace,
  onRefresh,
}) => {
  const frames = workspace.getObservableFrames();

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── ACTIVE VIEW OBSERVER SELECTOR ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> ACTIVE VIEWPORT
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">{workspace.activeViewObserverKey}</span>
        </div>

        <div className="flex gap-1.5 mb-2">
          {(['O0', 'O1', 'O2'] as ObserverKey[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                workspace.setActiveViewObserver(k);
                onRefresh();
              }}
              className={`flex-1 py-1 text-center font-bold rounded transition cursor-pointer ${
                workspace.activeViewObserverKey === k
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {k} ({k === 'O0' ? 'Front' : k === 'O1' ? 'Side' : 'Top'})
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            workspace.resetActiveObserver();
            onRefresh();
          }}
          className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded cursor-pointer"
        >
          Reset {workspace.activeViewObserverKey} Camera
        </button>
      </div>

      {/* ── MULTI-OBSERVER RECONSTRUCTION SET ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5" /> RECONSTRUCTION INPUTS
          </span>
          <span className="text-[9px] text-purple-400 font-bold">{workspace.selectedCombination}</span>
        </div>

        <div className="flex flex-col gap-1 mb-2">
          {(['F0', 'F1', 'F2', 'F0+F1', 'F0+F2', 'F1+F2', 'F0+F1+F2'] as ObserverCombinationKey[]).map((comb) => (
            <button
              key={comb}
              onClick={() => {
                workspace.setObserverCombination(comb);
                onRefresh();
              }}
              className={`px-2.5 py-1 text-left font-bold rounded transition cursor-pointer flex justify-between ${
                workspace.selectedCombination === comb
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{comb}</span>
              <span className="text-[8.5px] text-zinc-500">
                {comb.includes('+') ? (comb.includes('F2') && comb.includes('F1') && comb.includes('F0') ? '3 Views (Exact)' : '2 Views (Exact)') : '1 View (Constrained)'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── THREE OBSERVER STATUS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-[9px]">
        <div className="font-bold text-zinc-300 text-[10.5px] flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Frame Checksums
        </div>

        <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
          <div className="text-cyan-400 font-bold">F0 (Front [X,Y])</div>
          <div className="text-zinc-400 truncate">Checksum: {frames.f0Checksum}</div>
          <div className="text-zinc-500">Pos: [{workspace.observers.O0.position.map((v) => v.toFixed(0)).join(',')}]</div>
        </div>

        <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
          <div className="text-emerald-400 font-bold">F1 (Side [Z,Y])</div>
          <div className="text-zinc-400 truncate">Checksum: {frames.f1Checksum}</div>
          <div className="text-zinc-500">Pos: [{workspace.observers.O1.position.map((v) => v.toFixed(0)).join(',')}]</div>
        </div>

        <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
          <div className="text-amber-400 font-bold">F2 (Top [X,Z])</div>
          <div className="text-zinc-400 truncate">Checksum: {frames.f2Checksum}</div>
          <div className="text-zinc-500">Pos: [{workspace.observers.O2.position.map((v) => v.toFixed(0)).join(',')}]</div>
        </div>
      </div>
    </div>
  );
};
