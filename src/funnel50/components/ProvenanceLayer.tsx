/**
 * 3D Memory Studio — Funnel 50
 * Component: ProvenanceLayer
 *
 * 8-stage interactive research pipeline provenance overlay.
 */

import React from 'react';
import { GitBranch, CheckCircle2, ShieldCheck, ArrowDown } from 'lucide-react';

interface ProvenanceLayerProps {
  lineage: readonly string[];
  stateId?: string;
  onClose: () => void;
}

export const ProvenanceLayer: React.FC<ProvenanceLayerProps> = ({
  lineage,
  stateId,
  onClose,
}) => {
  const defaultStages = [
    { name: '1. SOURCE DOMAIN', icon: 'Globe', desc: 'Public / research boundary data origin' },
    { name: '2. DATA CAPTURE', icon: 'Download', desc: 'Deterministic capture record creation' },
    { name: '3. F47 CLASSIFICATION', icon: 'Shield', desc: 'GREEN / RED processing permission boundary' },
    { name: '4. CANONICALIZATION', icon: 'FileText', desc: 'Deterministic structural JSON normalization' },
    { name: '5. CHECKSUM HASH', icon: 'Lock', desc: 'Payload integrity hash validation' },
    { name: '6. 369 ENCODING', icon: 'Binary', desc: 'Ternary symbols & base-3 numeric state' },
    { name: '7. COORDINATE ANCHOR', icon: 'Compass', desc: 'Hierarchical cellular coordinate mapping' },
    { name: '8. DIMENSIONAL PROJECTION', icon: 'Layers', desc: 'Multi-dimensional state placement (Z1..Z16)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111113] border border-emerald-500/60 w-full max-w-2xl rounded-xl p-5 text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-300">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                <span>8-STAGE PROVENANCE LINEAGE</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  Immutable
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Complete End-to-End Research Transformation Audit Trail</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* State Context */}
        <div className="text-[11px] text-zinc-400 bg-[#18181b] p-2 rounded border border-zinc-800">
          Target State: <strong className="text-white">{stateId || 'ACTIVE_SELECTION'}</strong>
        </div>

        {/* 8-Stage Flow */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {defaultStages.map((stage, idx) => {
            const auditEntry = lineage[idx] || lineage[lineage.length - 1];
            return (
              <div
                key={idx}
                className="p-2.5 bg-[#18181b] rounded-lg border border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{stage.name}</div>
                    <div className="text-[10px] text-zinc-400">{stage.desc}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-cyan-300 bg-[#111113] px-2 py-1 rounded border border-zinc-800 max-w-xs truncate">
                  {auditEntry}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
          <span>Read-only transformation provenance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
