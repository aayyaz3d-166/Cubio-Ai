/**
 * 3D Memory Studio — Funnel 53
 * Component: InformationState
 *
 * Individual interactive state node with selection halo, 369 preview, and hover card.
 */

import React from 'react';
import { StudioNodeViewModel } from '../types';
import { Sparkles, Bot, ShieldAlert } from 'lucide-react';

interface InformationStateProps {
  node: StudioNodeViewModel;
  onSelect: (stateId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const InformationState: React.FC<InformationStateProps> = ({
  node,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isLLM = node.category.toUpperCase().includes('AI') || node.category.toUpperCase().includes('LLM');
  const isGreen = node.classification === 'GREEN';

  return (
    <div
      style={{
        transform: `translate(${node.screenX}px, ${node.screenY}px) scale(${node.scale})`,
        zIndex: Math.floor(1000 + node.zDepth),
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.stateId);
      }}
      className="absolute flex flex-col items-center gap-1 cursor-pointer pointer-events-auto group transition-transform duration-75 select-none font-mono"
    >
      {/* Pulsing Selection Halo */}
      {node.isSelected && (
        <div
          className="absolute -inset-3 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none"
          style={{ opacity: 0.8 }}
        />
      )}

      {/* Search Highlight Ring */}
      {node.isHighlighted && (
        <div className="absolute -inset-2 rounded-full border-2 border-amber-400 animate-pulse pointer-events-none" />
      )}

      {/* Glowing Node Circle */}
      <div
        className="w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg backdrop-blur-xs transition-all duration-150 group-hover:scale-125"
        style={{
          borderColor: node.colorHex,
          backgroundColor: '#111114',
          boxShadow: `0 0 14px ${node.colorHex}77`,
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

      {/* Hover Information Card */}
      {node.isHovered && (
        <div className="absolute bottom-10 px-2.5 py-1.5 bg-[#18181c] border border-cyan-500 rounded-lg text-[10px] text-zinc-200 shadow-2xl whitespace-nowrap z-50 pointer-events-none space-y-0.5">
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
};
