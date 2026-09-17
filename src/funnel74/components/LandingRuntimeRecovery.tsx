/**
 * 3D Memory Studio — Funnel 74
 * Component: LandingRuntimeRecovery
 */

import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface LandingRuntimeRecoveryProps {
  error?: string;
  onRetry: () => void;
}

export const LandingRuntimeRecovery: React.FC<LandingRuntimeRecoveryProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="w-full max-w-md p-6 bg-[#141418] border border-red-900/60 rounded-2xl font-mono text-xs space-y-4 shadow-2xl text-center">
      <div className="flex flex-col items-center gap-2 text-red-400">
        <AlertOctagon className="w-8 h-8 text-red-400" />
        <h2 className="text-sm font-bold text-white tracking-wider">STUDIO RUNTIME ERROR</h2>
        <p className="text-[11px] text-zinc-400">The 3D Memory Studio landing runtime encountered an issue.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={onRetry}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
      >
        <RotateCcw className="w-4 h-4" />
        <span>RETRY RUNTIME</span>
      </button>
    </div>
  );
};
