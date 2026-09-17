/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Graph UI Component
 *
 * Interactive visual representation of the World Model Relationship Graph.
 * Differentiates DIRECT (solid) vs INFERRED (dashed) relationships.
 */

import React from 'react';
import { WorldModel, WorldEntity, WorldRelation, Inference } from '../types';
import { Network, Circle } from 'lucide-react';

export interface R11WorldGraphProps {
  readonly model: WorldModel;
  readonly selectedEntityId: string | null;
  readonly onSelectEntity: (entityId: string) => void;
}

export const R11WorldGraph: React.FC<R11WorldGraphProps> = ({
  model,
  selectedEntityId,
  onSelectEntity,
}) => {
  const entities: readonly WorldEntity[] = Object.values(model.entities);
  const relations = model.relations;
  const inferences = model.inferences;

  // Compute circular layout for nodes in SVG canvas
  const centerX = 200;
  const centerY = 140;
  const radius = 100;

  const nodePositions = new Map<string, { x: number; y: number }>();
  entities.forEach((ent, idx) => {
    const angle = (idx / Math.max(1, entities.length)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(ent.entityId, { x, y });
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#090D16',
        borderRadius: '8px',
        border: '1px solid #1E293B',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0F172A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#93C5FD' }}>
            SPATIAL RELATIONSHIP GRAPH
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '9px', fontWeight: 600 }}>
          <span style={{ color: '#38BDF8' }}>● DIRECT</span>
          <span style={{ color: '#A78BFA' }}>- - INFERRED</span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 280">
          {/* Direct Edges (Solid cyan) */}
          {relations.map((rel) => {
            const p1 = nodePositions.get(rel.sourceEntityId);
            const p2 = nodePositions.get(rel.targetEntityId);
            if (!p1 || !p2) return null;

            return (
              <g key={rel.relationId}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
              </g>
            );
          })}

          {/* Inferred Edges (Dashed purple) */}
          {inferences.map((inf) => {
            const p1 = nodePositions.get(inf.derivedRelation.sourceEntityId);
            const p2 = nodePositions.get(inf.derivedRelation.targetEntityId);
            if (!p1 || !p2) return null;

            return (
              <g key={inf.inferenceId}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#A78BFA"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeOpacity="0.8"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {entities.map((ent) => {
            const pos = nodePositions.get(ent.entityId);
            if (!pos) return null;
            const isSelected = ent.entityId === selectedEntityId;
            const isObserved = ent.origin === 'OBSERVED';
            const nodeFill = isObserved ? '#059669' : '#2563EB';

            return (
              <g
                key={ent.entityId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectEntity(ent.entityId)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isSelected ? 14 : 11}
                  fill={nodeFill}
                  stroke={isSelected ? '#FBBF24' : '#1E293B'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  y={22}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="9px"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {ent.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
