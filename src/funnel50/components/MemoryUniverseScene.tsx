/**
 * 3D Memory Studio — Funnel 50
 * Component: MemoryUniverseScene
 *
 * Interactive central 3D viewport rendering information state nodes,
 * spatial coordinate grids, cluster sectors, and relational graph lines.
 */

import React, { useRef, useState, useEffect } from 'react';
import { SimulationNode, SimulationEdge, SimulationCameraState } from '../types';
import { Bot, ShieldAlert, Sparkles } from 'lucide-react';

interface MemoryUniverseSceneProps {
  nodes: readonly SimulationNode[];
  edges: readonly SimulationEdge[];
  camera: SimulationCameraState;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onOrbit: (deltaPitch: number, deltaYaw: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoom: (deltaZoom: number) => void;
}

export const MemoryUniverseScene: React.FC<MemoryUniverseSceneProps> = ({
  nodes,
  edges,
  camera,
  selectedNodeId,
  onSelectNode,
  onOrbit,
  onPan,
  onZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<'ORBIT' | 'PAN'>('ORBIT');

  // Handle mouse down for orbit/pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || e.shiftKey) {
      setDragMode('PAN');
    } else {
      setDragMode('ORBIT');
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (dragMode === 'ORBIT') {
      onOrbit(dy * 0.005, dx * 0.005);
    } else {
      onPan(dx * 0.5, dy * 0.5);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    onZoom(e.deltaY > 0 ? -0.1 : 0.1);
  };

  // Project 3D vector to 2D screen coordinate with camera pitch/yaw and zoom
  const project3DTo2D = (pos: { x: number; y: number; z: number }) => {
    // Relative to camera target
    const rx = pos.x - camera.target.x;
    const ry = pos.y - camera.target.y;
    const rz = pos.z - camera.target.z;

    // Apply yaw (rotation around Y)
    const cosY = Math.cos(camera.yaw);
    const sinY = Math.sin(camera.yaw);
    const x1 = rx * cosY - rz * sinY;
    const z1 = rx * sinY + rz * cosY;

    // Apply pitch (rotation around X)
    const cosP = Math.cos(camera.pitch);
    const sinP = Math.sin(camera.pitch);
    const y2 = ry * cosP - z1 * sinP;
    const z2 = ry * sinP + z1 * cosP;

    // Perspective projection
    const distance = 800;
    const scale = (distance / (distance + z2 + 400)) * camera.zoom;

    const screenX = x1 * scale + (containerRef.current?.clientWidth || 800) / 2;
    const screenY = -y2 * scale + (containerRef.current?.clientHeight || 600) / 2;

    return { x: screenX, y: screenY, scale, visible: z2 + 400 > -200 };
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full bg-[#08080a] overflow-hidden select-none cursor-grab active:cursor-grabbing font-mono"
    >
      {/* Background Starfield Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
            linear-gradient(to right, #18181b 1px, transparent 1px),
            linear-gradient(to bottom, #18181b 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* SVG Canvas for Knowledge Graph Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {edges.map((edge) => {
          const srcNode = nodes.find((n) => n.nodeId === edge.sourceNodeId);
          const tgtNode = nodes.find((n) => n.nodeId === edge.targetNodeId);
          if (!srcNode || !tgtNode) return null;

          const p1 = project3DTo2D(srcNode.position3D);
          const p2 = project3DTo2D(tgtNode.position3D);
          if (!p1.visible || !p2.visible) return null;

          return (
            <line
              key={edge.edgeId}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={edge.colorHex}
              strokeWidth={1.5}
              strokeOpacity={0.4}
              strokeDasharray="4 2"
            />
          );
        })}
      </svg>

      {/* Render 3D Information State Nodes */}
      {nodes.map((node) => {
        const proj = project3DTo2D(node.position3D);
        if (!proj.visible) return null;

        const isSelected = node.nodeId === selectedNodeId || node.stateId === selectedNodeId || node.recordId === selectedNodeId;
        const isGreen = node.classification === 'GREEN';
        const nodeSize = node.radius * proj.scale;

        return (
          <div
            key={node.nodeId}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node.nodeId);
            }}
            style={{
              transform: `translate(${proj.x - nodeSize / 2}px, ${proj.y - nodeSize / 2}px)`,
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
            }}
            className="absolute z-10 cursor-pointer pointer-events-auto transition-transform duration-75 group"
          >
            {/* Glowing Halo */}
            <div
              className={`absolute inset-0 rounded-full animate-pulse opacity-70 ${
                isSelected
                  ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-black scale-125'
                  : 'group-hover:scale-110'
              }`}
              style={{
                backgroundColor: node.colorHex,
                boxShadow: `0 0 ${node.radius * 2}px ${node.colorHex}`,
              }}
            />

            {/* Inner Core */}
            <div
              className="absolute inset-1 rounded-full bg-[#111113] border flex items-center justify-center text-[9px] font-bold text-white shadow-inner"
              style={{ borderColor: node.colorHex }}
            >
              {node.isLLMModel ? (
                <Bot className="w-3 h-3 text-sky-300" />
              ) : isGreen ? (
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
              ) : (
                <ShieldAlert className="w-2.5 h-2.5 text-rose-300" />
              )}
            </div>

            {/* Label Tooltip on Hover / Selected */}
            {(isSelected || proj.scale > 0.8) && (
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded text-[10px] whitespace-nowrap pointer-events-none shadow-lg border backdrop-blur-md ${
                  isSelected
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 font-bold z-30'
                    : 'bg-[#111113]/80 text-zinc-300 border-zinc-700 z-20'
                }`}
              >
                <span>{node.entityName}</span>
                {node.formattedCoordinateZ3 && (
                  <span className="ml-1.5 text-amber-400 font-mono text-[9px]">{node.formattedCoordinateZ3}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
