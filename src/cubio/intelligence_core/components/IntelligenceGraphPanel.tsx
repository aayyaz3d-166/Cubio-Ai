/**
 * CUBiO AI — Phase 25: Intelligence Graph Panel
 * Visualizes the 4-pillar relational graph: Knowledge, Memory, Reasoning, State.
 */

import React from 'react';
import { IntelligenceGraphData, GraphNodeType } from '../types';
import { Share2, ArrowUpRight, Database, Brain, Layers } from 'lucide-react';

interface IntelligenceGraphPanelProps {
  readonly graphData: IntelligenceGraphData;
  readonly onSelectNode: (cellId: string) => void;
}

const typeIcons: Record<GraphNodeType, React.ElementType> = {
  KNOWLEDGE: Share2,
  MEMORY: Database,
  REASONING: Brain,
  STATE: Layers,
};

const typeColors: Record<GraphNodeType, { bg: string; text: string; border: string }> = {
  KNOWLEDGE: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800' },
  MEMORY: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-800' },
  REASONING: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
  STATE: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800' },
};

export const IntelligenceGraphPanel: React.FC<IntelligenceGraphPanelProps> = ({
  graphData,
  onSelectNode,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
          <Share2 className="w-4 h-4 text-purple-400" />
          <span>Intelligence Graph (Knowledge • Memory • Reasoning • State)</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {graphData.nodes.length} Nodes • {graphData.edges.length} Relational Edges
        </span>
      </div>

      {/* Interactive Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {graphData.nodes.map((node) => {
          const Icon = typeIcons[node.type];
          const colors = typeColors[node.type];

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.latticeCellId)}
              className={
                'p-4 rounded-xl border hover:border-slate-500 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ' +
                colors.bg + ' ' + colors.border
              }
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={'flex items-center gap-1.5 text-xs font-mono font-bold ' + colors.text}>
                    <Icon className="w-3.5 h-3.5" />
                    {node.type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Addr {node.address369}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-1">{node.label}</div>
                <div className="text-xs text-slate-400 font-mono">
                  Lattice Locus: <span className="text-slate-300">{node.latticeCellId}</span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  Confidence: <strong className="text-emerald-400">{(node.confidence * 100).toFixed(0)}%</strong>
                </span>
                <span className="text-slate-500 flex items-center gap-0.5 hover:text-white">
                  Inspect <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relational Edges Matrix Summary */}
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
          Active Relational Edges
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
          {graphData.edges.map((edge, idx) => (
            <div
              key={idx}
              className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 text-slate-400 flex items-center justify-between"
            >
              <span className="text-slate-300 truncate max-w-[120px]">{edge.source}</span>
              <span className="text-indigo-400 font-semibold text-[10px]">--[{edge.relation}]--&gt;</span>
              <span className="text-slate-300 truncate max-w-[120px]">{edge.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};