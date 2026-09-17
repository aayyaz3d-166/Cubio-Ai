/**
 * 3D Memory Studio — Funnel 64
 * Component: StudioWorkspace
 *
 * Top-level Studio Workspace Root.
 */

import React from 'react';
import { useStudioWorkspace } from '../hooks/useStudioWorkspace';
import { WorkspaceShell } from './WorkspaceShell';

export const StudioWorkspace: React.FC = () => {
  const { workspace, isReady } = useStudioWorkspace();

  if (!isReady) {
    return (
      <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center font-mono text-cyan-400 text-xs select-none">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <div>INITIALIZING 3D STUDIO WORKSPACE...</div>
      </div>
    );
  }

  return <WorkspaceShell workspace={workspace} />;
};
