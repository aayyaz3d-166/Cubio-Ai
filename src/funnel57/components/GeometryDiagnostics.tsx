/**
 * 3D Memory Studio — Funnel 57
 * Component: GeometryDiagnostics
 *
 * Glass HUD displaying Three.js geometries, materials, vertex count, and GPU memory estimate.
 */

import React from 'react';
import { GeometryEngineStats } from '../types';
import { Box, Layers, Cpu, ShieldCheck, Database } from 'lucide-react';

interface GeometryDiagnosticsProps {
  stats: GeometryEngineStats;
}

export const GeometryDiagnostics: React.FC<GeometryDiagnosticsProps> = ({ stats }) => {
  const memoryKb = (stats.estimatedGpuMemoryBytes / 1024).toFixed(1);

  return (
    <div className="absolute top-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-cyan-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 gap-4">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D GEOMETRY & MATERIAL ENGINE</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
          F57
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Quality:</span>
          <span className="text-emerald-400 font-bold">{stats.qualityLevel}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Dimension:</span>
          <span className="text-cyan-400 font-bold">
            Z{stats.activeDimension} {stats.activeDimension > 3 ? '(PROJECTION)' : '(SPATIAL)'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Shared Geometries:</span>
          <span className="text-white font-bold">{stats.totalRegisteredGeometries}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Shared Materials:</span>
          <span className="text-purple-300 font-bold">{stats.totalRegisteredMaterials}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Active Meshes:</span>
          <span className="text-sky-400 font-bold">{stats.totalMeshes}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Total Vertex Count:</span>
          <span className="text-amber-400 font-bold">{stats.totalVertexCount}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Est. GPU Memory:</span>
          <span className="text-zinc-300">{memoryKb} KB</span>
        </div>
      </div>
    </div>
  );
};
