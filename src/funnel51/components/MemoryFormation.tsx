/**
 * 3D Memory Studio — Funnel 51
 * Component: MemoryFormation
 *
 * Visual representation of relationship edges, 369 linkages,
 * and dimensional shells ($Z_1 \dots Z_{16}$).
 */

import React from 'react';
import { VisualRelationship, VisualStateNode } from '../types';

interface MemoryFormationProps {
  relationships: readonly VisualRelationship[];
  nodes: readonly VisualStateNode[];
  progress: number;
  activeDimension: number;
}

export const MemoryFormation: React.FC<MemoryFormationProps> = ({
  relationships,
  nodes,
  progress,
  activeDimension,
}) => {
  const nodeMap = new Map<string, VisualStateNode>(nodes.map((n) => [n.nodeId, n]));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
      {/* Dimensional Boundary Rings */}
      <div
        className="absolute rounded-full border border-cyan-500/20 transition-all duration-300"
        style={{
          width: '320px',
          height: '320px',
          opacity: Math.min(0.4, progress * 0.6),
          transform: `rotate(${progress * 90}deg)`,
        }}
      />
      <div
        className="absolute rounded-full border border-dashed border-purple-500/20 transition-all duration-300"
        style={{
          width: '440px',
          height: '440px',
          opacity: Math.min(0.3, (progress - 0.3) * 0.5),
          transform: `rotate(-${progress * 60}deg)`,
        }}
      />

      {/* SVG Canvas for Relational Linkages */}
      <svg className="absolute inset-0 w-full h-full">
        <g transform="translate(50vw, 50vh)">
          {relationships.map((rel) => {
            const src = nodeMap.get(rel.sourceNodeId);
            const tgt = nodeMap.get(rel.targetNodeId);
            if (!src || !tgt) return null;

            return (
              <line
                key={rel.id}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={rel.colorHex}
                strokeWidth={1.5}
                strokeOpacity={rel.opacity}
                strokeDasharray="4 3"
              />
            );
          })}
        </g>
      </svg>

      {/* Bottom Dimensional Architecture Status Badge */}
      <div className="absolute bottom-6 flex items-center gap-3 bg-[#111114]/90 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 backdrop-blur-md shadow-xl">
        <span>Structure: <strong className="text-cyan-400">Ternary 369</strong></span>
        <span>•</span>
        <span>Coordinates: <strong className="text-amber-400">Hierarchical</strong></span>
        <span>•</span>
        <span>Space: <strong className="text-white">Z{activeDimension} Projection</strong></span>
      </div>
    </div>
  );
};
