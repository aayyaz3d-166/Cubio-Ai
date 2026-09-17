/**
 * 3D Memory Studio — Funnel 51
 * Component: InformationCore
 *
 * Central glowing computational memory core and ambient orbiting particle field.
 */

import React from 'react';
import { VisualParticle } from '../types';

interface InformationCoreProps {
  particles: readonly VisualParticle[];
  progress: number;
}

export const InformationCore: React.FC<InformationCoreProps> = ({
  particles,
  progress,
}) => {
  const coreScale = 0.6 + Math.min(0.6, progress * 0.8);
  const coreOpacity = Math.min(1.0, 0.4 + progress * 0.6);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      {/* Central Pulsing Halo */}
      <div
        className="w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl transition-transform duration-300 f51-glow-pulse"
        style={{
          transform: `scale(${coreScale})`,
          opacity: coreOpacity,
        }}
      />

      {/* Inner Geometric Memory Core */}
      <div
        className="relative w-20 h-20 rounded-full border-2 border-cyan-400/60 bg-[#0d0d11]/80 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 f51-float"
        style={{
          transform: `scale(${coreScale})`,
        }}
      >
        <div className="w-10 h-10 rounded-full border border-cyan-300/80 bg-cyan-950/60 flex items-center justify-center font-bold text-xs text-white">
          369
        </div>

        {/* Orbiting Concentric Ring */}
        <div className="absolute -inset-4 rounded-full border border-dashed border-cyan-500/30 f51-orbit-slow" />
      </div>

      {/* Orbiting Ambient Particles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full transition-transform duration-75"
            style={{
              width: `${p.radius * 2}px`,
              height: `${p.radius * 2}px`,
              transform: `translate(${p.x}px, ${p.y}px)`,
              backgroundColor: p.colorHex,
              opacity: p.alpha,
              boxShadow: `0 0 8px ${p.colorHex}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
