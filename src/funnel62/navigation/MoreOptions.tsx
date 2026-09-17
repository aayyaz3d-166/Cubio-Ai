/**
 * 3D Memory Studio — Funnel 62
 * Component: MoreOptions
 *
 * Modular options menu for toggling panels, resetting view, and diagnostics.
 */

import React from 'react';
import { StudioActivePanel } from '../types';
import {
  MoreVertical,
  Database,
  Compass,
  Info,
  Share2,
  Layers,
  MessageSquare,
  RotateCcw,
  Activity,
} from 'lucide-react';

interface MoreOptionsProps {
  isOpen: boolean;
  onToggle: () => void;
  activePanel: StudioActivePanel;
  onSelectPanel: (panel: StudioActivePanel) => void;
  onResetView: () => void;
  onOpenDiagnostics: () => void;
}

export const MoreOptions: React.FC<MoreOptionsProps> = ({
  isOpen,
  onToggle,
  activePanel,
  onSelectPanel,
  onResetView,
  onOpenDiagnostics,
}) => {
  return (
    <div className="relative font-mono select-none">
      <button
        onClick={onToggle}
        className={`p-2 rounded-lg border transition cursor-pointer ${
          isOpen
            ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
            : 'bg-[#18181c] hover:bg-zinc-800 border-zinc-700 text-zinc-300'
        }`}
        title="More Options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-56 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
          <div className="text-[10px] text-zinc-500 font-bold uppercase px-2 py-1">
            Studio Panels
          </div>

          <button
            onClick={() => {
              onSelectPanel('DATABASE');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'DATABASE' ? 'bg-cyan-950 text-cyan-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Database Explorer</span>
          </button>

          <button
            onClick={() => {
              onSelectPanel('COORDINATE');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'COORDINATE' ? 'bg-amber-950 text-amber-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Coordinate System</span>
          </button>

          <button
            onClick={() => {
              onSelectPanel('INFORMATION');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'INFORMATION' ? 'bg-blue-950 text-blue-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>State Information</span>
          </button>

          <button
            onClick={() => {
              onSelectPanel('GRAPH');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'GRAPH' ? 'bg-teal-950 text-teal-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Graph Relationships</span>
          </button>

          <button
            onClick={() => {
              onSelectPanel('CLUSTER');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'CLUSTER' ? 'bg-fuchsia-950 text-fuchsia-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Spatial Clusters</span>
          </button>

          <button
            onClick={() => {
              onSelectPanel('CHAT');
              onToggle();
            }}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer transition ${
              activePanel === 'CHAT' ? 'bg-purple-950 text-purple-300' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Conversation Hub</span>
          </button>

          <div className="border-t border-zinc-800 my-1 pt-1">
            <button
              onClick={() => {
                onResetView();
                onToggle();
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center gap-2 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset 3D View</span>
            </button>

            <button
              onClick={() => {
                onOpenDiagnostics();
                onToggle();
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center gap-2 cursor-pointer transition"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Diagnostics</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
