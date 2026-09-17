/**
 * 3D Memory Studio — Funnel 62
 * Component: StudioHeader
 *
 * Top navigation bar of the 3D Memory Studio application.
 */

import React, { useState } from 'react';
import { SimulationDimension } from '../../funnel52/types';
import { CameraPresetType } from '../../funnel61/types';
import { StudioActivePanel } from '../types';
import { MoreOptions } from '../navigation/MoreOptions';
import {
  Sparkles,
  Search,
  Box,
  Compass,
  Video,
  Layers,
  Share2,
  Database,
  MessageSquare,
} from 'lucide-react';

interface StudioHeaderProps {
  activeDimension: SimulationDimension;
  onSwitchDimension: (dim: SimulationDimension) => void;
  activePanel: StudioActivePanel;
  onSelectPanel: (panel: StudioActivePanel) => void;
  moreOptionsOpen: boolean;
  onToggleMoreOptions: () => void;
  onResetView: () => void;
  onOpenDiagnostics: () => void;
  onSearch: (query: string) => void;
  onApplyPreset: (preset: CameraPresetType) => void;
}

const DIMS: SimulationDimension[] = [1, 2, 3, 4, 8, 12, 16];

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activeDimension,
  onSwitchDimension,
  activePanel,
  onSelectPanel,
  moreOptionsOpen,
  onToggleMoreOptions,
  onResetView,
  onOpenDiagnostics,
  onSearch,
  onApplyPreset,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <header className="h-14 bg-[#0d0d10]/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-40 select-none font-mono text-zinc-300">
      {/* Left: Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Box className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="font-extrabold text-white text-xs tracking-wider">
            3D MEMORY STUDIO
          </div>
          <div className="text-[9px] text-zinc-500">
            {activeDimension === 3 ? 'ACTUAL 3D SPATIAL' : `Z${activeDimension} COMPUTATIONAL PROJECTION`}
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="w-72">
        <div className="flex items-center gap-1.5 bg-[#18181c] border border-zinc-700 px-2.5 py-1 rounded-lg text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search 3D memory universe..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-hidden text-xs"
          />
        </div>
      </form>

      {/* Right: Dimension Selector, Panels Quick Toggles & More Options */}
      <div className="flex items-center gap-2">
        {/* Dimension selector */}
        <div className="flex items-center gap-1 bg-[#18181c] border border-zinc-800 p-1 rounded-lg">
          <span className="text-[10px] text-zinc-500 px-1 font-bold">DIM:</span>
          {DIMS.map((d) => (
            <button
              key={d}
              onClick={() => onSwitchDimension(d)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                activeDimension === d
                  ? 'bg-amber-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Z{d}
            </button>
          ))}
        </div>

        {/* Quick Panel Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectPanel(activePanel === 'DATABASE' ? 'NONE' : 'DATABASE')}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              activePanel === 'DATABASE'
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                : 'bg-[#18181c] hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title="Database"
          >
            <Database className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectPanel(activePanel === 'CHAT' ? 'NONE' : 'CHAT')}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              activePanel === 'CHAT'
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-[#18181c] hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title="AI Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* More Options Dropdown */}
        <MoreOptions
          isOpen={moreOptionsOpen}
          onToggle={onToggleMoreOptions}
          activePanel={activePanel}
          onSelectPanel={onSelectPanel}
          onResetView={onResetView}
          onOpenDiagnostics={onOpenDiagnostics}
        />
      </div>
    </header>
  );
};
