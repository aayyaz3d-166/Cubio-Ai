/**
 * 3D Memory Studio — Funnel 62
 * Component: MemoryStudioApp
 *
 * Full Experience Root: Landing (Interactive 3D Cube) → START → Studio Shell.
 */

import React from 'react';
import { useStudioExperience } from '../hooks/useStudioExperience';
import { StudioLanding } from '../landing/StudioLanding';
import { StudioShell } from '../studio/StudioShell';
import { DataProvider } from '../types';

interface MemoryStudioAppProps {
  dataProvider?: DataProvider;
  onExit?: () => void;
}

export const MemoryStudioApp: React.FC<MemoryStudioAppProps> = ({
  dataProvider,
  onExit,
}) => {
  const { coordinator, isReady, sessionState } = useStudioExperience(dataProvider);

  if (!isReady) {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center font-mono text-cyan-400 text-xs">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <div>INITIALIZING 3D MEMORY STUDIO...</div>
      </div>
    );
  }

  if (sessionState.currentScreen === 'LANDING') {
    return (
      <StudioLanding
        onStart={() => coordinator.startStudio()}
        isTransitioning={sessionState.isTransitioning}
      />
    );
  }

  return <StudioShell coordinator={coordinator} onExit={onExit} />;
};
