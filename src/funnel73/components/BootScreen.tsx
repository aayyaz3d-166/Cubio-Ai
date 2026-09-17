/**
 * 3D Memory Studio — Funnel 73
 * Component: BootScreen
 *
 * Authoritative Browser Boot Overlay.
 * Replaces the static infinite loading spinner with deterministic phase diagnostics.
 * When READY, reveals the live Studio application.
 */

import React, { useState, useEffect } from 'react';
import { BrowserBootManager } from '../boot/bootManager';
import { useStudioBoot } from '../hooks/useStudioBoot';
import { BootProgress } from './BootProgress';
import { BootErrorScreen } from './BootErrorScreen';
import { RuntimeDiagnosticsPanel } from './RuntimeDiagnosticsPanel';
import { StudioRuntimeErrorBoundary } from '../errors/StudioRuntimeErrorBoundary';
import { Box } from 'lucide-react';

interface BootScreenProps {
  bootManager?: BrowserBootManager;
  children: React.ReactNode;
  autoStart?: boolean;
}

export const BootScreen: React.FC<BootScreenProps> = ({
  bootManager: customBootManager,
  children,
  autoStart = true,
}) => {
  const [manager] = useState(() => customBootManager ?? new BrowserBootManager());
  const {
    diagnostics,
    phaseRecords,
    percentage,
    isReady,
    isError,
    startBoot,
    retryBoot,
  } = useStudioBoot(manager);

  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    if (autoStart && manager.getPhase() === 'UNMOUNTED') {
      startBoot();
    }
  }, [autoStart, manager, startBoot]);

  // When READY: render the actual application wrapped in F73 runtime error boundary!
  if (isReady) {
    return (
      <StudioRuntimeErrorBoundary>
        <div data-studio-root="true" className="w-full h-full">
          {children}
        </div>
      </StudioRuntimeErrorBoundary>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070709] text-white p-6 font-mono select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1A1A22_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center space-y-6">
        {/* Branding */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#121216] border border-cyan-900/60 rounded-2xl shadow-xl">
            <Box className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-lg font-bold tracking-widest text-zinc-100">3D MEMORY STUDIO</h1>
          <p className="text-xs text-zinc-500 font-mono">BROWSER RUNTIME ACTIVATION</p>
        </div>

        {/* State View */}
        {isError ? (
          <BootErrorScreen
            diagnostics={diagnostics}
            onRetry={retryBoot}
            onToggleDiagnostics={() => setShowDiagnostics((s) => !s)}
          />
        ) : (
          <BootProgress phases={phaseRecords} percentage={percentage} />
        )}
      </div>

      {/* Diagnostics Panel Modal */}
      {showDiagnostics && (
        <RuntimeDiagnosticsPanel
          diagnostics={diagnostics}
          onClose={() => setShowDiagnostics(false)}
        />
      )}
    </div>
  );
};
