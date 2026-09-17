/**
 * 3D Memory Studio — Funnel 84
 * Component: F84ObserverCanvas
 *
 * Scientific Perceptual Projection Canvas visualizing DisplayState D
 */

import React from 'react';
import { DisplayState, ObserverState, ProjectionState } from '../types';

interface F84ObserverCanvasProps {
  display: DisplayState;
  observer: ObserverState;
  projection: ProjectionState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F84ObserverCanvas: React.FC<F84ObserverCanvasProps> = ({
  display,
  observer,
  projection,
  selectedObjectId,
  onSelectObject,
}) => {
  const width = display.width || 800;
  const height = display.height || 600;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className="relative w-full h-[460px] bg-zinc-950/95 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-4 select-none font-mono shadow-2xl">
      {/* Top Left Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>OBSERVER: {observer.name}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>PROJ: {projection.projectionType}</span>
        <span className="text-zinc-700">|</span>
        <span>DIM: Z{observer.dimension} → Z{projection.targetDimension}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-emerald-400">VISIBLE: {display.displayObjects.filter((o) => o.visible).length}</span>
      </div>

      {/* SVG Projection Plane */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Subtle Grid Pattern */}
        <defs>
          <pattern id="f84-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f84-grid)" />

        {/* Center Guide Axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

        {/* Center Optical Crosshair */}
        <circle cx={centerX} cy={centerY} r={3} fill="#38bdf8" opacity={0.6} />

        {/* Display Objects */}
        {display.displayObjects.map((obj) => {
          if (!obj.visible) return null;
          const [sx, sy] = obj.screenCoordinates;
          const isSelected = selectedObjectId === obj.sourceObjectId || selectedObjectId === obj.id;

          return (
            <g
              key={obj.id}
              onClick={() => onSelectObject && onSelectObject(obj.sourceObjectId)}
              className="cursor-pointer transition-all duration-200"
              opacity={obj.opacity}
            >
              {/* Selection / Highlight Halo */}
              {isSelected && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={obj.screenRadius + 8}
                  fill="rgba(168, 85, 247, 0.2)"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Node Outer Disc */}
              <circle
                cx={sx}
                cy={sy}
                r={obj.screenRadius}
                fill={isSelected ? '#c084fc' : obj.screenColor}
                stroke={isSelected ? '#a855f7' : '#0891b2'}
                strokeWidth={1.5}
              />

              {/* Monospace Label Pill */}
              <g transform={`translate(${sx + obj.screenRadius + 6}, ${sy - 8})`}>
                <rect
                  x={0}
                  y={0}
                  width={obj.screenLabel.length * 6.5 + 10}
                  height={16}
                  rx={4}
                  fill={isSelected ? 'rgba(88, 28, 135, 0.9)' : 'rgba(24, 24, 27, 0.85)'}
                  stroke={isSelected ? '#a855f7' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={1}
                />
                <text
                  x={5}
                  y={11}
                  fill={isSelected ? '#ffffff' : '#e4e4e7'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {obj.screenLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
