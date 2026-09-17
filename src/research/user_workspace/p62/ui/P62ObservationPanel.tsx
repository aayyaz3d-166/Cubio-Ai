/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Observation Inspector Panel
 */

import React from 'react';
import { InteractiveRealityEngine } from '../interactionEngine';
import { WorkspaceDimension } from '../../p61/types';
import { Eye, Layers, Camera, GitMerge, RotateCcw } from 'lucide-react';

interface P62ObservationPanelProps {
  engine: InteractiveRealityEngine;
  onRefresh: () => void;
}

export const P62ObservationPanel: React.FC<P62ObservationPanelProps> = ({
  engine,
  onRefresh,
}) => {
  const sync = engine.getSynchronizedPipeline();

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── OBSERVER CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> OBSERVER CONTROLS
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">Z{engine.observer.dimension}</span>
        </div>

        {/* Dimension Selector */}
        <div className="flex gap-1 mb-2.5">
          {([3, 2, 1] as WorkspaceDimension[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                engine.setDimension(d);
                onRefresh();
              }}
              className={`flex-1 py-1 text-center font-bold rounded cursor-pointer ${
                engine.observer.dimension === d
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Z{d} Mode
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            engine.resetObserver();
            onRefresh();
          }}
          className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded cursor-pointer"
        >
          Reset Observer Position
        </button>
      </div>

      {/* ── MULTI-OBSERVER COMBINATION SELECTOR ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5" /> MULTI-OBSERVER SET
          </span>
          <span className="text-[9px] text-purple-400 font-bold">{engine.multiObserverConfig.combinationKey}</span>
        </div>

        <div className="flex flex-col gap-1 mb-2">
          {(['F0', 'F0+F1', 'F0+F2', 'F1+F2', 'F0+F1+F2'] as const).map((comb) => (
            <button
              key={comb}
              onClick={() => {
                engine.setMultiObserverCombination(comb);
                onRefresh();
              }}
              className={`px-2.5 py-1 text-left font-bold rounded transition cursor-pointer flex justify-between ${
                engine.multiObserverConfig.combinationKey === comb
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{comb}</span>
              <span className="text-[8.5px] text-zinc-500">{comb === 'F0' ? '1 Observer' : comb === 'F0+F1+F2' ? '3 Observers' : '2 Observers'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── DOMAIN CHECKSUM INSPECTOR ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5 text-[9.5px]">
        <div className="font-bold text-zinc-300 text-[10.5px] mb-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Pipeline Checksums
        </div>
        <div>
          <span className="text-zinc-500">Reality X:</span><br />
          <strong className="text-cyan-400">{sync.realityChecksum}</strong>
        </div>
        <div>
          <span className="text-zinc-500">Observer O:</span><br />
          <strong className="text-emerald-400">{sync.observerChecksum}</strong>
        </div>
        <div>
          <span className="text-zinc-500">Observable Frame F:</span><br />
          <strong className="text-purple-400">{sync.frameChecksum}</strong>
        </div>
        <div>
          <span className="text-zinc-500">Visible Objects:</span><br />
          <strong className="text-zinc-200">{sync.observableFrame.visibleCount} / {engine.reality.objects.length}</strong>
        </div>
      </div>
    </div>
  );
};
