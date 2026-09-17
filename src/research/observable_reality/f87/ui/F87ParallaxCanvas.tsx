/**
 * 3D Memory Studio — Funnel 87
 * Component: F87ParallaxCanvas
 *
 * Canvas renderer visually demonstrating parallax displacement, depth cues, and ray geometry.
 */

import React from 'react';
import { F87DisplayState, F87ObserverState } from '../types';

interface F87ParallaxCanvasProps {
  display: F87DisplayState;
  observer: F87ObserverState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F87ParallaxCanvas: React.FC<F87ParallaxCanvasProps> = ({
  display,
  observer,
  selectedObjectId,
  onSelectObject,
}) => {
  const width = display.width || 800;
  const height = display.height || 500;
  const centerX = width / 2;
  const centerY = height / 2;

  const sortedRecords = [...display.objectRecords].sort((a, b) => a.depthZ - b.depthZ);
  const nearId = sortedRecords[0]?.id;
  const farId = sortedRecords[sortedRecords.length - 1]?.id;

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
        <span className="text-purple-400">PROJ: {display.projectionType}</span>
        <span className="text-zinc-700">|</span>
        {display.parallaxMeasurement && (
          <span className={display.parallaxMeasurement.isParallaxDetected ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
            PARALLAX Δ: {display.parallaxMeasurement.totalParallaxDifference.toFixed(1)} px
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid pattern */}
        <defs>
          <pattern id="f87-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f87-grid)" />

        {/* Center axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Depth Connection Spoke Rays */}
        {display.objectRecords.map((r) => {
          if (!r.visible) return null;
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

        {/* Objects (Render in reverse depth order so nearer draws on top) */}
        {[...display.objectRecords].reverse().map((r) => {
          if (!r.visible) return null;
          const [sx, sy] = r.screenPosition;
          const isSelected = selectedObjectId === r.id;
          const isNear = r.id === nearId;
          const isFar = r.id === farId;

          return (
            <g
              key={r.id}
              onClick={() => onSelectObject && onSelectObject(r.id)}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Near / Far Tag Halo */}
              {isNear && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r.screenRadius + 10}
                  fill="rgba(16, 185, 129, 0.1)"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {isFar && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r.screenRadius + 10}
                  fill="rgba(59, 130, 246, 0.1)"
                  stroke="#3b82f6"
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
                fill={isSelected ? '#c084fc' : isNear ? '#10b981' : isFar ? '#3b82f6' : r.color}
                stroke={isSelected ? '#a855f7' : isNear ? '#059669' : isFar ? '#2563eb' : '#0891b2'}
                strokeWidth={1.5}
              />

              {/* Monospace Label & Telemetry */}
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

                {/* Subtext with depth and screen coords */}
                <text
                  x={4}
                  y={24}
                  fill={isNear ? '#10b981' : isFar ? '#60a5fa' : '#71717a'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  Depth: {r.depthZ.toFixed(1)} | {isNear ? '[NEAR]' : isFar ? '[FAR]' : `Rank #${r.depthRank}`}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
