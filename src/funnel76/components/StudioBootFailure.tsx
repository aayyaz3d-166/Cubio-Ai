/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioBootFailure
 */

import React from 'react';
import { BootDependencyId } from '../types';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface StudioBootFailureProps {
  failedDependency?: BootDependencyId;
  error?: string;
  onRetry: () => void;
}

export const StudioBootFailure: React.FC<StudioBootFailureProps> = ({
  failedDependency,
  error,
  onRetry,
}) => {
  return (
    <div className="w-full max-w-md p-6 bg-[#141418] border border-red-900/60 rounded-2xl font-mono text-xs space-y-4 shadow-2xl text-center select-none">
      <div className="flex flex-col items-center gap-2 text-red-400">
        <AlertOctagon className="w-8 h-8 text-red-400" />
        <h2 className="text-sm font-bold text-white tracking-wider">STUDIO STARTUP FAILED</h2>
        <p className="text-[11px] text-zinc-400">Workspace startup could not be completed.</p>
      </div>

      {failedDependency && (
        <div className="px-3 py-2 bg-red-950/40 border border-red-900/40 rounded-xl text-left space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Failed Dependency:</div>
          <div className="text-sm font-extrabold text-red-400">{failedDependency}</div>
          {error && <div className="text-[11px] text-red-300/90 pt-1">{error}</div>}
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
