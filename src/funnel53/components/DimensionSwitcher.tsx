/**
 * 3D Memory Studio — Funnel 53
 * Component: DimensionSwitcher
 *
 * Dimension selection dock with active selection indicators.
 */

import React from 'react';
import { SimulationDimension } from '../../funnel52/types';

interface DimensionSwitcherProps {
  activeDimension: SimulationDimension;
  onSelectDimension: (dim: SimulationDimension) => void;
}

const DIMENSIONS: SimulationDimension[] = [1, 2, 3, 4, 8, 12, 16];

export const DimensionSwitcher: React.FC<DimensionSwitcherProps> = ({
  activeDimension,
  onSelectDimension,
}) => {
  return (
    <div className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-xl flex items-center gap-1 select-none font-mono">
      <div className="px-2 py-0.5 text-zinc-500 font-bold text-[10px] hidden sm:block">
        DIMENSION:
      </div>

      {DIMENSIONS.map((dim) => {
        const isActive = activeDimension === dim;
        return (
          <button
            key={dim}
            onClick={() => onSelectDimension(dim)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'bg-[#18181c] text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Z{dim}
          </button>
        );
      })}
    </div>
  );
};
