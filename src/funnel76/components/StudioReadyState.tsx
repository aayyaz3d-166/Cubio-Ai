/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioReadyState
 */

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface StudioReadyStateProps {
  progress: number;
}

export const StudioReadyState: React.FC<StudioReadyStateProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center gap-3 select-none font-mono">
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
        <CheckCircle2 className="w-5 h-5" />
        <span>STUDIO READY ({progress}%)</span>
      </div>
      <p className="text-[11px] text-zinc-500">Activating 3D Memory Workspace...</p>
    </div>
  );
};
