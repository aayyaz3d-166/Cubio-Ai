/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Production Studio Workspace Top Header Bar
 */

import React, { useState } from 'react';
import { LiveSpaceState } from '../../p625i/types';
import {
  Boxes,
  Save,
  RotateCcw,
  Plus,
  FolderKanban,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface StudioWorkspaceHeaderProps {
  activeSpace: LiveSpaceState | null;
  spacesCount: number;
  isDockOpen: boolean;
  onToggleDock: () => void;
  onCreateSpace: (name: string) => void;
  onSaveState: (stateName: string) => void;
  onResetState: () => void;
  stateChecksum: string;
}

export const StudioWorkspaceHeader: React.FC<StudioWorkspaceHeaderProps> = ({
  activeSpace,
  spacesCount,
  isDockOpen,
  onToggleDock,
  onCreateSpace,
  onSaveState,
  onResetState,
  stateChecksum,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onCreateSpace(nameInput.trim());
      setNameInput('');
      setShowCreateModal(false);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSaveState(nameInput.trim());
      setNameInput('');
      setShowSaveModal(false);
    }
  };

  return (
    <div className="h-10 bg-[#0a0a0d] border-b border-zinc-800/80 px-4 flex items-center justify-between z-40 select-none font-mono text-xs">
      {/* Left: Active Space & Workspace Dock Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDock}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer font-bold ${
            isDockOpen
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'bg-zinc-900 text-cyan-400 hover:bg-zinc-800 border border-cyan-900/50'
          }`}
          title="Toggle User Workspace Panel"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>My Spaces ({spacesCount})</span>
        </button>

        {activeSpace ? (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 rounded-md">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Active Space:</span>
            <span className="text-zinc-200 font-bold text-[11px]">{activeSpace.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60">
              [{activeSpace.currentCoordinates.join(', ')}]
            </span>
          </div>
        ) : (
          <div className="text-zinc-500 text-[11px]">No active space selected</div>
        )}
      </div>

      {/* Center: Quick Actions (Create Space, Save State, Reset State) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setNameInput('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded transition cursor-pointer text-[11px]"
          title="Create New Spatial Workspace"
        >
          <Plus className="w-3 h-3 text-cyan-400" />
          <span>New Space</span>
        </button>

        <button
          onClick={() => {
            setNameInput('');
            setShowSaveModal(true);
          }}
          disabled={!activeSpace}
          className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer text-[11px] ${
            activeSpace
              ? 'bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/60 text-blue-300 hover:text-white'
              : 'opacity-40 cursor-not-allowed bg-zinc-900 border border-zinc-800 text-zinc-600'
          }`}
          title="Save Current Workspace State"
        >
          <Save className="w-3 h-3 text-blue-400" />
          <span>Save State</span>
        </button>

        <button
          onClick={onResetState}
          disabled={!activeSpace}
          className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer text-[11px] ${
            activeSpace
              ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 hover:text-amber-300'
              : 'opacity-40 cursor-not-allowed bg-zinc-900 border border-zinc-800 text-zinc-600'
          }`}
          title="Reset Active Space to Initial State"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Live Telemetry & Checksum */}
      <div className="hidden md:flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>REALITY INVARIANT</span>
        </div>
        <div className="text-zinc-500">
          CS: <span className="text-amber-400/90 font-mono">{stateChecksum.slice(0, 8)}</span>
        </div>
      </div>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#12131a] border border-zinc-700 p-4 rounded-xl shadow-2xl w-80 flex flex-col gap-3 font-mono"
          >
            <div className="font-bold text-cyan-400 text-xs uppercase tracking-wider">Create New Space</div>
            <input
              type="text"
              placeholder="Space name..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded text-white text-xs outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Save State Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <form
            onSubmit={handleSaveSubmit}
            className="bg-[#12131a] border border-zinc-700 p-4 rounded-xl shadow-2xl w-80 flex flex-col gap-3 font-mono"
          >
            <div className="font-bold text-blue-400 text-xs uppercase tracking-wider">Save Current State</div>
            <input
              type="text"
              placeholder="Saved state label..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded text-white text-xs outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
