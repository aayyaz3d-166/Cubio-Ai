/**
 * 3D Memory Studio — Funnel 54
 * Component: FinalProjectionIndicator
 *
 * Visual banner showing mathematical projection telemetry (Lower Dimension Loss / Higher Dimension Expansion).
 */

import React from 'react';
import { SimulationProjectionTelemetry } from '../../funnel52/types';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface FinalProjectionIndicatorProps {
  projection: SimulationProjectionTelemetry;
}

export const FinalProjectionIndicator: React.FC<FinalProjectionIndicatorProps> = ({
  projection,
}) => {
  if (projection.mode === 'DIRECT') return null;

  return (
    <div className="absolute top-16 right-4 z-30 max-w-xs bg-[#111114]/95 backdrop-blur-md border border-cyan-950/80 rounded-xl p-3 text-xs font-mono shadow-2xl space-y-1.5 pointer-events-none select-none">
      {/* Title */}
      <div className="flex items-center justify-between font-bold">
        <span className="flex items-center gap-1 text-white">
          {projection.mode === 'LOWER_PROJECTION' && (
            <>
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
              <span>LOWER DIMENSION PROJECTION</span>
            </>
          )}
          {projection.mode === 'HIGHER_PROJECTION' && (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
              <span>HIGHER DIMENSION PROJECTION</span>
            </>
          )}
        </span>
        <span className="text-cyan-400 font-bold">
          Z{projection.sourceDimension} → Z{projection.targetDimension}
        </span>
      </div>

      {/* Body Details */}
      {projection.mode === 'LOWER_PROJECTION' && (
        <div className="text-[10px] space-y-1 text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Preserved Axes:</span>
            <span className="text-emerald-400 font-semibold">{projection.preservedAxes.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Information Loss:</span>
            <span className="text-amber-400 font-bold">DETECTED ({projection.discardedAxes.length} axes)</span>
          </div>
        </div>
      )}

      {projection.mode === 'HIGHER_PROJECTION' && (
        <div className="text-[10px] space-y-1 text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Original Axes:</span>
            <span className="text-emerald-400 font-semibold">{projection.preservedAxes.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Derived Mode:</span>
            <span className="text-purple-400 font-bold">COMPUTATIONAL EXPANSION</span>
          </div>
        </div>
      )}
    </div>
  );
};
