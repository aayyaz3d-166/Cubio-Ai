/**
 * 3D Memory Studio — Funnel 89
 * Component: F89ReconstructionCanvas
 *
 * Canvas renderer visually demonstrating Reality X, Observation Pipeline,
 * and Reconstructed Reality Model R with explicit certainty statuses.
 */

import React from 'react';
import {
  F89DisplayState,
  F89ObserverState,
  F89ReconstructedReality,
  F89SpatialState,
} from '../types';

interface F89ReconstructionCanvasProps {
  state: F89SpatialState;
  display: F89DisplayState;
  reconstruction: F89ReconstructedReality;
  observer: F89ObserverState;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string) => void;
}

export const F89ReconstructionCanvas: React.FC<F89ReconstructionCanvasProps> = ({
  state,
  display,
  reconstruction,
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
      {/* Top Header Telemetry */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>EXPERIMENT: {display.experimentType}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>OBSERVER: {observer.name}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-emerald-400 font-bold">
          KNOWN: {reconstruction.knownObjectsCount} / {state.objects.length}
        </span>
        <span className="text-zinc-700">|</span>
        <span className={reconstruction.ambiguousObjectsCount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
          AMBIGUOUS: {reconstruction.ambiguousObjectsCount}
        </span>
        <span className="text-zinc-700">|</span>
        <span className={reconstruction.hiddenObjectsCount > 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
          HIDDEN: {reconstruction.hiddenObjectsCount}
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-purple-300">
          CERTAINTY: {Math.round(reconstruction.overallCertaintyScore * 100)}%
        </span>
      </div>

      {/* SVG Canvas */}
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid pattern */}
        <defs>
          <pattern id="f89-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f89-grid)" />

        {/* Center axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Rays from Center to Observed Objects */}
        {display.observationRecords.map((r) => {
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

        {/* Reconstructed Objects */}
        {reconstruction.objects.map((rObj) => {
          const obsRec = display.observationRecords.find((o) => o.id === rObj.id);
          const sx = obsRec?.screenPosition[0] ?? centerX;
          const sy = obsRec?.screenPosition[1] ?? centerY;

          const isSelected = selectedObjectId === rObj.id;
          const isKnown = rObj.status === 'KNOWN';
          const isAmbiguous = rObj.status === 'AMBIGUOUS' || rObj.status === 'DIMENSIONALLY_COLLAPSED';
          const isHidden = rObj.status === 'HIDDEN' || rObj.status === 'OUTSIDE_FOV' || rObj.status === 'UNOBSERVED';

          const clampedSx = Math.max(30, Math.min(width - 30, sx));
          const clampedSy = Math.max(30, Math.min(height - 30, sy));
          const radius = obsRec?.apparentScale ? Math.max(5, Math.min(22, 6 + obsRec.apparentScale * 2)) : 8;

          return (
            <g
              key={rObj.id}
              onClick={() => onSelectObject && onSelectObject(rObj.id)}
              className="cursor-pointer transition-all duration-200"
              opacity={isHidden ? 0.35 : isAmbiguous ? 0.8 : 1.0}
            >
              {/* Selection Ring */}
              {isSelected && (
                <circle
                  cx={clampedSx}
                  cy={clampedSy}
                  r={radius + 8}
                  fill="rgba(168, 85, 247, 0.2)"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Status Halo */}
              {isAmbiguous && (
                <circle
                  cx={clampedSx}
                  cy={clampedSy}
                  r={radius + 6}
                  fill="rgba(245, 158, 11, 0.1)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Main Node Body */}
              <circle
                cx={clampedSx}
                cy={clampedSy}
                r={radius}
                fill={
                  isHidden
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isAmbiguous
                    ? 'rgba(245, 158, 11, 0.2)'
                    : isSelected
                    ? '#c084fc'
                    : rObj.color
                }
                stroke={
                  isHidden
                    ? '#ef4444'
                    : isAmbiguous
                    ? '#f59e0b'
                    : isSelected
                    ? '#a855f7'
                    : '#0891b2'
                }
                strokeWidth={1.5}
                strokeDasharray={isHidden || isAmbiguous ? '3 3' : undefined}
              />

              {/* Monospace Status Pill & Label */}
              <g transform={`translate(${clampedSx + radius + 6}, ${clampedSy - 12})`}>
                <rect
                  x={0}
                  y={0}
                  width={rObj.label.length * 6.2 + 8}
                  height={15}
                  rx={3}
                  fill={
                    isSelected
                      ? 'rgba(88, 28, 135, 0.9)'
                      : isHidden
                      ? 'rgba(127, 29, 29, 0.85)'
                      : isAmbiguous
                      ? 'rgba(120, 53, 15, 0.85)'
                      : 'rgba(20, 20, 24, 0.85)'
                  }
                  stroke={
                    isSelected
                      ? '#a855f7'
                      : isHidden
                      ? '#ef4444'
                      : isAmbiguous
                      ? '#f59e0b'
                      : 'rgba(255,255,255,0.1)'
                  }
                  strokeWidth={1}
                />
                <text
                  x={4}
                  y={11}
                  fill={
                    isSelected
                      ? '#ffffff'
                      : isHidden
                      ? '#fca5a5'
                      : isAmbiguous
                      ? '#fde68a'
                      : '#e4e4e7'
                  }
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {rObj.label}
                </text>

                {/* Subtext with Reality vs Reconstructed Coords */}
                <text
                  x={4}
                  y={24}
                  fill={isKnown ? '#10b981' : isAmbiguous ? '#f59e0b' : '#ef4444'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {rObj.status} [{rObj.certainty}] R:[{rObj.reconstructedPosition.map((v) => (v !== null ? v : '?')).join(',')}]
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
