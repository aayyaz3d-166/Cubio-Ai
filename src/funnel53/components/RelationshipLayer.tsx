/**
 * 3D Memory Studio — Funnel 53
 * Component: RelationshipLayer
 *
 * SVG layer rendering relational graph edges between active state nodes.
 */

import React from 'react';
import { StudioEdgeViewModel } from '../types';

interface RelationshipLayerProps {
  edges: readonly StudioEdgeViewModel[];
}

export const RelationshipLayer: React.FC<RelationshipLayerProps> = ({ edges }) => {
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
            stroke={edge.colorHex}
            strokeWidth={edge.strokeWidth}
            strokeOpacity={edge.opacity}
            strokeDasharray="4 3"
          />
        ))}
      </g>
    </svg>
  );
};
