/**
 * 3D Memory Studio — Funnel 46
 * Component: MultiDimensionPanel
 *
 * Panel 7: Multi-dimensional space visualizer.
 * Supports 1D/2D/3D Euclidean projection and pairwise axis slice projections for Z4..Z16.
 */

import React, { useState } from 'react';
import { MultiDimensionalSpaceViewModel } from '../../funnel45/types';
import { Compass, Sliders, Layers, Grid } from 'lucide-react';

interface MultiDimensionPanelProps {
  spaceView?: MultiDimensionalSpaceViewModel;
}

export const MultiDimensionPanel: React.FC<MultiDimensionPanelProps> = ({ spaceView }) => {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  if (!spaceView) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No multi-dimensional coordinate space loaded. Select a state to inspect coordinates.
      </div>
    );
  }

  const activePair = spaceView.pairwiseAxisPairs[selectedPairIndex] || spaceView.pairwiseAxisPairs[0];

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Header Info */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-sm">Space Context: Dimension Z{spaceView.dimension}</span>
        </div>
        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
          Strategy: {spaceView.projectionStrategyLabel}
        </span>
      </div>

      {/* Direct Euclidean vs Pairwise Projections */}
      {spaceView.isDirectPhysicalRenderingSupported ? (
        /* Low Dimension 1D-3D View */
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-4 space-y-3">
          <div className="text-zinc-300 font-semibold flex items-center gap-1.5 border-b border-[#27272a] pb-1.5">
            <Grid className="w-4 h-4 text-emerald-400" />
            <span>Low-Dimensional Spatial Embedding (Z{spaceView.dimension})</span>
          </div>

          <div className="flex items-center justify-center p-6 bg-[#111113] rounded border border-[#27272a]">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-amber-400">{spaceView.formattedCoordinate}</div>
              <div className="text-xs text-zinc-400">
                Axes: [
                {spaceView.axisValues.map((v, i) => (
                  <span key={i} className="text-white font-bold mx-1">
                    D{i + 1}={v}
                  </span>
                ))}
                ]
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* High Dimension Z4-Z16 Pairwise Slice View */
        <div className="space-y-3">
          <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>High-Dimensional Pairwise Slice Explorer (Z{spaceView.dimension})</span>
              </div>
              <span className="text-[10px] text-zinc-500">{spaceView.pairwiseAxisPairs.length} Axis Pairs</span>
            </div>

            {/* Pair Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {spaceView.pairwiseAxisPairs.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPairIndex(idx)}
                  className={`px-2 py-1 rounded text-[11px] border transition ${
                    idx === selectedPairIndex
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#111113] border-[#27272a] text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {pair.axisA} vs {pair.axisB}
                </button>
              ))}
            </div>

            {/* Pair Slice Display */}
            {activePair && (
              <div className="p-4 bg-[#111113] border border-[#27272a] rounded flex items-center justify-around text-center mt-2">
                <div>
                  <div className="text-zinc-500 text-[10px]">Slice Axis A</div>
                  <div className="text-base font-bold text-cyan-400">{activePair.axisA}</div>
                  <div className="text-xs text-white font-mono mt-1">Value: {activePair.valA}</div>
                </div>
                <div className="text-zinc-600 font-bold text-lg">⊗</div>
                <div>
                  <div className="text-zinc-500 text-[10px]">Slice Axis B</div>
                  <div className="text-base font-bold text-purple-400">{activePair.axisB}</div>
                  <div className="text-xs text-white font-mono mt-1">Value: {activePair.valB}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Axis Coordinates Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden">
        <div className="bg-[#141416] p-2.5 border-b border-[#27272a] font-semibold text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Complete Coordinate Space Axes</span>
          </div>
          <span className="text-[10px] text-zinc-500">{spaceView.axisValues.length} Total Axes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 p-2 bg-[#111113]">
          {spaceView.axisValues.map((val, idx) => (
            <div key={idx} className="p-1.5 bg-[#18181b] border border-[#27272a] rounded text-center">
              <div className="text-[10px] text-zinc-500">Axis {idx + 1}</div>
              <div className="text-sm font-bold text-amber-400">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
