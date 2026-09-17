/**
 * 3D Memory Studio — Funnel 53
 * Component: ClusterLayer
 *
 * SVG layer rendering semantic cluster boundary rings and titles.
 */

import React from 'react';
import { StudioClusterViewModel } from '../types';

interface ClusterLayerProps {
  clusters: readonly StudioClusterViewModel[];
}

export const ClusterLayer: React.FC<ClusterLayerProps> = ({ clusters }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <g transform="translate(50vw, 50vh)">
        {clusters.map((c) => (
          <g key={c.clusterId} transform={`translate(${c.screenX}, ${c.screenY})`}>
            {/* Outer Cluster Boundary Ring */}
            <circle
              r={c.screenRadius}
              fill={c.colorHex}
              fillOpacity={0.03}
              stroke={c.colorHex}
              strokeWidth={1}
              strokeOpacity={0.25}
              strokeDasharray="4 4"
            />
            {/* Cluster Title */}
            <text
              y={-c.screenRadius - 8}
              textAnchor="middle"
              fill={c.colorHex}
              fillOpacity={0.7}
              fontSize={9}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {c.label} ({c.memberCount})
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
