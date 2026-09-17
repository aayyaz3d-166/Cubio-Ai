/**
 * CUBiO AI — Phase 11: Spatial Inspector Modal Component
 * src/cubio/web/components/SpatialInspectorModal.tsx
 *
 * Provides read-only visibility into the 7x7x7 (343 cells) spatial memory
 * and 369 lattice address boundaries.
 * Invariant: Strictly informational. Direct frontend mutation of memory or coordinates is prohibited.
 */

import React from 'react';
import { X, Layers, Box, ShieldCheck } from 'lucide-react';

interface SpatialInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpatialInspectorModal: React.FC<SpatialInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">3D Spatial Memory Inspector</h3>
              <p className="text-[11px] text-zinc-400">Read-only canonical coordinate reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-zinc-300">
          {/* Spatial Invariant Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span className="uppercase tracking-wider">Lattice Topology</span>
              <span className="text-cyan-400 font-mono">7 × 7 × 7 HCP</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                <div className="text-base font-bold text-indigo-400">343</div>
                <div className="text-[10px] text-zinc-500">Spatial Cells</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                <div className="text-base font-bold text-cyan-400">369</div>
                <div className="text-[10px] text-zinc-500">Address Space</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                <div className="text-base font-bold text-emerald-400">26</div>
                <div className="text-[10px] text-zinc-500">Symbolic Nodes</div>
              </div>
            </div>
          </div>

          {/* Coordinate Range Guide */}
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-200 text-xs">Valid Coordinate Ranges</h4>
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 font-mono text-[11px] space-y-1">
              <div>• X Axis: [0, 6] integer bounds</div>
              <div>• Y Axis: [0, 6] integer bounds</div>
              <div>• Z Axis: [0, 6] integer bounds</div>
              <div>• Cell ID: [0, 342] strictly indexable</div>
            </div>
          </div>

          {/* Security Invariant Notice */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-0.5 text-[11px]">
              <span className="font-semibold">Backend Authority Enforced:</span>
              <p className="text-emerald-300/80">
                All spatial mutations and memory indexing are strictly managed by the backend Core Engine and MemoryService. Direct client manipulation is rejected.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
