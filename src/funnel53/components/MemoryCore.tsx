/**
 * 3D Memory Studio — Funnel 53
 * Component: MemoryCore
 *
 * Central computational memory core with slow rotation and pulsing 369 nucleus.
 */

import React from 'react';
import { StudioCoreViewModel } from '../types';

interface MemoryCoreProps {
  core: StudioCoreViewModel;
}

export const MemoryCore: React.FC<MemoryCoreProps> = ({ core }) => {
  return (
    <div
      style={{
        transform: `translate(${core.screenX}px, ${core.screenY}px) scale(${core.scale * core.pulseScale})`,
      }}
      className="absolute flex items-center justify-center pointer-events-none z-10 select-none font-mono"
    >
      {/* Outer Cyan Blur Glow */}
      <div className="w-28 h-28 rounded-full bg-cyan-500/15 blur-2xl animate-pulse" />

      {/* Concentric Dimension Rings */}
      <div className="absolute w-20 h-20 rounded-full border border-dashed border-cyan-500/30 animate-spin" style={{ animationDuration: '30s' }} />
      <div className="absolute w-24 h-24 rounded-full border border-dotted border-purple-500/20 animate-spin" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />

      {/* Inner Central Core Hub */}
      <div className="relative w-12 h-12 rounded-full border-2 border-cyan-400 bg-[#0d0d11]/90 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-500/50">
        <span className="text-white font-bold text-xs tracking-wider">369</span>
      </div>

      {/* Core Label */}
      <div className="absolute -bottom-6 px-2 py-0.5 rounded bg-[#111114]/90 border border-zinc-800 text-[9px] text-cyan-400 font-bold tracking-widest whitespace-nowrap shadow-md">
        {core.label}
      </div>
    </div>
  );
};
