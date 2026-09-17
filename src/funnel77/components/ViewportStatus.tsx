/**
 * 3D Memory Studio — Funnel 77
 * Component: ViewportStatus
 */

import React from 'react';
import { ViewportSnapshot } from '../types';

interface ViewportStatusProps {
  snapshot: ViewportSnapshot;
}

export const ViewportStatus: React.FC<ViewportStatusProps> = ({ snapshot }) => {
  const isZ3 = snapshot.controls.activeDimension === 3;
  const isOk = snapshot.state === 'ACTIVE';

  return (
    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 font-mono text-[11px] select-none pointer-events-none">
      <div className="px-2.5 py-1 bg-black/60 backdrop-blur-xs border border-zinc-800 rounded-lg flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isOk ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <span className="font-bold text-zinc-200">
          {isOk ? '3D ACTIVE' : `VIEWPORT ${snapshot.state}`}
        </span>
      </div>

      <div className="px-2.5 py-1 bg-black/60 backdrop-blur-xs border border-zinc-800 rounded-lg flex items-center gap-1.5 text-zinc-400">
        <span className="font-bold text-cyan-400">
          {isZ3 ? 'Z3' : `Z${snapshot.controls.activeDimension}`}
        </span>
        <span className="text-[10px]">
          {isZ3 ? 'ACTUAL 3D SPATIAL MODE' : 'COMPUTATIONAL PROJECTION'}
        </span>
      </div>
    </div>
  );
};
