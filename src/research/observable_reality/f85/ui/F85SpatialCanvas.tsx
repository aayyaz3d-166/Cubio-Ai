/**
 * 3D Memory Studio — Funnel 85
 * Component: F85SpatialCanvas
 *
 * Visual Spatial Canvas rendering F85DisplayState with geometry,
 * collision detection halos, depth cues, and coordinate telemetry.
 */

import React from 'react';
import { F85DisplayState, F85ObserverState } from '../types';

interface F85SpatialCanvasProps {
  display: F85DisplayState;
  observer: F85ObserverState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F85SpatialCanvas: React.FC<F85SpatialCanvasProps> = ({
  display,
  observer,
  selectedObjectId,
  onSelectObject,
}) => {
  const width = display.width || 800;
  const height = display.height || 500;
  const centerX = width / 2;
  const centerY = height / 2;

  const collisionPairs = display.collisionReport.collisionPairs;
  const collidingIds = new Set(collisionPairs.flat());

  return (
    <div className="relative w-full h-[500px] bg-[#09090d] rounded-2xl border border-zinc-800/90 overflow-hidden flex flex-col items-center justify-center select-none font-mono shadow-2xl">
      {/* Top Header Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>EXPERIMENT: {display.experimentType}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>OBSERVER: {observer.name}</span>
        <span className="text-zinc-700">|</span>
        <span>PROJ: {display.projectionType}</span>
        <span className="text-zinc-700">|</span>
        <span className={display.collisionReport.collisionCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
          {display.collisionReport.collisionCount > 0
            ? `⚠️ COLLISIONS: ${display.collisionReport.collisionCount}`
            : '✓ 0 COLLISIONS'}
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-purple-300">
          DISTINCT POSITIONS: {display.collisionReport.uniqueScreenPositions} / 7
        </span>
      </div>

      {/* SVG Canvas */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid pattern */}
        <defs>
          <pattern id="f85-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f85-grid)" />

        {/* Center axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Connector Spokes between related objects if in 3D Cube or Dimensional */}
        {display.objectRecords.map((r, i) => {
          if (!r.visible) return null;
          return display.objectRecords.slice(i + 1).map((r2) => {
            if (!r2.visible) return null;
            // Draw faint line if close in world space
            const dx = r.worldPosition[0] - r2.worldPosition[0];
            const dy = r.worldPosition[1] - r2.worldPosition[1];
            const dz = r.worldPosition[2] - r2.worldPosition[2];
            const wDist = Math.hypot(dx, dy, dz);
            if (wDist > 0 && wDist <= 14) {
              return (
                <line
                  key={`${r.id}-${r2.id}`}
                  x1={r.screenPosition[0]}
                  y1={r.screenPosition[1]}
                  x2={r2.screenPosition[0]}
                  y2={r2.screenPosition[1]}
                  stroke="rgba(6, 182, 212, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              );
            }
            return null;
          });
        })}

        {/* Object Nodes */}
        {display.objectRecords.map((r) => {
          if (!r.visible) return null;
          const [sx, sy] = r.screenPosition;
          const isSelected = selectedObjectId === r.id;
          const isColliding = collidingIds.has(r.id);

          return (
            <g
              key={r.id}
              onClick={() => onSelectObject && onSelectObject(r.id)}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Collision Alert Halo */}
              {isColliding && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r.screenRadius + 10}
                  fill="rgba(245, 158, 11, 0.1)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r.screenRadius + 8}
                  fill="rgba(168, 85, 247, 0.2)"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Main Node Body */}
              <circle
                cx={sx}
                cy={sy}
                r={r.screenRadius}
                fill={isSelected ? '#c084fc' : isColliding ? '#f59e0b' : r.color}
                stroke={isSelected ? '#a855f7' : '#0891b2'}
                strokeWidth={1.5}
              />

              {/* Monospace Label and Coordinates */}
              <g transform={`translate(${sx + r.screenRadius + 6}, ${sy - 12})`}>
                <rect
                  x={0}
                  y={0}
                  width={r.label.length * 6.2 + 8}
                  height={15}
                  rx={3}
                  fill={isSelected ? 'rgba(88, 28, 135, 0.9)' : 'rgba(20, 20, 24, 0.9)'}
                  stroke={isSelected ? '#a855f7' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={1}
                />
                <text
                  x={4}
                  y={11}
                  fill={isSelected ? '#ffffff' : '#e4e4e7'}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {r.label}
                </text>

                {/* Subtext with World Pos and Screen Pos */}
                <text
                  x={4}
                  y={24}
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  W:[{r.worldPosition.join(',')}] → S:[{Math.round(sx)},{Math.round(sy)}]
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
