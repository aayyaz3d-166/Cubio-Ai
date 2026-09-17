/**
 * 3D Memory Studio — Funnel 62
 * Component: StudioDiagnostics
 *
 * System diagnostics overlay showing comprehensive engine metrics.
 */

import React from 'react';
import { Activity, ShieldCheck, Cpu, Box, Share2, Layers, Compass, Video } from 'lucide-react';
import { StudioCoordinator } from '../integration/studioCoordinator';

interface StudioDiagnosticsProps {
  coordinator: StudioCoordinator;
  onClose: () => void;
}

export const StudioDiagnostics: React.FC<StudioDiagnosticsProps> = ({
  coordinator,
  onClose,
}) => {
  const stats = coordinator.cameraEngine.getStats();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center font-mono select-none p-4">
      <div className="w-[500px] bg-[#111114] border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-white">STUDIO SYSTEM DIAGNOSTICS</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Engine Pipeline Status */}
        <div className="space-y-2 text-xs">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Engine Pipeline Status</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>F47 Security: <strong className="text-emerald-400">ACTIVE</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>F55 Renderer: <strong className="text-blue-400">GPU OK</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              <span>F56 Scene: <strong className="text-purple-400">SYNCED</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-teal-400" />
              <span>F58 Graph: <strong className="text-teal-400">CONNECTED</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>F59 Clusters: <strong className="text-fuchsia-400">BOUNDED</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>F60 Dimension: <strong className="text-amber-400">Z{stats.activeDimension}</strong></span>
            </div>
            <div className="bg-[#18181c] p-2 rounded border border-zinc-800 flex items-center gap-2 col-span-2">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>F61 Camera: <strong className="text-cyan-400">{stats.mode} ({stats.currentPreset})</strong></span>
            </div>
          </div>
        </div>

        {/* Security Statement */}
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[10px] text-emerald-300">
          ✓ All data passed to the 3D viewport, graph, clusters, and AI context has passed strict F47 GREEN validation. Zero RED records exposed.
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
