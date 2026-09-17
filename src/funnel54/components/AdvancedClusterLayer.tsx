/**
 * 3D Memory Studio — Funnel 54
 * Component: AdvancedClusterLayer
 *
 * SVG layer rendering semantic cluster boundary rings with member counts,
 * cluster focus highlights, and subtle labels.
 */

import React from 'react';
import { AdvancedSceneCluster } from '../types';

interface AdvancedClusterLayerProps {
  clusters: readonly AdvancedSceneCluster[];
  onSelectCluster?: (clusterId: string) => void;
}

export const AdvancedClusterLayer: React.FC<AdvancedClusterLayerProps> = ({
  clusters,
  onSelectCluster,
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <g transform="translate(50vw, 50vh)">
        {clusters.map((c) => {
          const opacity = c.isDimmed ? 0.08 : 0.3;

          return (
            <g
              key={c.clusterId}
              transform={`translate(${c.screenX}, ${c.screenY})`}
              onClick={() => onSelectCluster?.(c.clusterId)}
              className="cursor-pointer pointer-events-auto"
            >
              {/* Outer Cluster Boundary Ring */}
              <circle
                r={c.screenRadius}
                fill={c.colorHex}
                fillOpacity={c.isFocused ? 0.08 : 0.02}
                stroke={c.isFocused ? '#38bdf8' : c.colorHex}
                strokeWidth={c.isFocused ? 2 : 1}
                strokeOpacity={c.isFocused ? 0.7 : opacity}
                strokeDasharray="4 4"
              />
              {/* Cluster Title */}
              <text
                y={-c.screenRadius - 8}
                textAnchor="middle"
                fill={c.isFocused ? '#38bdf8' : c.colorHex}
                fillOpacity={c.isFocused ? 1.0 : opacity + 0.3}
                fontSize={9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {c.label} ({c.memberCount})
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
