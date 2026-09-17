/**
 * 3D Memory Studio — Funnel 51
 * Component: MemoryStudioExperience
 *
 * Master Experience Foundation Container managing the full workflow:
 * START SCREEN -> COMPUTATIONAL INITIALIZATION -> INFORMATION STATE FORMATION -> MEMORY READY -> STUDIO SHELL.
 */

import React, { useEffect } from 'react';
import { useSimulationSequence } from '../hooks/useSimulationSequence';
import { MemoryStudioStart } from './MemoryStudioStart';
import { SimulationIntro } from './SimulationIntro';
import { InformationCore } from './InformationCore';
import { StateFormation } from './StateFormation';
import { MemoryFormation } from './MemoryFormation';
import { StudioTransition } from './StudioTransition';
import { FinalMemoryStudio } from '../../funnel54/components/FinalMemoryStudio';

interface MemoryStudioExperienceProps {
  onEnterStudio?: () => void;
  initialReducedMotion?: boolean;
}

export const MemoryStudioExperience: React.FC<MemoryStudioExperienceProps> = ({
  onEnterStudio,
  initialReducedMotion = false,
}) => {
  const { state, actions } = useSimulationSequence(initialReducedMotion);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.currentPhase === 'IDLE') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          actions.start();
        }
      } else if (state.currentPhase === 'MEMORY_READY') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          actions.enterStudio();
        }
      } else if (state.isRunning) {
        if (e.key === 'Escape') {
          actions.restart();
        } else if (e.key === 's' || e.key === 'S') {
          actions.skip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.currentPhase, state.isRunning, actions]);

  // If STUDIO_READY reached, seamlessly transition to F54 Final 3D Memory Studio
  if (state.currentPhase === 'STUDIO_READY') {
    return (
      <FinalMemoryStudio
        onExitToClassicStudio={onEnterStudio}
        initialReducedMotion={state.prefersReducedMotion}
      />
    );
  }

  // Render Phase: IDLE -> Show minimal Start Screen
  if (state.currentPhase === 'IDLE') {
    return (
      <MemoryStudioStart
        onStart={actions.start}
        prefersReducedMotion={state.prefersReducedMotion}
        onToggleReducedMotion={() => actions.setReducedMotion(!state.prefersReducedMotion)}
      />
    );
  }

  // Active Simulation Viewport
  return (
    <div className="relative w-screen h-screen bg-[#070709] text-zinc-200 select-none overflow-hidden font-mono">
      {/* Background Starfield Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%),
            linear-gradient(to right, #1f1f23 1px, transparent 1px),
            linear-gradient(to bottom, #1f1f23 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        }}
      />

      {/* Cinematic Header & Progress Bar */}
      <SimulationIntro
        currentPhase={state.currentPhase}
        progress={state.progress}
        onSkip={actions.skip}
        onRestart={actions.restart}
        activeDimension={state.activeDimension}
      />

      {/* Central Information Core & Particles */}
      <InformationCore particles={state.particles} progress={state.progress} />

      {/* Relational Memory Edges & Dimensional Shells */}
      <MemoryFormation
        relationships={state.relationships}
        nodes={state.nodes}
        progress={state.progress}
        activeDimension={state.activeDimension}
      />

      {/* Discrete Information State Nodes */}
      <StateFormation nodes={state.nodes} />

      {/* Completion Overlay Gateway */}
      {state.currentPhase === 'MEMORY_READY' && (
        <StudioTransition
          onEnterStudio={() => {
            actions.enterStudio();
            onEnterStudio?.();
          }}
          onRestart={actions.restart}
        />
      )}
    </div>
  );
};
