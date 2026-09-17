/**
 * 3D Memory Studio — Funnel 65
 * Component: RuntimeDiagnostics
 *
 * Real-time runtime diagnostic and integration status HUD.
 */

import React from 'react';
import { RuntimeDiagnosticReport } from '../types';
import { ShieldCheck, Activity, Layers, Video, Monitor, X } from 'lucide-react';

interface RuntimeDiagnosticsProps {
  report: RuntimeDiagnosticReport;
  onClose: () => void;
}

export const RuntimeDiagnostics: React.FC<RuntimeDiagnosticsProps> = ({ report, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-[#111114]/95 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-zinc-300 select-none text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-[11px]">F65 RUNTIME DIAGNOSTICS</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
          <span className="text-zinc-500">RUNTIME STATE:</span>
          <span className="text-emerald-400 font-bold">{report.state}</span>
        </div>
        <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
          <span className="text-zinc-500">ACTIVE SCREEN:</span>
          <span className="text-cyan-400 font-bold">{report.screen}</span>
        </div>
        <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
          <span className="text-zinc-500">CANVAS DIMENSIONS:</span>
          <span className="text-white font-bold">{report.canvasWidth} x {report.canvasHeight}</span>
        </div>
        <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
          <span className="text-zinc-500">RAF OWNER:</span>
          <span className="text-purple-400 font-bold">{report.rafOwner}</span>
        </div>
        <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
          <span className="text-zinc-500">ACTIVE DIMENSION:</span>
          <span className="text-amber-400 font-bold">Z{report.activeDimension}</span>
        </div>
      </div>

      <div className="pt-1 flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>F47 Security boundary active: 0 RED records permitted.</span>
      </div>
    </div>
  );
};
