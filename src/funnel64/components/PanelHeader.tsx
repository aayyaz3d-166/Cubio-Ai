/**
 * 3D Memory Studio — Funnel 64
 * Component: PanelHeader
 *
 * Header bar for individual workspace panels.
 */

import React from 'react';
import { PanelDescriptor } from '../types';
import { X } from 'lucide-react';

interface PanelHeaderProps {
  panel: PanelDescriptor;
  onClose: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ panel, onClose }) => {
  return (
    <div className="h-10 px-3 border-b border-zinc-800 flex items-center justify-between bg-[#111114] select-none font-mono text-zinc-300">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xs text-white uppercase tracking-wider">
          {panel.title}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition cursor-pointer"
        title="Close Panel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
