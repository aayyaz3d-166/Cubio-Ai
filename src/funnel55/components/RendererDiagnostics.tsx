/**
 * 3D Memory Studio — Funnel 55
 * Component: RendererDiagnostics
 *
 * Minimal glass diagnostic HUD for renderer capabilities and performance stats.
 */

import React from 'react';
import { RendererStats, RendererCapabilities } from '../types';
import { Activity, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface RendererDiagnosticsProps {
  stats: RendererStats;
  capabilities: RendererCapabilities;
}

export const RendererDiagnostics: React.FC<RendererDiagnosticsProps> = ({
  stats,
  capabilities,
}) => {
  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-cyan-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D RENDERER FOUNDATION</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
          F55
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Backend:</span>
          <span className="text-cyan-400 font-bold">{stats.rendererType}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">WebGL:</span>
          <span className={capabilities.webglAvailable ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {capabilities.webglAvailable ? `READY (v${capabilities.webglVersion})` : 'FALLBACK (2D)'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">FPS / Frame:</span>
          <span className="text-emerald-400 font-bold">
            {stats.fps} FPS ({stats.frameTimeMs}ms)
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">DPR (Bounded):</span>
          <span className="text-zinc-300 font-semibold">{stats.dpr.toFixed(1)}x (Max 2.0x)</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Viewport:</span>
          <span className="text-zinc-300">{stats.canvasWidth} × {stats.canvasHeight}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Active Objects:
          </span>
          <span className="text-purple-300 font-bold">{stats.activeObjects}</span>
        </div>
      </div>
    </div>
  );
};
