/**
 * 3D Memory Studio — Funnel 46
 * Component: HigherDimensionPanel
 *
 * Panel 6: Higher-dimensional projection inspector (e.g. Z3 -> Z8).
 * Displays source axes, deterministically expanded derived axes, and DERIVED labels.
 */

import React from 'react';
import { DimensionalProjectionViewModel } from '../../funnel45/types';
import { ArrowUpRight, ShieldCheck, Layers, Cpu } from 'lucide-react';

interface HigherDimensionPanelProps {
  projection?: DimensionalProjectionViewModel;
}

export const HigherDimensionPanel: React.FC<HigherDimensionPanelProps> = ({ projection }) => {
  if (!projection) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No higher-dimensional projection available. Select a state to view its higher projection.
      </div>
    );
  }

  const sourceAxes = projection.axisBreakdown.filter((a) => a.classification === 'SOURCE_AXIS');
  const derivedAxes = projection.axisBreakdown.filter((a) => a.classification === 'DERIVED_AXIS');

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Projection Header Ribbon */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-950/60 border border-purple-800/60 rounded-md text-purple-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Higher-Dimensional Expansion:</span>
              <span className="text-purple-400">
                Z{projection.sourceDimension} → Z{projection.targetDimension}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{projection.description}</div>
          </div>
        </div>

        <div className="text-right text-[10px]">
          <span className="inline-block bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-semibold">
            {projection.projectionTypeLabel}
          </span>
        </div>
      </div>

      {/* Scientific Scope Notice */}
      <div className="bg-purple-950/30 border border-purple-800/60 rounded-md p-3 flex items-start gap-2.5 text-purple-200">
        <Cpu className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-purple-300">Deterministic Mathematical Expansion</div>
          <div className="text-purple-200/80 text-[11px] leading-relaxed">
            Expanded axes are deterministically derived from cyclic 369 sequence permutations.
            They are <strong className="text-white">computational mathematical projections</strong>, not physical dimensions.
          </div>
        </div>
      </div>

      {/* Axis Breakdown Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden">
        <div className="bg-[#141416] p-2.5 border-b border-[#27272a] font-semibold text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Axis Expansion Breakdown</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {sourceAxes.length} Source / {derivedAxes.length} Derived Axes
          </span>
        </div>

        <div className="divide-y divide-[#27272a]">
          {projection.axisBreakdown.map((axis) => {
            const isDerived = axis.classification === 'DERIVED_AXIS';
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
                      isDerived
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {isDerived ? 'DERIVED' : 'SOURCE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coordinates & Invariant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-1.5">
          <div className="text-zinc-400 text-[11px] font-semibold">Original vs Expanded Coordinates</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Source (Z{projection.sourceDimension}):</span>
              <span className="text-white font-mono">{projection.originalCoordinate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Expanded (Z{projection.targetDimension}):</span>
              <span className="text-purple-300 font-bold font-mono">{projection.projectedCoordinate}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-1.5">
          <div className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Invariant Checksum</span>
          </div>
          <div className="p-1.5 bg-[#111113] rounded border border-[#27272a] text-emerald-400 font-mono text-[10px]">
            {projection.preservedPayloadChecksum}
          </div>
          <div className="text-[10px] text-zinc-500">Exact source record payload checksum fully preserved.</div>
        </div>
      </div>
    </div>
  );
};
