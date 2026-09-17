/**
 * CUBiO AI — Phase 25: Node Inspector Modal
 * Deep 9-field inspection modal for lattice cells and knowledge nodes.
 */

import React from 'react';
import { X, ShieldCheck, Box, Hash, Cpu, GitCommit, Key, Activity, Award } from 'lucide-react';
import { DeepNodeInspectionData } from '../types';

interface NodeInspectorModalProps {
  readonly data: DeepNodeInspectionData | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                NODE INSPECTOR — 9-FIELD DEEP DIVE
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Cell: <span className="text-indigo-400">{data.cellId}</span> | Address 369:{' '}
                <span className="text-cyan-400">#{data.address369}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: 9 Fields */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Field 1 & 2: Address 369 & Cell ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  1. Address 369 Anchor
                </span>
              </div>
              <div className="text-amber-300 font-bold text-sm">#{data.address369}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Box className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  2. Lattice Cell Identifier
                </span>
              </div>
              <div className="text-indigo-300 font-bold">{data.cellId}</div>
            </div>
          </div>

          {/* Field 3 & 4: State-T & Memory Subsystem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  3. State-T Vector
                </span>
              </div>
              <div className="text-cyan-300 font-bold break-all">{data.stateT}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  4. Memory Registers
                </span>
              </div>
              <div className="text-slate-300">
                <span>ST: {data.memory.shortTerm}</span> • <span>LT: {data.memory.longTerm}</span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{data.memory.summary}</p>
              </div>
            </div>
          </div>

          {/* Field 5 & 6: Epistemic Evidence Tier & Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  5. Epistemic Evidence Tier
                </span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold">
                {data.evidence}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  6. Epistemic Confidence
                </span>
              </div>
              <div className="text-emerald-300 font-bold">
                {(data.confidence * 100).toFixed(1)}%
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, data.confidence * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Field 7: Relational Edges */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                7. Relational Graph Edges ({data.relations.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.relations.map((rel, i) => (
                <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">{rel.targetId}</span>
                  <span className="text-indigo-400 text-[10px] font-semibold">[{rel.relationType}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field 8: State History Chain */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <GitCommit className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                8. State History Chain ({data.history.length} records)
              </span>
            </div>
            <div className="space-y-1.5">
              {data.history.map((h, i) => (
                <div key={i} className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{h.event}</span>
                  <span className="text-slate-500">{h.delta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field 9: Cryptographic Provenance Hash */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                9. Cryptographic Provenance Hash (SHA-256)
              </span>
            </div>
            <div className="text-emerald-400 font-mono break-all text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
              {data.provenance}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-slate-500 text-[10px]">
          <span>CUBiO 3D MEMORY STUDIO — SOVEREIGN SUBSTRATE</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};