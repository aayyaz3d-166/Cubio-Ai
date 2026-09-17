/**
 * 3D Memory Studio — Funnel 73
 * Component: RuntimeDiagnosticsPanel
 */

import React from 'react';
import { BootDiagnosticsData } from '../types';
import { BootDiagnostics } from './BootDiagnostics';
import { X, Activity, Clock } from 'lucide-react';

interface RuntimeDiagnosticsPanelProps {
  diagnostics: BootDiagnosticsData;
  onClose: () => void;
}

export const RuntimeDiagnosticsPanel: React.FC<RuntimeDiagnosticsPanelProps> = ({
  diagnostics,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono text-xs select-none">
      <div className="w-full max-w-xl bg-[#121216] border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white tracking-wider">BOOT RUNTIME DIAGNOSTICS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Performance Summary */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>PERFORMANCE METRICS:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="text-zinc-400">
                Total Boot Time: <span className="text-white font-bold">{diagnostics.metrics.totalBootDurationMs.toFixed(1)}ms</span>
              </div>
              <div className="text-zinc-400">
                F72 Activation: <span className="text-white font-bold">{diagnostics.metrics.f72ActivationDurationMs.toFixed(1)}ms</span>
              </div>
              <div className="text-zinc-400">
                Renderer Check: <span className="text-white font-bold">{diagnostics.metrics.rendererCheckDurationMs.toFixed(1)}ms</span>
              </div>
              <div className="text-zinc-400">
                Studio Check: <span className="text-white font-bold">{diagnostics.metrics.studioCheckDurationMs.toFixed(1)}ms</span>
              </div>
            </div>
          </div>

          {/* Subsystems */}
          <BootDiagnostics diagnostics={diagnostics} />

          {/* Event Timeline */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-400 font-bold">LIVE EVENT TIMELINE ({diagnostics.events.length}/50):</div>
            <div className="space-y-1 max-h-40 overflow-y-auto p-2 bg-black/60 border border-zinc-800 rounded-xl text-[10px]">
              {diagnostics.events.map((e, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[9px]">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={`font-bold ${
                      e.level === 'ERROR'
                        ? 'text-red-400'
                        : e.level === 'SUCCESS'
                        ? 'text-emerald-400'
                        : e.level === 'WARN'
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    [{e.phase}]
                  </span>
                  <span className="text-zinc-300 truncate">{e.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
