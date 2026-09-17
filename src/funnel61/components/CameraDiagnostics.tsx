/**
 * 3D Memory Studio — Funnel 61
 * Component: CameraDiagnostics
 *
 * Glass HUD overlay displaying 3D camera and navigation telemetry.
 */

import React from 'react';
import { CameraEngineStats } from '../types';
import { Video, Compass, Eye, Move } from 'lucide-react';

interface CameraDiagnosticsProps {
  stats: CameraEngineStats;
}

export const CameraDiagnostics: React.FC<CameraDiagnosticsProps> = ({ stats }) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-cyan-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D CAMERA ENGINE</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
          F61
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Mode / Preset:</span>
          <span className="text-cyan-300 font-bold">
            {stats.mode} ({stats.currentPreset})
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Position:</span>
          <span className="text-zinc-200">
            [{stats.position[0].toFixed(0)}, {stats.position[1].toFixed(0)}, {stats.position[2].toFixed(0)}]
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Target:</span>
          <span className="text-zinc-200">
            [{stats.target[0].toFixed(0)}, {stats.target[1].toFixed(0)}, {stats.target[2].toFixed(0)}]
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Distance / FOV:</span>
          <span className="text-emerald-400 font-bold">
            {stats.distance.toFixed(0)}m / {stats.fov}°
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">View Dimension:</span>
          <span className="text-amber-400 font-bold">
            Z{stats.activeDimension} ({stats.isComputationalProjection ? 'PROJECTION' : 'ACTUAL 3D'})
          </span>
        </div>
      </div>
    </div>
  );
};
