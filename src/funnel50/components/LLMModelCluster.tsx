/**
 * 3D Memory Studio — Funnel 50
 * Component: LLMModelCluster
 *
 * Dedicated visual sector inspector for 🤖 LLM Model Space.
 */

import React from 'react';
import { SimulationNode } from '../types';
import { Bot, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface LLMModelClusterProps {
  llmNodes: readonly SimulationNode[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
}

export const LLMModelCluster: React.FC<LLMModelClusterProps> = ({
  llmNodes,
  selectedNodeId,
  onSelectNode,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111113] border border-sky-500/60 w-full max-w-3xl rounded-xl p-5 text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-900/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500 flex items-center justify-center text-sky-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                <span>🤖 LLM MODEL SPACE SECTOR</span>
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
                  {llmNodes.length} Models Indexed
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Dedicated AI/LLM Information State Cluster</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {llmNodes.map((node) => {
            const isGreen = node.classification === 'GREEN';
            const isSelected = node.nodeId === selectedNodeId || node.stateId === selectedNodeId;

            return (
              <div
                key={node.nodeId}
                onClick={() => onSelectNode(node.nodeId)}
                className={`p-3.5 rounded-lg border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${
                      isGreen
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}
                  >
                    {isGreen ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    <span>{isGreen ? '🟢 AUTHORIZED' : '🔴 RESTRICTED'}</span>
                  </span>
                  <span className="text-zinc-500 text-[10px]">{node.rawState.modelMetadata?.parameterCount || '7B'}</span>
                </div>

                <div>
                  <div className="font-bold text-white text-xs truncate">{node.entityName}</div>
                  <div className="text-zinc-400 text-[10px] truncate">{node.recordId}</div>
                  <div className="text-sky-400 text-[10px] truncate">Provider: {node.modelProvider || node.rawState.sourceDomain}</div>
                </div>

                {isGreen ? (
                  <div className="text-[10px] text-zinc-400 bg-[#111113] p-1.5 rounded border border-zinc-800 flex justify-between">
                    <span>Z3 Coord: <strong className="text-cyan-300">{node.formattedCoordinateZ3 || 'X3.Y6.Z9'}</strong></span>
                    <span>369: <strong className="text-amber-300">{node.sequence369Snippet || '369...'}</strong></span>
                  </div>
                ) : (
                  <div className="text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900/40 truncate">
                    {node.rawState.classificationReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
          <span>Connected to the unified Information Universe state graph</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
          >
            Close LLM Space
          </button>
        </div>
      </div>
    </div>
  );
};
