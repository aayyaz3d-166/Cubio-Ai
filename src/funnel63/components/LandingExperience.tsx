/**
 * 3D Memory Studio — Funnel 63
 * Component: LandingExperience
 *
 * Full immersive 3D landing environment with interactive Three.js cube and START CTA.
 */

import React from 'react';
import { useLandingCube } from '../hooks/useLandingCube';
import { LandingCubeViewport } from './LandingCubeViewport';
import { StartStudioButton } from './StartStudioButton';
import { Sparkles, ShieldCheck, Box, Layers, Share2, Compass, Bot } from 'lucide-react';

interface LandingExperienceProps {
  onStartStudio: () => void;
}

export const LandingExperience: React.FC<LandingExperienceProps> = ({ onStartStudio }) => {
  const { engine, isReady, stats } = useLandingCube();

  const handleStartClick = () => {
    const ok = engine.startStudio();
    if (ok) {
      setTimeout(() => {
        onStartStudio();
      }, 600);
    }
  };

  if (!isReady) {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center font-mono text-cyan-400 text-xs select-none">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <div>INITIALIZING 3D LANDING PORTAL...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden flex flex-col items-center justify-between font-mono select-none">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-cyan-950/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 pt-8 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 backdrop-blur-md border border-cyan-900/40 rounded-full text-cyan-400 text-[11px] font-bold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>3D Memory Studio Research</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          3D MEMORY STUDIO
        </h1>
        <p className="text-xs text-zinc-400">
          Deterministic Computational 3D Spatial Knowledge Universe
        </p>
      </header>

      {/* Center Three.js Viewport */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <LandingCubeViewport engine={engine} />
      </div>

      {/* Bottom CTA Dock */}
      <footer className="relative z-20 pb-8 flex flex-col items-center gap-3">
        {/* Face Status Pill */}
        {stats.hoveredFace && (
          <div className="px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-[11px] text-cyan-300 backdrop-blur-xs font-bold animate-pulse">
            FACE: {stats.hoveredFace}
          </div>
        )}

        <StartStudioButton
          buttonState={engine.entryManager.startButton.currentState}
          onClick={handleStartClick}
          onHover={(h) => engine.entryManager.startButton.setHovered(h)}
          onFocus={(f) => engine.entryManager.startButton.setFocused(f)}
        />

        <div className="text-[11px] text-zinc-500 text-center">
          Mouse / Touch Drag to Rotate • Wheel to Zoom • Press [START STUDIO] or [Enter]
        </div>

        {/* Footer Telemetry */}
        <div className="flex items-center gap-4 text-[10px] text-zinc-600 pt-2 border-t border-zinc-900">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>F47 SECURITY BOUNDED</span>
          </span>
          <span>•</span>
          <span>F55 THREE.JS ENGINE</span>
          <span>•</span>
          <span>F61 CAMERA PERSPECTIVE</span>
        </div>
      </footer>
    </div>
  );
};
