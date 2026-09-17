/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioBootScreen
 *
 * Fullscreen startup HUD displaying live boot dependencies, progress,
 * failure diagnostics, and smooth transition to Studio.
 */

import React from 'react';
import { useStudioBoot } from '../hooks/useStudioBoot';
import { StudioBootDiagnostics } from './StudioBootDiagnostics';
import { StudioBootFailure } from './StudioBootFailure';
import { StudioReadyState } from './StudioReadyState';
import { Sparkles } from 'lucide-react';

interface StudioBootScreenProps {
  children?: React.ReactNode;
}

export const StudioBootScreen: React.FC<StudioBootScreenProps> = ({ children }) => {
  const { snapshot, isReady, progress, failedDependency, error, retry } = useStudioBoot();

  if (snapshot.state === 'FAILED') {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center p-6 select-none font-mono">
        <StudioBootFailure
          failedDependency={failedDependency}
          error={error}
          onRetry={retry}
        />
        <div className="mt-6 w-full max-w-sm">
          <StudioBootDiagnostics dependencies={snapshot.dependencies} />
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center gap-6 p-6 select-none font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-cyan-900/50 rounded-full text-xs font-bold tracking-widest text-cyan-400 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Memory Studio Startup</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="text-xs font-extrabold tracking-wider">
              {snapshot.state.replace('_', ' ')} ({progress}%)
            </span>
          </div>
        </div>

        {/* Diagnostic Checklist */}
        <StudioBootDiagnostics dependencies={snapshot.dependencies} />

        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
