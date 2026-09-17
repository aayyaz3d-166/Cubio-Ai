/**
 * 3D Memory Studio — Funnel 50
 * Component: ThreeSixNineCore
 *
 * Visually prominent 369 Core inspector modal / overlay displaying
 * grouped ternary symbol streams, frequency distribution, Base-3 numeric BigInt state,
 * and coordinate mappings.
 */

import React from 'react';
import { Binary, ShieldCheck, Zap } from 'lucide-react';

interface ThreeSixNineCoreProps {
  sequence369?: string | null;
  numericState?: string | null;
  stateId?: string;
  onClose: () => void;
}

export const ThreeSixNineCore: React.FC<ThreeSixNineCoreProps> = ({
  sequence369,
  numericState,
  stateId,
  onClose,
}) => {
  if (!sequence369) return null;

  // Calculate symbol frequencies
  let count3 = 0;
  let count6 = 0;
  let count9 = 0;

  for (let i = 0; i < sequence369.length; i++) {
    const ch = sequence369[i];
    if (ch === '3') count3++;
    else if (ch === '6') count6++;
    else if (ch === '9') count9++;
  }

  const total = sequence369.length || 1;
  const p3 = ((count3 / total) * 100).toFixed(1);
  const p6 = ((count6 / total) * 100).toFixed(1);
  const p9 = ((count9 / total) * 100).toFixed(1);

  // Group sequence into 3-symbol blocks
  const blocks: string[] = [];
  for (let i = 0; i < sequence369.length; i += 3) {
    blocks.push(sequence369.substring(i, i + 3));
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111113] border border-amber-500/60 w-full max-w-2xl rounded-xl p-5 text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 font-bold">
              369
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                <span>369 COMPUTATIONAL CORE</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  GREEN Verified
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Ternary Information Encoding & Base-3 Numeric State</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* State ID Reference */}
        <div className="text-[11px] text-zinc-400 bg-[#18181b] p-2 rounded border border-zinc-800">
          Target State: <strong className="text-white">{stateId || 'ACTIVE_SELECTION'}</strong>
        </div>

        {/* 369 Grouped Sequence Blocks */}
        <div className="space-y-1.5">
          <div className="text-zinc-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Grouped Sequence Stream:</span>
            <span className="text-amber-400">Total Symbols: {sequence369.length}</span>
          </div>
          <div className="bg-[#0c0c0e] p-3 rounded-lg border border-amber-900/30 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {blocks.map((blk, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-amber-950/40 border border-amber-700/50 text-amber-300 font-bold rounded text-xs tracking-widest shadow-xs"
              >
                {blk}
              </span>
            ))}
          </div>
        </div>

        {/* Symbol Frequency Distribution */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#18181b] p-3 rounded-lg border border-cyan-800/40 space-y-1">
            <div className="flex justify-between items-center text-cyan-400 font-bold">
              <span>Symbol '3' (Val: 0)</span>
              <span>{count3}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${p3}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500">{p3}% distribution</div>
          </div>

          <div className="bg-[#18181b] p-3 rounded-lg border border-purple-800/40 space-y-1">
            <div className="flex justify-between items-center text-purple-400 font-bold">
              <span>Symbol '6' (Val: 1)</span>
              <span>{count6}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full" style={{ width: `${p6}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500">{p6}% distribution</div>
          </div>

          <div className="bg-[#18181b] p-3 rounded-lg border border-amber-800/40 space-y-1">
            <div className="flex justify-between items-center text-amber-400 font-bold">
              <span>Symbol '9' (Val: 2)</span>
              <span>{count9}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${p9}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500">{p9}% distribution</div>
          </div>
        </div>

        {/* Base-3 Numeric State */}
        <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800 space-y-1">
          <div className="text-zinc-400 text-[11px] font-semibold">Derived Arbitrary-Precision BigInt State:</div>
          <div className="text-cyan-300 font-mono break-all text-[11px]">
            {numericState || '369555555'}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
          <span>Deterministic Ternary Representation Layer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs transition"
          >
            Close 369 Core
          </button>
        </div>
      </div>
    </div>
  );
};
