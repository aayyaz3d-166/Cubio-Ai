/**
 * 3D Memory Studio — Funnel 74 & 75
 * Component: LandingExperienceWrapper
 *
 * StrictMode-safe and remount-resilient Landing Experience integration with F75 canvas reattachment.
 */

import React from 'react';
import { useLandingLifecycle } from '../hooks/useLandingLifecycle';
import { LandingCubeViewportWrapper } from '../../funnel75/components/LandingCubeViewportWrapper';
import { StartStudioButton } from '../../funnel63/components/StartStudioButton';
import { LandingRuntimeRecovery } from './LandingRuntimeRecovery';
import { LandingRuntimeBoundary } from './LandingRuntimeBoundary';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface LandingExperienceWrapperProps {
  onStartStudio: () => void;
}

export const LandingExperienceWrapper: React.FC<LandingExperienceWrapperProps> = ({ onStartStudio }) => {
  const { engine, isReady, snapshot, stats, startStudio, retry } = useLandingLifecycle();

  const handleStartClick = () => {
    const ok = startStudio();
    if (ok) {
      setTimeout(() => {
        onStartStudio();
      }, 600);
    }
  };

  if (snapshot.state === 'FAILED') {
    return (
      <div className="w-screen h-screen bg-[#070709] flex items-center justify-center p-6 select-none font-mono">
        <LandingRuntimeRecovery error={snapshot.error} onRetry={retry} />
      </div>
    );
  }

  if (!isReady || !engine) {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center font-mono text-cyan-400 text-xs select-none">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <div>INITIALIZING 3D LANDING PORTAL (GEN #{snapshot.generation})...</div>
      </div>
    );
  }

  return (
    <LandingRuntimeBoundary>
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
          <LandingCubeViewportWrapper engine={engine} />
        </div>

        {/* Bottom CTA Dock */}
        <footer className="relative z-20 pb-8 flex flex-col items-center gap-3">
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
    </LandingRuntimeBoundary>
  );
};
