/**
 * 3D Memory Studio — Funnel 65
 * Component: StudioRuntimeApp
 *
 * Master Runtime Application coordinating Landing -> Start Studio -> Studio Workspace.
 * Integrated with F73 Diagnostics, F74 Landing Lifecycle, F75 Renderer Lifecycle, and F76 Workspace Boot.
 */

import React, { useState } from 'react';
import { useStudioRuntime } from '../hooks/useStudioRuntime';
import { LandingExperienceWrapper } from '../../funnel74/components/LandingExperienceWrapper';
import { StudioWorkspaceWrapper } from '../../funnel76/components/StudioWorkspaceWrapper';
import { BootScreen } from '../../funnel73/components/BootScreen';
import { RuntimeDiagnostics } from './RuntimeDiagnostics';
import { Activity } from 'lucide-react';

interface StudioRuntimeAppProps {
  onExit?: () => void;
}

export const StudioRuntimeApp: React.FC<StudioRuntimeAppProps> = ({ onExit }) => {
  const { screen, startStudio, diagnosticReport } = useStudioRuntime();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <BootScreen>
      <div className="relative w-screen h-screen bg-[#070709] overflow-hidden">
        {screen === 'LANDING' ? (
          <LandingExperienceWrapper onStartStudio={startStudio} />
        ) : (
          <StudioWorkspaceWrapper />
        )}

        {/* Floating Diagnostics Button */}
        <button
          onClick={() => setShowDiagnostics((s) => !s)}
          className="fixed bottom-3 left-3 z-50 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 backdrop-blur-xs shadow-xl transition cursor-pointer"
          title="Toggle Runtime Diagnostics"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Diagnostics Modal HUD */}
        {showDiagnostics && (
          <RuntimeDiagnostics
            report={diagnosticReport}
            onClose={() => setShowDiagnostics(false)}
          />
        )}
      </div>
    </BootScreen>
  );
};
