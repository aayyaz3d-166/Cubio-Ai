/**
 * 3D Memory Studio — Funnel 73
 * Component: BootProgress
 */

import React from 'react';
import { BootPhaseRecord } from '../types';
import { Check, X, Loader2, Minus } from 'lucide-react';

interface BootProgressProps {
  phases: readonly BootPhaseRecord[];
  percentage: number;
}

export const BootProgress: React.FC<BootProgressProps> = ({ phases, percentage }) => {
  return (
    <div className="w-full max-w-md space-y-4 font-mono text-xs">
      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-400">
          <span>STARTING STUDIO RUNTIME...</span>
          <span className="text-cyan-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Phase Checklist */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {phases.map((record) => (
          <div
            key={record.phase}
            className="flex items-center justify-between p-1.5 bg-zinc-900/60 rounded border border-zinc-800/80 text-[10px]"
          >
            <div className="flex items-center gap-2">
              {record.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              {record.status === 'IN_PROGRESS' && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
              {record.status === 'FAILED' && <X className="w-3.5 h-3.5 text-red-400" />}
              {record.status === 'PENDING' && <Minus className="w-3.5 h-3.5 text-zinc-600" />}
              {record.status === 'SKIPPED' && <span className="text-amber-400 text-[10px]">SKIP</span>}

              <span
                className={`font-bold ${
                  record.status === 'IN_PROGRESS'
                    ? 'text-cyan-300'
                    : record.status === 'COMPLETED'
                    ? 'text-zinc-200'
                    : 'text-zinc-500'
                }`}
              >
                {record.name}
              </span>
            </div>

            <div className="text-zinc-500 text-[9px]">
              {record.status === 'COMPLETED' && `${record.durationMs?.toFixed(0)}ms`}
              {record.status === 'FAILED' && <span className="text-red-400">FAILED</span>}
              {record.status === 'IN_PROGRESS' && <span className="text-cyan-400">CHECKING</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
