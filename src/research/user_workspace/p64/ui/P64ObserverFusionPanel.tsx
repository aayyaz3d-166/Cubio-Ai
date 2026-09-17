/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Observer Fusion Configuration Panel
 */

import React from 'react';
import { ExtendedObserverKey, ObserverFusionConfig } from '../types';
import { WorkspaceObserver } from '../../p61/types';
import { GitMerge, Sliders, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface P64ObserverFusionPanelProps {
  observers: Record<string, WorkspaceObserver>;
  config: ObserverFusionConfig;
  activeViewKey: ExtendedObserverKey;
  onSelectActiveView: (k: ExtendedObserverKey) => void;
  onToggleKey: (k: ExtendedObserverKey) => void;
  onSetNoiseMagnitude: (noise: number) => void;
}

export const P64ObserverFusionPanel: React.FC<P64ObserverFusionPanelProps> = ({
  observers,
  config,
  activeViewKey,
  onSelectActiveView,
  onToggleKey,
  onSetNoiseMagnitude,
}) => {
  const allKeys: { key: ExtendedObserverKey; label: string; desc: string }[] = [
    { key: 'O0', label: 'O0: Front', desc: '[X, Y] projection' },
    { key: 'O1', label: 'O1: Side', desc: '[Z, Y] projection' },
    { key: 'O2', label: 'O2: Top', desc: '[X, Z] projection' },
    { key: 'O3_REDUNDANT', label: 'O3: Redundant', desc: '[X, Y] duplicate view' },
    { key: 'O4_NOISY', label: 'O4: Perturbed', desc: '[Z+ε, Y] noisy view' },
  ];

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── ACTIVE OBSERVER SELECTION ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> ACTIVE VIEWPORT
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">{activeViewKey}</span>
        </div>

        <div className="grid grid-cols-3 gap-1 mb-2">
          {allKeys.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelectActiveView(item.key)}
              className={`py-1 text-center font-bold rounded cursor-pointer text-[9.5px] truncate px-1 ${
                activeViewKey === item.key
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.key.replace('_REDUNDANT', '').replace('_NOISY', '')}
            </button>
          ))}
        </div>
      </div>

      {/* ── FUSION SET MULTI-CHECKBOX ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-purple-400 flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5" /> FUSED OBSERVER SET
          </span>
          <span className="text-[9px] text-zinc-400 font-bold">{config.enabledKeys.length} Active</span>
        </div>

        <div className="space-y-1.5">
          {allKeys.map((item) => {
            const isEnabled = config.enabledKeys.includes(item.key);
            return (
              <div
                key={item.key}
                onClick={() => onToggleKey(item.key)}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition select-none ${
                  isEnabled
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                    : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="font-bold text-[10px]">{item.label}</div>
                  <div className="text-[8px] text-zinc-500">{item.desc}</div>
                </div>
                {isEnabled ? (
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CONTROLLED NOISE PERTURBATION SLIDER ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> NOISE MAGNITUDE (ε)
          </span>
          <span className="text-[9.5px] text-zinc-300 font-bold">±{config.noiseMagnitude.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={config.noiseMagnitude}
          onChange={(e) => onSetNoiseMagnitude(Number(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer"
        />
        <div className="text-[8px] text-zinc-500 mt-1">
          Injects controlled perturbation to verify transition from EXACT to CONSTRAINED uncertainty.
        </div>
      </div>
    </div>
  );
};
