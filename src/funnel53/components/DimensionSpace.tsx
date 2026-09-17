/**
 * 3D Memory Studio — Funnel 53
 * Component: DimensionSpace
 *
 * Primary 3D Spatial Canvas Viewport for rendering the Memory Universe.
 */

import React from 'react';
import { StudioViewModel } from '../types';
import { MemoryCore } from './MemoryCore';
import { InformationState } from './InformationState';
import { RelationshipLayer } from './RelationshipLayer';
import { ClusterLayer } from './ClusterLayer';

interface DimensionSpaceProps {
  viewModel: StudioViewModel;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onSelectNode: (stateId: string | null) => void;
  onHoverNode: (stateId: string | null) => void;
}

export const DimensionSpace: React.FC<DimensionSpaceProps> = ({
  viewModel,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onSelectNode,
  onHoverNode,
}) => {
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onClick={() => onSelectNode(null)}
      className={`relative w-full h-full bg-[#070709] overflow-hidden select-none font-mono ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background Starfield Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%),
            linear-gradient(to right, #1f1f23 1px, transparent 1px),
            linear-gradient(to bottom, #1f1f23 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        }}
      />

      {/* Semantic Clusters Layer */}
      <ClusterLayer clusters={viewModel.clusters} />

      {/* Relational Graph Lines Layer */}
      <RelationshipLayer edges={viewModel.edges} />

      {/* Central Computational Memory Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <MemoryCore core={viewModel.core} />
      </div>

      {/* Orbiting Ambient Particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {viewModel.particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              transform: `translate(${p.x * viewModel.camera.zoom}px, ${p.y * viewModel.camera.zoom}px)`,
              width: `${Math.max(1, p.radius * 2 * viewModel.camera.zoom)}px`,
              height: `${Math.max(1, p.radius * 2 * viewModel.camera.zoom)}px`,
              backgroundColor: p.colorHex,
              opacity: p.alpha,
            }}
          />
        ))}
      </div>

      {/* Information State Nodes Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {viewModel.nodes.map((node) => (
          <InformationState
            key={node.stateId}
            node={node}
            onSelect={(id) => onSelectNode(id)}
            onMouseEnter={() => onHoverNode(node.stateId)}
            onMouseLeave={() => onHoverNode(null)}
          />
        ))}
      </div>
    </div>
  );
};
