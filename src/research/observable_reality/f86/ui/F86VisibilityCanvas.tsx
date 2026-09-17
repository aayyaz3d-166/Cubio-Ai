/**
 * 3D Memory Studio — Funnel 86
 * Component: F86VisibilityCanvas
 *
 * Canvas renderer visually distinguishing visible, occluded, and out-of-FOV nodes.
 */

import React from 'react';
import { F86DisplayState, F86ObserverState } from '../types';

interface F86VisibilityCanvasProps {
  display: F86DisplayState;
  observer: F86ObserverState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F86VisibilityCanvas: React.FC<F86VisibilityCanvasProps> = ({
  display,
  observer,
  selectedObjectId,
  onSelectObject,
}) => {
  const width = display.width || 800;
  const height = display.height || 500;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className="relative w-full h-[500px] bg-[#09090d] rounded-2xl border border-zinc-800/90 overflow-hidden flex flex-col items-center justify-center select-none font-mono shadow-2xl">
      {/* Top Header Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>SCENE: {display.sceneType}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>OBSERVER: {observer.name}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-emerald-400 font-bold">VISIBLE: {display.occlusionReport.totalVisible} / 7</span>
        <span className="text-zinc-700">|</span>
        <span className={display.occlusionReport.totalOccluded > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
          OCCLUDED: {display.occlusionReport.totalOccluded}
        </span>
        <span className="text-zinc-700">|</span>
        <span className={display.occlusionReport.totalOutsideFov > 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
          OUT OF FOV: {display.occlusionReport.totalOutsideFov}
        </span>
        <span className="text-zinc-700">|</span>
        <span className={display.occlusionReport.totalBehindObserver > 0 ? 'text-purple-400 font-bold' : 'text-zinc-500'}>
          BEHIND: {display.occlusionReport.totalBehindObserver}
        </span>
      </div>

      {/* SVG Canvas */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid pattern */}
        <defs>
          <pattern id="f86-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f86-grid)" />

        {/* FOV Cone representation overlay */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Occlusion Ray Connectors */}
        {display.occlusionReport.occluderPairs.map(([occluderId, occludedId]) => {
          const occ1 = display.objectRecords.find((r) => r.id === occluderId);
          const occ2 = display.objectRecords.find((r) => r.id === occludedId);
          if (occ1 && occ2) {
            return (
              <line
                key={`${occluderId}->${occludedId}`}
                x1={occ1.screenPosition[0]}
                y1={occ1.screenPosition[1]}
                x2={occ2.screenPosition[0]}
                y2={occ2.screenPosition[1]}
                stroke="rgba(245, 158, 11, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            );
          }
          return null;
        })}

        {/* Objects */}
        {display.objectRecords.map((r) => {
          const [sx, sy] = r.screenPosition;
          const isSelected = selectedObjectId === r.id;
          const isOccluded = r.visibilityReason === 'OCCLUDED';
          const isPartiallyOccluded = r.visibilityReason === 'PARTIALLY_OCCLUDED';
          const isOutside = r.visibilityReason === 'OUTSIDE_FOV' || r.visibilityReason === 'BEHIND_OBSERVER';

          // Position clamping for outside FOV indicators
          const clampedSx = Math.max(30, Math.min(width - 30, sx));
          const clampedSy = Math.max(30, Math.min(height - 30, sy));

          return (
            <g
              key={r.id}
              onClick={() => onSelectObject && onSelectObject(r.id)}
              className="cursor-pointer transition-all duration-200"
              opacity={isOccluded ? 0.35 : isOutside ? 0.25 : isPartiallyOccluded ? 0.75 : 1.0}
            >
              {/* Selection Ring */}
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

              {/* Node Geometry */}
              <circle
                cx={clampedSx}
                cy={clampedSy}
                r={r.screenRadius}
                fill={
                  isOccluded
                    ? 'rgba(245, 158, 11, 0.15)'
                    : isOutside
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isSelected
                    ? '#c084fc'
                    : r.color
                }
                stroke={
                  isOccluded
                    ? '#f59e0b'
                    : isOutside
                    ? '#ef4444'
                    : isSelected
                    ? '#a855f7'
                    : '#0891b2'
                }
                strokeWidth={isOccluded ? 1.5 : 1.5}
                strokeDasharray={isOccluded || isOutside ? '3 3' : undefined}
              />

              {/* Status Badge & Label */}
              <g transform={`translate(${clampedSx + r.screenRadius + 6}, ${clampedSy - 12})`}>
                <rect
                  x={0}
                  y={0}
                  width={r.label.length * 6.2 + 10}
                  height={15}
                  rx={3}
                  fill={
                    isSelected
                      ? 'rgba(88, 28, 135, 0.9)'
                      : isOccluded
                      ? 'rgba(120, 53, 15, 0.85)'
                      : 'rgba(20, 20, 24, 0.85)'
                  }
                  stroke={isSelected ? '#a855f7' : isOccluded ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={1}
                />
                <text
                  x={4}
                  y={11}
                  fill={isSelected ? '#ffffff' : isOccluded ? '#fde68a' : '#e4e4e7'}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {r.label}
                </text>

                {/* Subtext with depth and reason */}
                <text
                  x={4}
                  y={24}
                  fill={isOccluded ? '#f59e0b' : isOutside ? '#ef4444' : '#71717a'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {r.visibilityReason} | Depth: {r.depthZ.toFixed(1)}
                  {r.occludedBy ? ` (by ${r.occludedBy.replace('STATE49:', '')})` : ''}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
