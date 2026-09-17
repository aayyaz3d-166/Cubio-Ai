/**
 * 3D Memory Studio — Funnel 46
 * Component: LowerDimensionPanel
 *
 * Panel 5: Lower-dimensional projection inspector (e.g. Z8 -> Z3).
 * Shows retained axes, discarded axes, information loss audits, and checksum invariants.
 */

import React from 'react';
import { DimensionalProjectionViewModel } from '../../funnel45/types';
import { ArrowDownRight, AlertTriangle, ShieldCheck, Layers } from 'lucide-react';

interface LowerDimensionPanelProps {
  projection?: DimensionalProjectionViewModel;
}

export const LowerDimensionPanel: React.FC<LowerDimensionPanelProps> = ({ projection }) => {
  if (!projection) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No lower-dimensional projection available. Select a state in dimension Z2 or higher.
      </div>
    );
  }

  const retained = projection.axisBreakdown.filter((a) => a.classification === 'SOURCE_AXIS');
  const discarded = projection.axisBreakdown.filter((a) => a.classification === 'DISCARDED_AXIS');

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Projection Header Ribbon */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/60 border border-amber-800/60 rounded-md text-amber-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Lower-Dimensional Projection:</span>
              <span className="text-amber-400">
                Z{projection.sourceDimension} → Z{projection.targetDimension}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{projection.description}</div>
          </div>
        </div>

        <div className="text-right text-[10px] space-y-1">
          <span className="inline-block bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
            {projection.projectionTypeLabel}
          </span>
        </div>
      </div>

      {/* Information Loss Audit Alert */}
      {projection.informationLossDetected ? (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-md p-3 flex items-start gap-2.5 text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1 text-xs">
            <div className="font-bold">Information Loss Detected on Spatial Axes</div>
            <div className="text-amber-200/80 text-[11px] leading-relaxed">
              Spatial coordinate axes ({discarded.map((d) => d.axisName).join(', ')}) were truncated.
              However, the underlying <strong className="text-white">payload checksum remains 100% invariant</strong>.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-md p-3 flex items-center gap-2 text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Isomorphic coordinate reduction with zero axis loss.</span>
        </div>
      )}

      {/* Axis Breakdown Comparison Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden">
        <div className="bg-[#141416] p-2.5 border-b border-[#27272a] font-semibold text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Axis-by-Axis Projection Breakdown</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {retained.length} Retained / {discarded.length} Discarded
          </span>
        </div>

        <div className="divide-y divide-[#27272a]">
          {projection.axisBreakdown.map((axis) => {
            const isRetained = axis.classification === 'SOURCE_AXIS';
            return (
              <div
                key={axis.axisIndex}
                className="p-2.5 flex items-center justify-between text-[11px] hover:bg-zinc-800/30 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{axis.axisName}</span>
                  <span className="text-zinc-500 font-mono">(Value: {axis.axisValue})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{axis.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isRetained
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {isRetained ? 'RETAINED' : 'DISCARDED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coordinate & Checksum Parity Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-1.5">
          <div className="text-zinc-400 text-[11px] font-semibold">Original vs Projected Coordinates</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Original (Z{projection.sourceDimension}):</span>
              <span className="text-white font-mono">{projection.originalCoordinate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Projected (Z{projection.targetDimension}):</span>
              <span className="text-amber-300 font-bold font-mono">{projection.projectedCoordinate}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-1.5">
          <div className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payload Checksum Invariant</span>
          </div>
          <div className="p-1.5 bg-[#111113] rounded border border-[#27272a] text-emerald-400 font-mono text-[10px]">
            {projection.preservedPayloadChecksum}
          </div>
          <div className="text-[10px] text-zinc-500">
            Exact payload hash unchanged despite coordinate space truncation.
          </div>
        </div>
      </div>
    </div>
  );
};
