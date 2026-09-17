/**
 * 3D Memory Studio — Funnel 51
 * Component: StateFormation
 *
 * Visual representation of emerging discrete information state nodes
 * and their animated emergence into the computational space.
 */

import React from 'react';
import { VisualStateNode } from '../types';
import { Bot, Sparkles, ShieldAlert } from 'lucide-react';

interface StateFormationProps {
  nodes: readonly VisualStateNode[];
}

export const StateFormation: React.FC<StateFormationProps> = ({ nodes }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
      {nodes.map((node) => {
        const isGreen = node.classification === 'GREEN';
        const isLLM = node.category === 'AI_MODEL';

        return (
          <div
            key={node.nodeId}
            style={{
              transform: `translate(${node.x}px, ${node.y}px) scale(${node.scale})`,
              opacity: node.opacity,
            }}
            className="absolute flex flex-col items-center gap-1 transition-transform duration-100 ease-out"
          >
            {/* Glowing Node Body */}
            <div
              className="relative w-8 h-8 rounded-full border flex items-center justify-center shadow-md backdrop-blur-xs"
              style={{
                borderColor: node.colorHex,
                backgroundColor: '#111114',
                boxShadow: `0 0 12px ${node.colorHex}55`,
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

            {/* Label Card */}
            <div className="px-2 py-0.5 rounded bg-[#111114]/90 border border-zinc-800 text-[10px] whitespace-nowrap text-zinc-300 font-mono shadow-md flex items-center gap-1">
              <span>{node.label}</span>
              {node.coordinatePreview && (
                <span className="text-amber-400 text-[9px]">[{node.coordinatePreview}]</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
