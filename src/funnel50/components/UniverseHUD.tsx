/**
 * 3D Memory Studio — Funnel 50
 * Component: UniverseHUD
 *
 * Top-left and bottom-right high-tech telemetry overlays.
 */

import React from 'react';
import { SimulationHUDTelemetry } from '../types';
import { ShieldCheck, Activity, Cpu, Box, Radio } from 'lucide-react';

interface UniverseHUDProps {
  telemetry: SimulationHUDTelemetry;
  activeViewMode: string;
}

export const UniverseHUD: React.FC<UniverseHUDProps> = ({ telemetry, activeViewMode }) => {
  return (
    <>
      {/* Top-Left Telemetry Box */}
      <div className="absolute top-3 left-3 bg-[#111113]/90 backdrop-blur-md border border-cyan-900/60 p-3 rounded-lg text-xs font-mono select-none shadow-xl pointer-events-auto z-20 space-y-2 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-white tracking-wider text-xs">INFORMATION UNIVERSE</span>
          </div>
          <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
            Z{telemetry.activeDimension}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-zinc-400">
            <span>Total States:</span>
            <strong className="text-white">{telemetry.totalStates}</strong>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>🟢 GREEN (Permitted):</span>
            <strong>{telemetry.greenStatesCount}</strong>
          </div>
          <div className="flex justify-between text-rose-400">
            <span>🔴 RED (Restricted):</span>
            <strong>{telemetry.redStatesCount}</strong>
          </div>
          <div className="flex justify-between text-sky-400">
            <span>🤖 LLM Models:</span>
            <strong>{telemetry.llmModelsCount}</strong>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>Active Sector:</span>
            <strong className="truncate max-w-[100px]">{telemetry.activeCluster}</strong>
          </div>
        </div>
      </div>

      {/* Top-Right Simulation Status */}
      <div className="absolute top-3 right-3 bg-[#111113]/90 backdrop-blur-md border border-[#27272a] px-3 py-1.5 rounded-lg text-xs font-mono select-none shadow-xl z-20 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-zinc-400">SIMULATION:</span>
        <span className="text-emerald-400 font-bold tracking-wider">{telemetry.simulationStatus}</span>
        <span className="text-zinc-600">|</span>
        <span className="text-cyan-300 text-[11px]">{activeViewMode.replace(/_/g, ' ')}</span>
      </div>

      {/* Bottom-Right Performance & Render Budget HUD */}
      <div className="absolute bottom-3 right-3 bg-[#111113]/90 backdrop-blur-md border border-[#27272a] px-3 py-2 rounded-lg text-[11px] font-mono select-none shadow-xl z-20 flex items-center gap-4 text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>FPS: <strong className="text-white">{telemetry.fps}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>Visible: <strong className="text-white">{telemetry.visibleNodesCount}</strong> / {telemetry.renderBudgetMaxStates}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>F47 Guard Active</span>
        </div>
      </div>
    </>
  );
};
