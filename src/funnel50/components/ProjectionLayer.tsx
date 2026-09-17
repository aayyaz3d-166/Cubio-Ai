/**
 * 3D Memory Studio — Funnel 50
 * Component: ProjectionLayer
 *
 * Dimensional projection modal displaying pairwise axis projections ($D_i \times D_j$),
 * lower dimension information loss metrics, and higher dimension expansion analysis.
 */

import React, { useState } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { extractPairwiseProjection, calculateDimensionReductionMetrics } from '../simulationSelectors';
import { Compass, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ProjectionLayerProps {
  state?: DimensionalInformationState;
  activeDimension: number;
  onClose: () => void;
}

export const ProjectionLayer: React.FC<ProjectionLayerProps> = ({
  state,
  activeDimension,
  onClose,
}) => {
  const [axis1, setAxis1] = useState<number>(0);
  const [axis2, setAxis2] = useState<number>(1);

  if (!state) return null;

  const pairwise = extractPairwiseProjection(state, activeDimension, axis1, axis2);
  const reduction = calculateDimensionReductionMetrics(activeDimension, 3);

  const availableAxes = Array.from({ length: Math.min(activeDimension, 16) }, (_, i) => i);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#111113] border border-purple-500/60 w-full max-w-2xl rounded-xl p-5 text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                <span>DIMENSIONAL PROJECTION & LOSS ANALYSIS</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                  Z{activeDimension} Space
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Pairwise Projection Slices & Reduction Invariants</div>
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
        <div className="text-[11px] text-zinc-400 bg-[#18181b] p-2 rounded border border-zinc-800 flex justify-between items-center">
          <div>Target: <strong className="text-white">{state.recordId}</strong> ({state.entityName})</div>
          <div className="text-cyan-400 font-bold">{pairwise.formattedPoint}</div>
        </div>

        {/* Pairwise Axis Selectors */}
        <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800 space-y-3">
          <div className="text-white font-semibold text-xs flex items-center gap-2">
            <span>Pairwise Axis Projection Slice:</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">X-Axis Projection:</label>
              <select
                value={axis1}
                onChange={(e) => setAxis1(Number(e.target.value))}
                className="w-full bg-[#111113] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                {availableAxes.map((a) => (
                  <option key={a} value={a}>
                    Axis D{a + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Y-Axis Projection:</label>
              <select
                value={axis2}
                onChange={(e) => setAxis2(Number(e.target.value))}
                className="w-full bg-[#111113] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                {availableAxes.map((a) => (
                  <option key={a} value={a}>
                    Axis D{a + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reduction Metrics / Loss Analysis */}
        <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Reduction Status (Z{activeDimension} → Z3):</span>
            <span className={`flex items-center gap-1 font-bold ${activeDimension > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeDimension > 3 ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{reduction.informationLossStatus}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-400 bg-[#111113] p-2 rounded border border-zinc-800/80">
            <div>Retained Axes: <strong className="text-emerald-400">{reduction.retainedAxesCount}</strong></div>
            <div>Discarded Axes: <strong className="text-rose-400">{reduction.discardedAxesCount}</strong></div>
            <div className="text-right text-cyan-300 font-bold">{reduction.checksumInvariance}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
          <span>Mathematical representation projection only</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition"
          >
            Close Projections
          </button>
        </div>
      </div>
    </div>
  );
};
