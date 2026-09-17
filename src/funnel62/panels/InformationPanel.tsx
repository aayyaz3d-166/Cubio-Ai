/**
 * 3D Memory Studio — Funnel 62
 * Component: InformationPanel
 *
 * Displays detailed metadata of the selected state node.
 */

import React from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { Info, ShieldCheck, Tag, Globe } from 'lucide-react';

interface InformationPanelProps {
  selectedState?: DimensionalInformationState;
  onClose?: () => void;
}

export const InformationPanel: React.FC<InformationPanelProps> = ({
  selectedState,
  onClose,
}) => {
  if (!selectedState) {
    return (
      <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 p-4 font-mono text-zinc-400 text-xs flex flex-col items-center justify-center select-none">
        <Info className="w-8 h-8 text-zinc-600 mb-2" />
        <div>No state selected.</div>
        <div className="text-[10px] text-zinc-600 mt-1">Select a 3D node to inspect.</div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 flex flex-col font-mono text-zinc-300 select-none p-3 space-y-3 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
        <span className="font-bold text-xs text-white flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>STATE INFORMATION</span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* State Identity */}
      <div className="space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Entity / State</div>
        <div className="text-sm font-extrabold text-white">
          {selectedState.entityName || selectedState.recordId}
        </div>
        <div className="text-[10px] text-zinc-500">{selectedState.stateId}</div>
      </div>

      {/* Classification Tag */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>{selectedState.classification}</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
          {selectedState.category}
        </span>
      </div>

      {/* Source Info */}
      <div className="bg-[#18181c] p-2 rounded border border-zinc-800 space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>Source Provenance</span>
        </div>
        <div className="text-xs text-cyan-300 truncate">{selectedState.sourceDomain}</div>
        <div className="text-[9px] text-zinc-500 truncate">{selectedState.sourceUrl}</div>
      </div>

      {/* Semantic Tags */}
      {selectedState.semanticTerms && selectedState.semanticTerms.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Semantic Terms</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedState.semanticTerms.map((term, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-zinc-800/80 rounded text-[9px] text-zinc-300"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
