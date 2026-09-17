/**
 * 3D Memory Studio — Funnel 83
 * Component: F83ObserverCanvas
 *
 * Crisp scientific 2D/3D projection visualizer for current ObservableFrame.
 */

import React from 'react';
import { ObservationFrame } from '../../f82/types';
import { ObserverFrameConfig } from '../types';

interface F83ObserverCanvasProps {
  frame: ObservationFrame;
  observerConfig: ObserverFrameConfig;
}

export const F83ObserverCanvas: React.FC<F83ObserverCanvasProps> = ({ frame, observerConfig }) => {
  const width = 600;
  const height = 360;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 14;

  return (
    <div className="relative w-full h-[360px] bg-zinc-950/90 rounded-xl border border-zinc-800/80 overflow-hidden flex flex-col items-center justify-center p-4 select-none">
      {/* Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>PROJECTION: {observerConfig.projectionType}</span>
        <span className="text-zinc-600">|</span>
        <span>OBJECTS: {frame.visibleObjects.length}</span>
      </div>

      <svg width={width} height={height} className="w-full h-full">
        {/* Grid lines */}
        <defs>
          <pattern id="f83-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#f83-grid)" />

        {/* Center axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

        {/* Rendered Visible Objects */}
        {frame.visibleObjects.map((obj) => {
          const [px, py, pz] = obj.position;
          const sx = centerX + px * scale;
          const sy = centerY - py * scale;
          const radius = Math.max(4, 8 * obj.apparentScale);
          const color = (obj.visibleProperties.color as string) || '#06b6d4';

          return (
            <g key={obj.id} className="transition-all duration-300">
              {/* Projected halo ring */}
              <circle
                cx={sx}
                cy={sy}
                r={radius + 4}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="2 2"
              />
              {/* Center point */}
              <circle
                cx={sx}
                cy={sy}
                r={radius}
                fill={color}
                fillOpacity="0.7"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Object label & coords */}
              <text
                x={sx + radius + 6}
                y={sy + 3}
                fill="#e4e4e7"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="600"
              >
                {obj.id}
              </text>
              <text
                x={sx + radius + 6}
                y={sy + 16}
                fill="#a1a1aa"
                fontSize="9"
                fontFamily="monospace"
              >
                {`[${px.toFixed(1)}, ${py.toFixed(1)}, ${pz.toFixed(1)}] (s:${obj.apparentScale.toFixed(2)})`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Footer Info */}
      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
        {`FOV: ${observerConfig.fovDegrees}° | Focal: ${observerConfig.focalLength} | Slice W: ${observerConfig.sliceW}`}
      </div>
    </div>
  );
};
