/**
 * 3D Memory Studio — Funnel 88
 * Component: F88InformationCanvas
 *
 * Canvas renderer visually demonstrating Reality X, Observation Pipeline,
 * and Display D with information loss, occlusions, and equivalence classes.
 */

import React from 'react';
import { F88DisplayState, F88ObserverState, F88SpatialState } from '../types';

interface F88InformationCanvasProps {
  state: F88SpatialState;
  display: F88DisplayState;
  observer: F88ObserverState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F88InformationCanvas: React.FC<F88InformationCanvasProps> = ({
  state,
  display,
  observer,
  selectedObjectId,
  onSelectObject,
}) => {
  const width = display.width || 800;
  const height = display.height || 500;
  const centerX = width / 2;
  const centerY = height / 2;

  const isUnique = display.informationMetrics.isInverseUnique;

  return (
    <div className="relative w-full h-[500px] bg-[#09090d] rounded-2xl border border-zinc-800/90 overflow-hidden flex flex-col items-center justify-center select-none font-mono shadow-2xl">
      {/* Top Header Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>EXPERIMENT: {display.experimentType}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>PROJECTION: {display.projectionType}</span>
        <span className="text-zinc-700">|</span>
        <span className={isUnique ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
          {isUnique ? '✓ INVERSE UNIQUE (1:1)' : '⚠️ INVERSE NON-UNIQUE (1-TO-MANY)'}
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-purple-300">
          VISIBLE: {display.informationMetrics.visibleObjectsInDisplay} / {state.objects.length}
        </span>
      </div>

      {/* SVG Canvas */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid pattern */}
        <defs>
          <pattern id="f88-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f88-grid)" />

        {/* Center axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Ray Lines */}
        {display.objectRecords.map((r) => {
          if (!r.visibleInDisplay) return null;
          return (
            <line
              key={`ray-${r.id}`}
              x1={centerX}
              y1={centerY}
              x2={r.screenPosition[0]}
              y2={r.screenPosition[1]}
              stroke="rgba(6, 182, 212, 0.12)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          );
        })}

        {/* Render Objects */}
        {display.objectRecords.map((r) => {
          const [sx, sy] = r.screenPosition;
          const isSelected = selectedObjectId === r.id;
          const isHidden = !r.visibleInDisplay;

          const clampedSx = Math.max(30, Math.min(width - 30, sx));
          const clampedSy = Math.max(30, Math.min(height - 30, sy));

          return (
            <g
              key={r.id}
              onClick={() => onSelectObject && onSelectObject(r.id)}
              className="cursor-pointer transition-all duration-200"
              opacity={isHidden ? 0.3 : 1.0}
            >
              {/* Selection Halo */}
              {isSelected && (
                <circle
                  cx={clampedSx}
                  cy={clampedSy}
                  r={r.screenRadius + 8}
                  fill="rgba(168, 85, 247, 0.2)"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Node Circle */}
              <circle
                cx={clampedSx}
                cy={clampedSy}
                r={r.screenRadius}
                fill={isHidden ? 'rgba(239, 68, 68, 0.15)' : isSelected ? '#c084fc' : r.color}
                stroke={isHidden ? '#ef4444' : isSelected ? '#a855f7' : '#0891b2'}
                strokeWidth={1.5}
                strokeDasharray={isHidden ? '3 3' : undefined}
              />

              {/* Label & Telemetry */}
              <g transform={`translate(${clampedSx + r.screenRadius + 6}, ${clampedSy - 12})`}>
                <rect
                  x={0}
                  y={0}
                  width={r.label.length * 6.2 + 8}
                  height={15}
                  rx={3}
                  fill={
                    isSelected
                      ? 'rgba(88, 28, 135, 0.9)'
                      : isHidden
                      ? 'rgba(127, 29, 29, 0.85)'
                      : 'rgba(20, 20, 24, 0.85)'
                  }
                  stroke={isSelected ? '#a855f7' : isHidden ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={1}
                />
                <text
                  x={4}
                  y={11}
                  fill={isSelected ? '#ffffff' : isHidden ? '#fca5a5' : '#e4e4e7'}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {r.label}
                </text>

                {/* Subtext */}
                <text
                  x={4}
                  y={24}
                  fill={isHidden ? '#ef4444' : '#71717a'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {isHidden ? '[HIDDEN IN DISPLAY]' : `W:[${r.worldPosition.join(',')}] → S:[${Math.round(sx)},${Math.round(sy)}]`}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
