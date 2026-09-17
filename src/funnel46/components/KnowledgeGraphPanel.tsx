/**
 * 3D Memory Studio — Funnel 46
 * Component: KnowledgeGraphPanel
 *
 * Panel 8: Bounded knowledge graph visualizer with node selection,
 * semantic edge details, confidence scores, and BFS neighborhood exploration.
 */

import React from 'react';
import { KnowledgeGraphViewModel } from '../../funnel45/types';
import { Network, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface KnowledgeGraphPanelProps {
  graphView?: KnowledgeGraphViewModel;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export const KnowledgeGraphPanel: React.FC<KnowledgeGraphPanelProps> = ({
  graphView,
  selectedNodeId,
  onSelectNode,
}) => {
  if (!graphView || graphView.visibleNodes.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No graph nodes in scope. Select a state to inspect its knowledge graph neighborhood.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Graph Scope Info */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white text-sm">Knowledge Graph Neighborhood</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Depth: <strong className="text-white">{graphView.currentDepth}</strong></span>
          <span>Nodes: <strong className="text-purple-400">{graphView.visibleNodes.length}</strong></span>
          <span>Edges: <strong className="text-cyan-400">{graphView.visibleEdges.length}</strong></span>
        </div>
      </div>

      {/* Render Budget Notice if bounded */}
      {graphView.hasMoreUnrenderedNodes && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-md p-2.5 flex items-center gap-2 text-amber-300 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Graph expansion bounded to max depth {graphView.maxRenderedDepth} under active render budget.</span>
        </div>
      )}

      {/* Nodes & Edges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Node Explorer Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden">
          <div className="bg-[#141416] p-2.5 border-b border-[#27272a] font-semibold text-zinc-300">
            Visible Entities / Nodes ({graphView.visibleNodes.length})
          </div>

          <div className="divide-y divide-[#27272a] max-h-64 overflow-y-auto">
            {graphView.visibleNodes.map((node) => {
              const isSelected = node.nodeId === selectedNodeId || `NODE:${selectedNodeId}` === node.nodeId;
              return (
                <div
                  key={node.nodeId}
                  onClick={() => onSelectNode(node.nodeId)}
                  className={`p-2.5 cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-l-2 border-purple-400 text-white'
                      : 'hover:bg-zinc-800/40 text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{node.label}</div>
                    <div className="text-[10px] text-zinc-500">{node.sourceDomain} • Depth {node.depth}</div>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                    {node.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semantic Relationships Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden">
          <div className="bg-[#141416] p-2.5 border-b border-[#27272a] font-semibold text-zinc-300">
            Semantic Relationships / Edges ({graphView.visibleEdges.length})
          </div>

          <div className="divide-y divide-[#27272a] max-h-64 overflow-y-auto">
            {graphView.visibleEdges.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">No outgoing edges from root node.</div>
            ) : (
              graphView.visibleEdges.map((edge) => (
                <div key={edge.edgeId} className="p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                    <span className="truncate max-w-[120px]" title={edge.sourceNodeId}>
                      {edge.sourceNodeId.replace('NODE:', '')}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate max-w-[120px]" title={edge.targetNodeId}>
                      {edge.targetNodeId.replace('NODE:', '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60">
                      {edge.relationType}
                    </span>
                    <span className="text-zinc-500">Conf: {(edge.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
