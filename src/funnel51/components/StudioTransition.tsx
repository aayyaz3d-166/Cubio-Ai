/**
 * 3D Memory Studio — Funnel 51
 * Component: StudioTransition
 *
 * Visual transition screen displayed when simulation finishes (Phase 05: MEMORY_READY)
 * offering the primary [ ENTER STUDIO ] gateway to launch into the 3D Studio shell.
 */

import React from 'react';
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface StudioTransitionProps {
  onEnterStudio: () => void;
  onRestart: () => void;
}

export const StudioTransition: React.FC<StudioTransitionProps> = ({
  onEnterStudio,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111114] border border-cyan-500/60 w-full max-w-md rounded-xl p-6 text-xs shadow-2xl space-y-5 text-center">
        {/* Status Badge */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-wider text-white">MEMORY SPACE READY</h2>
          <p className="text-zinc-400 text-xs">
            3D Information Architecture initialized and synchronized.
          </p>
        </div>

        {/* Telemetry Summary */}
        <div className="bg-[#18181c] p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 space-y-1 text-left">
          <div className="flex justify-between">
            <span>Encoding:</span>
            <strong className="text-cyan-400">369 Ternary Base-3</strong>
          </div>
          <div className="flex justify-between">
            <span>Projection Layer:</span>
            <strong className="text-amber-400">Multidimensional (Z1..Z16)</strong>
          </div>
          <div className="flex justify-between">
            <span>Security Boundary:</span>
            <strong className="text-emerald-400">F47 Classification Active</strong>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onEnterStudio}
            autoFocus
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-lg text-xs tracking-wider transition shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ENTER 3D MEMORY STUDIO</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2 bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
