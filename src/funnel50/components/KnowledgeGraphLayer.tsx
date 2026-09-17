/**
 * 3D Memory Studio — Funnel 50
 * Component: KnowledgeGraphLayer
 *
 * Visual overlay for knowledge graph semantic relationships (max depth = 3).
 */

import React from 'react';
import { SimulationEdge, SimulationNode } from '../types';
import { Network, ArrowRight } from 'lucide-react';

interface KnowledgeGraphLayerProps {
  edges: readonly SimulationEdge[];
  nodes: readonly SimulationNode[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
}

export const KnowledgeGraphLayer: React.FC<KnowledgeGraphLayerProps> = ({
  edges,
  nodes,
  selectedNodeId,
  onSelectNode,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111113] border border-cyan-500/60 w-full max-w-2xl rounded-xl p-5 text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-300">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                <span>KNOWLEDGE GRAPH RELATIONSHIPS</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                  Max Depth = 3
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Semantic & Ontological Links across Information States</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Relationships List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {edges.map((edge) => (
            <div
              key={edge.edgeId}
              className="p-3 bg-[#18181b] rounded-lg border border-zinc-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate max-w-xs">{edge.sourceNodeId.replace('SIM_NODE:', '')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-bold text-cyan-300 truncate max-w-xs">{edge.targetNodeId.replace('SIM_NODE:', '')}</span>
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">{edge.relationType}</span>
                  <span>Confidence: {(edge.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <button
                onClick={() => onSelectNode(edge.targetNodeId)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-cyan-900 border border-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] transition shrink-0"
              >
                Focus Target
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
          <span>Bounded Breadth-First-Search traversal</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-xs transition"
          >
            Close Graph View
          </button>
        </div>
      </div>
    </div>
  );
};
