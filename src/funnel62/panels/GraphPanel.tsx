/**
 * 3D Memory Studio — Funnel 62
 * Component: GraphPanel
 *
 * Displays connected 3D graph relationships from F58 Graph Engine.
 */

import React from 'react';
import { GraphRelationship } from '../../funnel58/types';
import { Share2, ArrowRight } from 'lucide-react';

interface GraphPanelProps {
  relationships: readonly GraphRelationship[];
  onSelectTargetState?: (stateId: string) => void;
}

export const GraphPanel: React.FC<GraphPanelProps> = ({
  relationships,
  onSelectTargetState,
}) => {
  return (
    <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 flex flex-col font-mono text-zinc-300 select-none p-3 space-y-3">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
        <span className="font-bold text-xs text-white flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-teal-400" />
          <span>GRAPH RELATIONSHIPS</span>
        </span>
        <span className="text-[10px] text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800 font-bold">
          {relationships.length}
        </span>
      </div>

      {/* Relationships List */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {relationships.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No connected relationships for this node.
          </div>
        ) : (
          relationships.map((rel) => (
            <div
              key={rel.relationshipId}
              className="p-2 rounded bg-[#18181c] border border-zinc-800 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-teal-400 font-bold">{rel.relationshipType}</span>
                <span className="text-zinc-500">{(rel.strength * 100).toFixed(0)}% Str</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                <span className="truncate">{rel.sourceStateId.split(':')[1] || rel.sourceStateId}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                <button
                  onClick={() => onSelectTargetState?.(rel.targetStateId)}
                  className="truncate text-cyan-400 hover:underline cursor-pointer"
                >
                  {rel.targetStateId.split(':')[1] || rel.targetStateId}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
