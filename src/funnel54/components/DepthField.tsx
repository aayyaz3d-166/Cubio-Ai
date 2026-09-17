/**
 * 3D Memory Studio — Funnel 54
 * Component: DepthField
 *
 * Ambient starfield background and deterministic orbiting particle field.
 */

import React from 'react';
import { AdvancedParticle } from '../types';

interface DepthFieldProps {
  particles: readonly AdvancedParticle[];
  prefersReducedMotion?: boolean;
}

export const DepthField: React.FC<DepthFieldProps> = ({
  particles,
  prefersReducedMotion = false,
}) => {
  return (
    <>
      {/* Background Starfield & Radial Aura */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 70%),
            linear-gradient(to right, #1f1f23 1px, transparent 1px),
            linear-gradient(to bottom, #1f1f23 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        }}
      />

      {/* Orbiting Ambient Information Field Particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                transform: `translate(${p.screenX}px, ${p.screenY}px)`,
                width: `${p.radius * 2}px`,
                height: `${p.radius * 2}px`,
                backgroundColor: p.colorHex,
                opacity: p.alpha,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};
