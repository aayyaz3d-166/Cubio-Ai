/**
 * 3D Memory Studio — Funnel 73
 * Component: BootErrorScreen
 */

import React from 'react';
import { BootDiagnosticsData } from '../types';
import { AlertOctagon, RotateCcw, Activity } from 'lucide-react';

interface BootErrorScreenProps {
  diagnostics: BootDiagnosticsData;
  onRetry: () => void;
  onToggleDiagnostics?: () => void;
}

export const BootErrorScreen: React.FC<BootErrorScreenProps> = ({
  diagnostics,
  onRetry,
  onToggleDiagnostics,
}) => {
  return (
    <div className="w-full max-w-md p-6 bg-[#15151A] border border-red-900/60 rounded-2xl font-mono text-xs space-y-5 shadow-2xl">
      <div className="flex items-center gap-3 text-red-400">
        <AlertOctagon className="w-6 h-6 text-red-400" />
        <div>
          <h2 className="font-bold text-sm text-white">RUNTIME BOOT FAILED</h2>
          <p className="text-[10px] text-zinc-400">A required startup subsystem failed to complete.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl space-y-1 text-[11px]">
          <div className="text-zinc-400 text-[10px]">FAILED PHASE:</div>
          <div className="font-bold text-red-300">{diagnostics.failedPhase || 'UNKNOWN_PHASE'}</div>
          {diagnostics.errorMessage && (
            <div className="text-[10px] text-zinc-300 pt-1 border-t border-red-900/40">
              {diagnostics.errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RETRY</span>
        </button>

        {onToggleDiagnostics && (
          <button
            onClick={onToggleDiagnostics}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>DIAGNOSTICS</span>
          </button>
        )}
      </div>
    </div>
  );
};
