/**
 * 3D Memory Studio — Funnel 54
 * Component: AdvancedRelationshipLayer
 *
 * SVG layer rendering relational edges with depth opacity, focused edge illumination,
 * and dashed flow animations.
 */

import React from 'react';
import { AdvancedSceneEdge } from '../types';

interface AdvancedRelationshipLayerProps {
  edges: readonly AdvancedSceneEdge[];
}

export const AdvancedRelationshipLayer: React.FC<AdvancedRelationshipLayerProps> = ({ edges }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <g transform="translate(50vw, 50vh)">
        {edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.isFocused ? '#38bdf8' : edge.colorHex}
            strokeWidth={edge.isFocused ? edge.strokeWidth * 1.5 : edge.strokeWidth}
            strokeOpacity={edge.depthOpacity}
            strokeDasharray="4 3"
          />
        ))}
      </g>
    </svg>
  );
};
