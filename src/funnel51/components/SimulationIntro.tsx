/**
 * 3D Memory Studio — Funnel 51
 * Component: SimulationIntro
 *
 * Cinematic header overlay displaying current simulation phase,
 * dynamic progress bar, and user control buttons ([SKIP], [RESTART]).
 */

import React from 'react';
import { SimulationPhase } from '../types';
import { STANDARD_PHASE_CONFIGS } from '../simulation/simulationTypes';
import { FastForward, RotateCcw, Activity } from 'lucide-react';

interface SimulationIntroProps {
  currentPhase: SimulationPhase;
  progress: number;
  onSkip: () => void;
  onRestart: () => void;
  activeDimension: number;
}

export const SimulationIntro: React.FC<SimulationIntroProps> = ({
  currentPhase,
  progress,
  onSkip,
  onRestart,
  activeDimension,
}) => {
  const config = STANDARD_PHASE_CONFIGS[currentPhase] || STANDARD_PHASE_CONFIGS.INITIALIZING;

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-30 flex flex-col gap-2 font-mono select-none pointer-events-none">
      {/* Top Bar with Title and Skip/Restart */}
      <div className="flex items-center justify-between gap-3">
        {/* Phase Title Badge */}
        <div className="bg-[#111114]/90 backdrop-blur-md border border-cyan-900/60 px-3.5 py-1.5 rounded-lg shadow-xl pointer-events-auto flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white tracking-wider">{config.title}</div>
            <div className="text-[10px] text-cyan-400/80 truncate max-w-xs sm:max-w-md">
              {config.subtitle}
            </div>
          </div>
        </div>

        {/* Dimension & Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#111114]/90 border border-zinc-800 rounded-md text-xs text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dimension: <strong className="text-white">Z{activeDimension}</strong></span>
          </div>

          <button
            onClick={onRestart}
            className="p-1.5 bg-[#18181c]/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-md text-xs transition"
            title="Restart Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onSkip}
            className="px-2.5 py-1 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 hover:text-white rounded-md text-xs font-bold transition flex items-center gap-1"
            title="Skip Simulation to Studio Ready"
          >
            <span>SKIP</span>
            <FastForward className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div className="w-full bg-zinc-900/80 h-1 rounded-full overflow-hidden border border-zinc-800/50">
        <div
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full transition-all duration-100 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
};
