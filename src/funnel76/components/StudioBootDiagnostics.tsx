/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioBootDiagnostics
 */

import React from 'react';
import { BootDependency } from '../types';
import { CheckCircle2, Clock, XCircle, MinusCircle } from 'lucide-react';

interface StudioBootDiagnosticsProps {
  dependencies: readonly BootDependency[];
}

export const StudioBootDiagnostics: React.FC<StudioBootDiagnosticsProps> = ({ dependencies }) => {
  const getIcon = (state: string) => {
    switch (state) {
      case 'READY':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'CHECKING':
        return <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
      case 'SKIPPED':
        return <MinusCircle className="w-3.5 h-3.5 text-zinc-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-zinc-700 mx-0.5" />;
    }
  };

  return (
    <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 font-mono text-xs space-y-2 select-none">
      <div className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase border-b border-zinc-800 pb-1 flex justify-between">
        <span>BOOT STATUS</span>
        <span>STARTUP DEPENDENCIES</span>
      </div>

      <div className="space-y-1.5 pt-1">
        {dependencies.map((dep) => (
          <div
            key={dep.id}
            className="flex items-center justify-between text-[11px] py-0.5 border-b border-zinc-800/40 last:border-0"
          >
            <div className="flex items-center gap-2">
              {getIcon(dep.state)}
              <span className={dep.state === 'READY' ? 'text-zinc-200' : 'text-zinc-400'}>
                {dep.label}
              </span>
            </div>
            <span
              className={`font-bold text-[10px] ${
                dep.state === 'READY'
                  ? 'text-emerald-400'
                  : dep.state === 'FAILED'
                  ? 'text-red-400'
                  : dep.state === 'CHECKING'
                  ? 'text-cyan-400'
                  : 'text-zinc-600'
              }`}
            >
              {dep.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
