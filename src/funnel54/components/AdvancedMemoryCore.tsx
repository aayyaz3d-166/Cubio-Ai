/**
 * 3D Memory Studio — Funnel 54
 * Component: AdvancedMemoryCore
 *
 * Advanced central computational memory nucleus with concentric dimension rings,
 * cluster energy points, and pulsing 369 core.
 */

import React from 'react';
import { StudioCoreViewModel } from '../../funnel53/types';

interface AdvancedMemoryCoreProps {
  core: StudioCoreViewModel;
  prefersReducedMotion?: boolean;
}

export const AdvancedMemoryCore: React.FC<AdvancedMemoryCoreProps> = ({
  core,
  prefersReducedMotion = false,
}) => {
  return (
    <div
      style={{
        transform: `translate(${core.screenX}px, ${core.screenY}px) scale(${core.scale * core.pulseScale})`,
      }}
      className="absolute flex items-center justify-center pointer-events-none z-10 select-none font-mono"
    >
      {/* Outer Cyan Energy Aura */}
      <div className={`w-32 h-32 rounded-full bg-cyan-500/15 blur-2xl ${prefersReducedMotion ? '' : 'animate-pulse'}`} />

      {/* Outer Concentric Dimension Shells */}
      <div
        className={`absolute w-24 h-24 rounded-full border border-dashed border-cyan-500/35 ${
          prefersReducedMotion ? '' : 'animate-spin'
        }`}
        style={{ animationDuration: '35s' }}
      />
      <div
        className={`absolute w-28 h-28 rounded-full border border-dotted border-purple-500/25 ${
          prefersReducedMotion ? '' : 'animate-spin'
        }`}
        style={{ animationDuration: '50s', animationDirection: 'reverse' }}
      />
      <div
        className={`absolute w-36 h-36 rounded-full border border-zinc-700/30 ${
          prefersReducedMotion ? '' : 'animate-spin'
        }`}
        style={{ animationDuration: '70s' }}
      />

      {/* Central 369 Nucleus Hub */}
      <div className="relative w-14 h-14 rounded-full border-2 border-cyan-400 bg-[#0d0d11]/95 backdrop-blur-md flex items-center justify-center shadow-xl shadow-cyan-500/50">
        <span className="text-white font-bold text-sm tracking-wider">369</span>
      </div>

      {/* Dimension & Status Pill */}
      <div className="absolute -bottom-7 px-2.5 py-0.5 rounded-full bg-[#111114]/95 border border-cyan-500/50 text-[9px] text-cyan-400 font-bold tracking-widest whitespace-nowrap shadow-lg">
        {core.label}
      </div>
    </div>
  );
};
