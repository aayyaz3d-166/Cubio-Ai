/**
 * CUBiO AI — Phase 25: 3D Spatial Map & 343-Cell HCP Lattice Visualizer
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * High-performance isometric 3D canvas rendering 343 discrete cells, Address 369 anchors,
 * density heatmaps, and animated reasoning trajectories.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { LatticeCell343, TrajectoryPathVector } from '../types';
import { Layers, Zap, Filter, Compass } from 'lucide-react';

interface SpatialMap3DProps {
  readonly cells: readonly LatticeCell343[];
  readonly activeTrajectory: TrajectoryPathVector | null;
  readonly onSelectCell: (cellId: string) => void;
  readonly onSimulateTrajectory?: () => void;
}

export const SpatialMap3D: React.FC<SpatialMap3DProps> = ({
  cells,
  activeTrajectory,
  onSelectCell,
  onSimulateTrajectory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLayerZ, setSelectedLayerZ] = useState<number | 'ALL'>('ALL');
  const [triadFilter, setTriadFilter] = useState<string>('ALL');
  const [hoveredCell, setHoveredCell] = useState<LatticeCell343 | null>(null);

  // Filter cells based on layer and triad
  const visibleCells = useMemo(() => {
    return cells.filter((c) => {
      if (selectedLayerZ !== 'ALL' && c.z !== selectedLayerZ) return false;
      if (triadFilter === '3' && c.harmonicRoot !== 3) return false;
      if (triadFilter === '6' && c.harmonicRoot !== 6) return false;
      if (triadFilter === '9' && c.harmonicRoot !== 9) return false;
      return true;
    });
  }, [cells, selectedLayerZ, triadFilter]);

  // Isometric 3D Projection parameters
  const project3D = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    const scale = Math.min(width, height) / 14;
    const originX = width / 2;
    const originY = height / 2 + scale * 1.5;

    // Centered around lattice center (3, 3, 3)
    const cx = x - 3;
    const cy = y - 3;
    const cz = z - 3;

    const isoX = originX + (cx - cy) * Math.cos(Math.PI / 6) * scale;
    const isoY = originY + (cx + cy) * Math.sin(Math.PI / 6) * scale - cz * scale * 0.9;
    const depth = (cx + cy) * 10 + cz * 15;

    return { x: isoX, y: isoY, depth };
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Project and sort cells by depth for painter's algorithm
    const projectedNodes = visibleCells.map((cell) => {
      const proj = project3D(cell.x, cell.y, cell.z, width, height);
      return { cell, ...proj };
    });

    projectedNodes.sort((a, b) => a.depth - b.depth);

    // Draw active trajectory lines if present
    if (activeTrajectory && activeTrajectory.waypoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4'; // cyan-500
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;

      activeTrajectory.waypoints.forEach((wp, idx) => {
        const p = project3D(wp[0], wp[1], wp[2], width, height);
        if (idx === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    }

    // Render cells as high-tech 3D nodes
    projectedNodes.forEach(({ cell, x, y }) => {
      const isHovered = hoveredCell?.id === cell.id;
      const root = cell.harmonicRoot;

      let fillColor = '#334155'; // default slate-700
      let strokeColor = '#475569';
      let radius = 4.5;

      if (root === 9) {
        fillColor = '#f59e0b'; // amber-500
        strokeColor = '#fbbf24';
        radius = 7.0;
      } else if (root === 6) {
        fillColor = '#06b6d4'; // cyan-500
        strokeColor = '#22d3ee';
        radius = 5.5;
      } else if (root === 3) {
        fillColor = '#6366f1'; // indigo-500
        strokeColor = '#818cf8';
        radius = 5.5;
      } else if (cell.state === 'ACTIVE') {
        fillColor = '#10b981'; // emerald-500
        strokeColor = '#34d399';
        radius = 5.0;
      }

      if (isHovered) {
        radius += 3;
        strokeColor = '#ffffff';
      }

      // Draw node glow for harmonic triad anchors
      if (root === 9 || root === 6 || root === 3 || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = root === 9 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.2)';
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = isHovered ? 2.0 : 1.0;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    });
  }, [visibleCells, activeTrajectory, hoveredCell, project3D]);

  // Handle canvas click to select cell
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    for (const cell of visibleCells) {
      const p = project3D(cell.x, cell.y, cell.z, canvas.width, canvas.height);
      const dist = Math.hypot(p.x - clickX, p.y - clickY);
      if (dist <= 9) {
        onSelectCell(cell.id);
        return;
      }
    }
  };

  // Handle canvas mousemove for tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    let found: LatticeCell343 | null = null;
    for (const cell of visibleCells) {
      const p = project3D(cell.x, cell.y, cell.z, canvas.width, canvas.height);
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
      if (dist <= 9) {
        found = cell;
        break;
      }
    }
    setHoveredCell(found);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              3D Spatial Map — 343-Cell HCP Lattice
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                7×7×7 • ADDR 369
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Interactive 3D projection • Click node to open deep inspector
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Layer Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Z-Layer:</span>
            <select
              value={selectedLayerZ}
              onChange={(e) =>
                setSelectedLayerZ(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">ALL (343)</option>
              {[0, 1, 2, 3, 4, 5, 6].map((z) => (
                <option key={z} value={z} className="bg-slate-900">Layer {z}</option>
              ))}
            </select>
          </div>

          {/* Triad Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={triadFilter}
              onChange={(e) => setTriadFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Roots</option>
              <option value="9" className="bg-slate-900">Triad 9 (Vortex)</option>
              <option value="6" className="bg-slate-900">Triad 6 (Harmonic)</option>
              <option value="3" className="bg-slate-900">Triad 3 (Harmonic)</option>
            </select>
          </div>

          {/* Simulate Action */}
          {onSimulateTrajectory && (
            <button
              onClick={onSimulateTrajectory}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" /> Trajectory Pulse
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-96 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          className="w-full h-full cursor-pointer"
        />

        {/* Floating Tooltip */}
        {hoveredCell && (
          <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-sm pointer-events-none text-slate-200 space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              {hoveredCell.id}
              <span className="text-amber-400 font-semibold">[Addr {hoveredCell.address369}]</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Coords: ({hoveredCell.x}, {hoveredCell.y}, {hoveredCell.z}) • Triad: {hoveredCell.triadType}
            </div>
            <div className="text-[11px] text-cyan-300">
              Harmonic Root: {hoveredCell.harmonicRoot} • Density: {(hoveredCell.density * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-[10px] font-mono text-slate-400 space-y-1 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Root 9 (Vortex Anchor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
            <span>Root 6 (Harmonic)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Root 3 (Harmonic)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Active / Hot Locus</span>
          </div>
        </div>
      </div>
    </div>
  );
};