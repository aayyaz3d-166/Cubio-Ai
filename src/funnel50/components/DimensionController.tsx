/**
 * 3D Memory Studio — Funnel 50
 * Component: DimensionController
 *
 * Prominent visual dimension selector ([Z1] [Z2] [Z3] [Z4] [Z6] [Z8] [Z12] [Z16])
 * displaying active coordinate mappings without state identity mutations.
 */

import React from 'react';
import { Layers } from 'lucide-react';

const SUPPORTED_DIMENSIONS = [1, 2, 3, 4, 6, 8, 12, 16] as const;

interface DimensionControllerProps {
  activeDimension: number;
  onSelectDimension: (dim: number) => void;
  activeCoordinate?: string | null;
  stateId?: string;
}

export const DimensionController: React.FC<DimensionControllerProps> = ({
  activeDimension,
  onSelectDimension,
  activeCoordinate,
  stateId,
}) => {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#111113]/90 backdrop-blur-md border border-[#27272a] px-3.5 py-2 rounded-xl text-xs font-mono select-none shadow-2xl z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold text-white tracking-wider">DIMENSIONAL PROJECTION:</span>
        <span className="text-cyan-400 font-bold">Z{activeDimension}</span>
      </div>

      {/* Dimension Button Ribbon */}
      <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800">
        {SUPPORTED_DIMENSIONS.map((dim) => {
          const isActive = activeDimension === dim;
          return (
            <button
              key={dim}
              onClick={() => onSelectDimension(dim)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-xs shadow-cyan-500/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Z{dim}
            </button>
          );
        })}
      </div>

      {/* Coordinate Telemetry for selected state */}
      {activeCoordinate && (
        <div className="text-[10px] text-amber-300 font-mono tracking-tight max-w-md truncate">
          Active Coordinate: <strong>{activeCoordinate}</strong>
        </div>
      )}
    </div>
  );
};
