/**
 * 3D Memory Studio — Funnel 64
 * Component: WorkspaceDiagnostics
 *
 * Workspace telemetry and diagnostics HUD.
 */

import React from 'react';
import { Activity, ShieldCheck, Layers, Layout, Compass, Video } from 'lucide-react';
import { StudioWorkspaceManager } from '../workspace/workspaceManager';

interface WorkspaceDiagnosticsProps {
  workspace: StudioWorkspaceManager;
  onClose: () => void;
}

export const WorkspaceDiagnostics: React.FC<WorkspaceDiagnosticsProps> = ({
  workspace,
  onClose,
}) => {
  const snapshot = workspace.getContextSnapshot();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center font-mono select-none p-4">
      <div className="w-[480px] bg-[#111114] border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-white">WORKSPACE DIAGNOSTICS</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* State Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
            <Layout className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layout: <strong className="text-cyan-400">{snapshot.layout}</strong></span>
          </div>
          <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Panels: <strong className="text-fuchsia-400">{snapshot.visiblePanelIds.length} visible</strong></span>
          </div>
          <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Dimension: <strong className="text-amber-400">Z{snapshot.activeDimension}</strong></span>
          </div>
          <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Camera: <strong className="text-purple-400">{snapshot.cameraMode}</strong></span>
          </div>
        </div>

        {/* Selection Status */}
        <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 text-xs space-y-1">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Authoritative Selection</div>
          <div className="text-white font-bold truncate">
            {snapshot.selectedStateId || 'None (Universe Centered)'}
          </div>
        </div>

        {/* Security Statement */}
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[10px] text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>F47 Security boundary strictly active: Zero RED records permitted in workspace.</span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
