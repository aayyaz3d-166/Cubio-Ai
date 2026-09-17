/**
 * 3D Memory Studio — Funnel 64
 * Component: StudioNavigation
 *
 * Left icon rail for the 10 first-class workspace panels.
 */

import React from 'react';
import { PanelId } from '../types';
import { NAVIGATION_ITEMS } from '../navigation/navigationManager';
import {
  Database,
  Compass,
  Info,
  MessageSquare,
  Bot,
  Search,
  Share2,
  Layers,
  Sparkles,
  Settings,
} from 'lucide-react';

interface StudioNavigationProps {
  activePanelId: PanelId | null;
  onTogglePanel: (panelId: PanelId) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Database,
  Compass,
  Info,
  MessageSquare,
  Bot,
  Search,
  Share2,
  Layers,
  Sparkles,
  Settings,
};

export const StudioNavigation: React.FC<StudioNavigationProps> = ({
  activePanelId,
  onTogglePanel,
}) => {
  return (
    <nav className="w-14 h-full bg-[#0d0d10] border-r border-zinc-800 flex flex-col items-center py-3 gap-1 z-30 select-none font-mono">
      {NAVIGATION_ITEMS.map((item) => {
        const IconComponent = ICON_MAP[item.iconName] || Database;
        const isActive = activePanelId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTogglePanel(item.id)}
            title={item.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer group relative ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent'
            }`}
          >
            <IconComponent className="w-4 h-4" />

            {/* Hover Tooltip */}
            <span className="absolute left-14 px-2 py-1 bg-zinc-900 border border-zinc-700 text-white text-[10px] rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
