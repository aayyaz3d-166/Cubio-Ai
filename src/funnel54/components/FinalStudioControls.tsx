/**
 * 3D Memory Studio — Funnel 54
 * Component: FinalStudioControls
 *
 * Bottom glass control bar with Play/Pause, speed multipliers, dimension switcher, reset, and presentation modes.
 */

import React from 'react';
import { SimulationSpeed, SimulationDimension } from '../../funnel52/types';
import { StudioPresentationMode } from '../types';
import { Play, Pause, RotateCcw, Rotate3d, Bot, Eye } from 'lucide-react';
import { DimensionSwitcher } from '../../funnel53/components/DimensionSwitcher';

interface FinalStudioControlsProps {
  isPaused: boolean;
  speed: SimulationSpeed;
  activeDimension: SimulationDimension;
  activeFilter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL';
  presentationMode: StudioPresentationMode;
  onTogglePause: () => void;
  onRestart: () => void;
  onResetCamera: () => void;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onSelectDimension: (dim: SimulationDimension) => void;
  onSetFilter: (filter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL') => void;
  onSetPresentationMode: (mode: StudioPresentationMode) => void;
}

const SPEED_OPTIONS: SimulationSpeed[] = [0.25, 0.5, 1, 2, 4];

export const FinalStudioControls: React.FC<FinalStudioControlsProps> = ({
  isPaused,
  speed,
  activeDimension,
  activeFilter,
  presentationMode,
  onTogglePause,
  onRestart,
  onResetCamera,
  onSetSpeed,
  onSelectDimension,
  onSetFilter,
  onSetPresentationMode,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs select-none">
      {/* Playback & Reset Controls */}
      <div className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-xl flex items-center gap-2">
        <button
          onClick={onTogglePause}
          className={`p-2 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
            isPaused
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : 'bg-cyan-500 text-black hover:bg-cyan-400'
          }`}
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-black" /> : <Pause className="w-3.5 h-3.5 fill-black" />}
        </button>

        <button
          onClick={onRestart}
          className="p-2 bg-[#18181c] hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition cursor-pointer"
          title="Restart Simulation (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetCamera}
          className="p-2 bg-[#18181c] hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition cursor-pointer"
          title="Reset Camera View"
        >
          <Rotate3d className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 bg-[#18181c] p-0.5 rounded-md border border-zinc-800">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                speed === s
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Central Dimension Selector */}
      <DimensionSwitcher
        activeDimension={activeDimension}
        onSelectDimension={onSelectDimension}
      />

      {/* Presentation Modes */}
      <div className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-xl hidden md:flex items-center gap-1">
        <button
          onClick={() => onSetPresentationMode('SPACE')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
            presentationMode === 'SPACE' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          SPACE
        </button>
        <button
          onClick={() => onSetPresentationMode('FOCUS')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
            presentationMode === 'FOCUS' ? 'bg-purple-500 text-black' : 'text-purple-400 hover:bg-purple-950/40'
          }`}
        >
          FOCUS
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-xl hidden lg:flex items-center gap-1">
        <button
          onClick={() => onSetFilter('ALL')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
            activeFilter === 'ALL' ? 'bg-zinc-200 text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ALL
        </button>
        <button
          onClick={() => onSetFilter('GREEN')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
            activeFilter === 'GREEN' ? 'bg-emerald-500 text-black' : 'text-emerald-400 hover:bg-emerald-950/40'
          }`}
        >
          🟢 GREEN
        </button>
        <button
          onClick={() => onSetFilter('RED')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
            activeFilter === 'RED' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:bg-rose-950/40'
          }`}
        >
          🔴 RED
        </button>
        <button
          onClick={() => onSetFilter('AI_MODEL')}
          className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            activeFilter === 'AI_MODEL' ? 'bg-sky-500 text-black' : 'text-sky-400 hover:bg-sky-950/40'
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>LLMS</span>
        </button>
      </div>
    </div>
  );
};
