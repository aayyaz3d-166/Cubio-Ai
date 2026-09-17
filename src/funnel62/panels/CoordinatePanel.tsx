/**
 * 3D Memory Studio — Funnel 62
 * Component: CoordinatePanel
 *
 * Displays multi-dimensional coordinate parameters and projection mapping.
 */

import React from 'react';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType, DimensionCoordinate } from '../../funnel60/types';
import { Compass, Sparkles } from 'lucide-react';

interface CoordinatePanelProps {
  activeDimension: SimulationDimension;
  projectionMode: ProjectionType;
  selectedCoordinate?: DimensionCoordinate;
}

export const CoordinatePanel: React.FC<CoordinatePanelProps> = ({
  activeDimension,
  projectionMode,
  selectedCoordinate,
}) => {
  const isProjection = activeDimension > 3;

  return (
    <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-r border-zinc-800 flex flex-col font-mono text-zinc-300 select-none p-3 space-y-3">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
        <span className="font-bold text-xs text-white flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>COORDINATE SYSTEM</span>
        </span>
        <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 font-bold">
          Z{activeDimension}
        </span>
      </div>

      {/* Mode Status */}
      <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Spatial Mode</div>
        <div className={`text-xs font-bold ${isProjection ? 'text-purple-400' : 'text-emerald-400'}`}>
          {isProjection ? 'COMPUTATIONAL PROJECTION' : 'ACTUAL 3D SPATIAL MODE'}
        </div>
        <div className="text-[10px] text-zinc-400">Projection: {projectionMode}</div>
      </div>

      {/* Selected State Coordinates */}
      {selectedCoordinate ? (
        <div className="space-y-2">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Selected Coordinates</div>
          <div className="bg-[#18181c] p-2 rounded border border-zinc-800 text-xs space-y-1.5">
            <div className="text-[10px] text-zinc-500">Projected 3D World:</div>
            <div className="text-cyan-300 font-bold">
              [{selectedCoordinate.projectedPosition.map((v) => v.toFixed(1)).join(', ')}]
            </div>

            <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
              Raw {selectedCoordinate.rawValues.length}D Values:
            </div>
            <div className="text-[11px] text-zinc-400 max-h-24 overflow-y-auto">
              [{selectedCoordinate.rawValues.join(', ')}]
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500 text-xs">
          Select a state to inspect coordinates.
        </div>
      )}
    </div>
  );
};
