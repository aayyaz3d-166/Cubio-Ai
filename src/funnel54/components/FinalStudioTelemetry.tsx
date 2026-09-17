/**
 * 3D Memory Studio — Funnel 54
 * Component: FinalStudioTelemetry
 *
 * Minimalist top-right quantitative HUD.
 */

import React from 'react';
import { SimulationTelemetry } from '../../funnel52/types';
import { Activity, Clock, ShieldCheck, Layers, Network } from 'lucide-react';

interface FinalStudioTelemetryProps {
  telemetry: SimulationTelemetry;
}

export const FinalStudioTelemetry: React.FC<FinalStudioTelemetryProps> = ({ telemetry }) => {
  return (
    <div className="flex items-center gap-3 text-xs font-mono select-none">
      {/* Live Badge & Time */}
      <div className="bg-[#111114]/90 backdrop-blur-md border border-cyan-900/60 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold text-white tracking-wider">LIVE</span>
        <span className="text-zinc-500">•</span>
        <div className="flex items-center gap-1 text-zinc-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{telemetry.simulationTimeFormatted}</span>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-3.5 text-[11px] text-zinc-300">
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Nodes: <strong className="text-white">{telemetry.activeNodesCount}</strong></span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <Network className="w-3 h-3 text-purple-400" />
          <span>Links: <strong className="text-white">{telemetry.relationshipsCount}</strong></span>
        </div>

        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-amber-400" />
          <span><strong className="text-white">Z{telemetry.dimension}</strong></span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>🟢 {telemetry.greenCount}</span>
        </div>

        <div className="text-zinc-400">
          <strong className="text-emerald-400">{telemetry.fps}</strong> FPS
        </div>
      </div>
    </div>
  );
};
