/**
 * 3D Memory Studio — Funnel 46
 * Component: Visualizer369Panel
 *
 * Panel 4: Interactive 369 sequence visualizer with symbol frequency breakdown,
 * base-3 numeric interpretation, grouped sequence blocks, and order sensitivity.
 */

import React from 'react';
import { Visualizer369ViewModel } from '../../funnel45/types';
import { Binary, CheckCircle2, ShieldAlert, Sparkles, Hash } from 'lucide-react';

interface Visualizer369PanelProps {
  visualizer?: Visualizer369ViewModel;
}

export const Visualizer369Panel: React.FC<Visualizer369PanelProps> = ({ visualizer }) => {
  if (!visualizer) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No 369 sequence available. Select a state to visualize its ternary encoding.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Symbol Frequencies Metric Ribbon */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#18181b] border border-cyan-900/60 rounded-md p-3">
          <div className="text-zinc-400 text-[11px] mb-1 flex items-center justify-between">
            <span className="font-bold text-cyan-400">Symbol '3' (Digit 0)</span>
            <span className="text-[10px] text-zinc-500">{(visualizer.ratio3 * 100).toFixed(1)}%</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">{visualizer.count3}</div>
          <div className="w-full bg-[#111113] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-cyan-500 h-full" style={{ width: `${visualizer.ratio3 * 100}%` }} />
          </div>
        </div>

        <div className="bg-[#18181b] border border-purple-900/60 rounded-md p-3">
          <div className="text-zinc-400 text-[11px] mb-1 flex items-center justify-between">
            <span className="font-bold text-purple-400">Symbol '6' (Digit 1)</span>
            <span className="text-[10px] text-zinc-500">{(visualizer.ratio6 * 100).toFixed(1)}%</span>
          </div>
          <div className="text-xl font-bold text-purple-300">{visualizer.count6}</div>
          <div className="w-full bg-[#111113] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full" style={{ width: `${visualizer.ratio6 * 100}%` }} />
          </div>
        </div>

        <div className="bg-[#18181b] border border-amber-900/60 rounded-md p-3">
          <div className="text-zinc-400 text-[11px] mb-1 flex items-center justify-between">
            <span className="font-bold text-amber-400">Symbol '9' (Digit 2)</span>
            <span className="text-[10px] text-zinc-500">{(visualizer.ratio9 * 100).toFixed(1)}%</span>
          </div>
          <div className="text-xl font-bold text-amber-300">{visualizer.count9}</div>
          <div className="w-full bg-[#111113] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full" style={{ width: `${visualizer.ratio9 * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Grouped Sequence Stream */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5 text-zinc-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Binary className="w-4 h-4 text-emerald-400" />
            <span>Grouped 369 Symbol Stream (6-Symbol Byte Blocks)</span>
          </div>
          <span className="text-[10px] text-zinc-500">{visualizer.symbolCount} Symbols Total</span>
        </div>

        <div className="p-3 bg-[#111113] border border-[#27272a] rounded flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {Array.from({ length: Math.ceil(visualizer.visibleSymbols.length / 6) }).map((_, blockIdx) => {
            const blockSymbols = visualizer.visibleSymbols.slice(blockIdx * 6, (blockIdx + 1) * 6);
            return (
              <div
                key={blockIdx}
                className="bg-zinc-900/90 border border-zinc-700/60 px-2 py-1 rounded text-xs tracking-widest flex items-center gap-0.5"
              >
                {blockSymbols.map((s) => (
                  <span
                    key={s.index}
                    className={`font-bold ${
                      s.symbol === '3'
                        ? 'text-cyan-400'
                        : s.symbol === '6'
                        ? 'text-purple-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {s.symbol}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {visualizer.isTruncatedInView && (
          <div className="text-[10px] text-amber-400 flex items-center gap-1 pt-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sequence rendering bounded to {visualizer.visibleSymbols.length} symbols. Full sequence preserved in memory.</span>
          </div>
        )}
      </div>

      {/* Order Sensitivity & Numeric State Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Order Sensitivity Invariant</span>
          </div>
          <div className="text-zinc-400 text-[11px] space-y-1 leading-relaxed">
            <div className="text-white font-mono bg-[#111113] p-1.5 rounded border border-[#27272a]">
              369 ≠ 963 &nbsp;|&nbsp; 369369 ≠ 369
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              • Strict positional permutations yield distinct coordinates and numeric states.
            </p>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span>Base-3 BigInt State</span>
          </div>
          <div className="p-1.5 bg-[#111113] rounded border border-[#27272a] text-white font-mono text-[10px] break-all max-h-16 overflow-y-auto">
            {visualizer.numericStateBigIntString}
          </div>
          <div className="text-[10px] text-zinc-500">Arbitrary precision ternary integer representation.</div>
        </div>
      </div>
    </div>
  );
};
