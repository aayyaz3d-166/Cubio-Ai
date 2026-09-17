/**
 * 3D Memory Studio — Funnel 54
 * Component: AdvancedStateLayer
 *
 * Advanced state nodes with atmospheric depth scaling, focus mode dimming,
 * lifecycle halos, and hover cards.
 */

import React from 'react';
import { AdvancedSceneNode } from '../types';
import { Sparkles, Bot, ShieldAlert } from 'lucide-react';

interface AdvancedStateLayerProps {
  nodes: readonly AdvancedSceneNode[];
  onSelectNode: (stateId: string) => void;
  onHoverNode: (stateId: string | null) => void;
}

export const AdvancedStateLayer: React.FC<AdvancedStateLayerProps> = ({
  nodes,
  onSelectNode,
  onHoverNode,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {nodes.map((node) => {
        const isLLM = node.category.toUpperCase().includes('AI') || node.category.toUpperCase().includes('LLM');
        const isGreen = node.classification === 'GREEN';

        return (
          <div
            key={node.stateId}
            style={{
              transform: `translate(${node.screenX}px, ${node.screenY}px) scale(${node.depthScale})`,
              zIndex: Math.floor(1000 + node.zDepth),
              opacity: node.isDimmed ? 0.2 : node.depthOpacity,
            }}
            onMouseEnter={() => onHoverNode(node.stateId)}
            onMouseLeave={() => onHoverNode(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node.stateId);
            }}
            className="absolute flex flex-col items-center gap-1 cursor-pointer pointer-events-auto group transition-all duration-150 select-none font-mono"
          >
            {/* Selection Halo */}
            {node.isSelected && (
              <div
                className="absolute -inset-3.5 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none"
                style={{ opacity: 0.8 }}
              />
            )}

            {/* Search Highlight Ring */}
            {node.isHighlighted && (
              <div className="absolute -inset-2.5 rounded-full border-2 border-amber-400 animate-pulse pointer-events-none" />
            )}

            {/* Glowing State Sphere */}
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg backdrop-blur-xs transition-all duration-150 group-hover:scale-125"
              style={{
                borderColor: node.colorHex,
                backgroundColor: '#111114',
                boxShadow: `0 0 16px ${node.colorHex}88`,
              }}
            >
              {isLLM ? (
                <Bot className="w-3.5 h-3.5 text-sky-400" />
              ) : isGreen ? (
                <Sparkles className="w-3 h-3 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>

            {/* State Label Pill */}
            <div className="px-2 py-0.5 rounded bg-[#111114]/90 border border-zinc-800 text-[10px] whitespace-nowrap text-zinc-300 font-mono shadow-md flex items-center gap-1 group-hover:border-cyan-500 group-hover:text-white transition">
              <span>{node.entityName}</span>
              {node.formattedCoordinate && (
                <span className="text-amber-400 text-[9px]">[{node.formattedCoordinate}]</span>
              )}
            </div>

            {/* Hover Tooltip Card */}
            {node.isHovered && (
              <div className="absolute bottom-10 px-3 py-1.5 bg-[#18181c] border border-cyan-500 rounded-lg text-[10px] text-zinc-200 shadow-2xl whitespace-nowrap z-50 pointer-events-none space-y-0.5">
                <div className="font-bold text-white">{node.entityName}</div>
                <div className="text-[9px] text-zinc-400 flex gap-2">
                  <span>{node.category}</span>
                  <span>•</span>
                  <span className={isGreen ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {node.classification}
                  </span>
                </div>
                {node.sequence369 && (
                  <div className="text-[9px] text-cyan-400 font-mono">
                    369: {node.sequence369.slice(0, 9)}...
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
