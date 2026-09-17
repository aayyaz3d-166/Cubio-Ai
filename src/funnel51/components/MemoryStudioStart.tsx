/**
 * 3D Memory Studio — Funnel 51
 * Component: MemoryStudioStart
 *
 * The minimal, ultra-clean initial landing screen.
 * Nothing visually competes with the central [ START ] button.
 */

import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface MemoryStudioStartProps {
  onStart: () => void;
  prefersReducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const MemoryStudioStart: React.FC<MemoryStudioStartProps> = ({
  onStart,
  prefersReducedMotion,
  onToggleReducedMotion,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#070709] text-zinc-200 select-none overflow-hidden font-mono p-4">
      {/* Subtle Background Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 65%),
            linear-gradient(to right, #1f1f23 1px, transparent 1px),
            linear-gradient(to bottom, #1f1f23 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />

      {/* Dim Central Ambient Point */}
      <div className="absolute w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none f51-glow-pulse" />

      {/* Central Minimalist Card */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md w-full">
        {/* Logo / Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#121215] border border-cyan-900/50 text-cyan-400 text-xs font-semibold tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>3D INFORMATION UNIVERSE</span>
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-white">
            3D MEMORY STUDIO
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm tracking-wide">
            Computational Information Architecture Simulation
          </p>
        </div>

        {/* Primary START Button */}
        <div className="pt-4 w-full flex justify-center">
          <button
            onClick={onStart}
            autoFocus
            className="group relative px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-lg text-sm tracking-widest transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-cyan-300"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>START SIMULATION</span>
          </button>
        </div>

        {/* Subtitle / Helper Hint */}
        <div className="text-[11px] text-zinc-500 tracking-tight">
          Press <strong className="text-zinc-400">START</strong> or <strong className="text-zinc-400">ENTER</strong> to initialize simulation
        </div>
      </div>

      {/* Accessibility / Motion Toggle in Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20">
        <button
          onClick={onToggleReducedMotion}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2.5 py-1 rounded bg-[#121215]/80 border border-zinc-800 transition"
        >
          {prefersReducedMotion ? '⚡ Motion: Reduced' : '✨ Motion: Smooth'}
        </button>
      </div>

      {/* Scientific Boundary Notice in Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 text-[10px] text-zinc-600 hidden sm:block">
        Deterministic Computational Visualization Prototype
      </div>
    </div>
  );
};
