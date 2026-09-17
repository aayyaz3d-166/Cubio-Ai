/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Production Studio Workspace Interactive Dock
 */

import React, { useState } from 'react';
import {
  LiveSpaceState,
  LiveExperimentState,
  LiveSavedState,
  LiveRecentView,
} from '../../p625i/types';
import {
  FolderKanban,
  FlaskConical,
  Bookmark,
  Clock,
  Sliders,
  Plus,
  Trash2,
  CheckCircle,
  X,
  RotateCcw,
} from 'lucide-react';

export type DockTab = 'SPACES' | 'EXPERIMENTS' | 'SAVED_STATES' | 'RECENT_VIEWS' | 'STATE';

export interface StudioWorkspaceDockProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: readonly LiveSpaceState[];
  activeSpaceId: string | null;
  experiments: readonly LiveExperimentState[];
  savedStates: readonly LiveSavedState[];
  recentViews: readonly LiveRecentView[];
  selectedObjectId: string | null;
  onOpenSpace: (spaceId: string) => void;
  onCreateSpace: (name: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onLoadSavedState: (stateId: string) => void;
  onModifyCoordinates: (coords: [number, number, number]) => void;
}

export const StudioWorkspaceDock: React.FC<StudioWorkspaceDockProps> = ({
  isOpen,
  onClose,
  spaces,
  activeSpaceId,
  experiments,
  savedStates,
  recentViews,
  selectedObjectId,
  onOpenSpace,
  onCreateSpace,
  onDeleteSpace,
  onLoadSavedState,
  onModifyCoordinates,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('SPACES');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  if (!isOpen) return null;

  const activeSpaces = spaces.filter((s) => !s.isDeleted);
  const currentSpace = activeSpaces.find((s) => s.spaceId === activeSpaceId) ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      onCreateSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowCreateInput(false);
    }
  };

  return (
    <aside className="w-80 h-full bg-[#0d0e14]/98 backdrop-blur-md border-r border-zinc-800 flex flex-col font-mono text-zinc-300 z-30 select-none shadow-2xl">
      {/* Dock Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <FolderKanban className="w-4 h-4" />
          <span>User Workspace</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation Rail */}
      <div className="flex border-b border-zinc-800 bg-[#090a0f] text-[10px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('SPACES')}
          className={`flex-1 py-2 px-1 text-center font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'SPACES'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Spaces ({activeSpaces.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPERIMENTS')}
          className={`flex-1 py-2 px-1 text-center font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'EXPERIMENTS'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Exp ({experiments.length})
        </button>
        <button
          onClick={() => setActiveTab('SAVED_STATES')}
          className={`flex-1 py-2 px-1 text-center font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'SAVED_STATES'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Saved ({savedStates.length})
        </button>
        <button
          onClick={() => setActiveTab('RECENT_VIEWS')}
          className={`flex-1 py-2 px-1 text-center font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'RECENT_VIEWS'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Recent ({recentViews.length})
        </button>
        <button
          onClick={() => setActiveTab('STATE')}
          className={`flex-1 py-2 px-1 text-center font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'STATE'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          State
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: SPACES */}
        {activeTab === 'SPACES' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">My Spaces</span>
              <button
                onClick={() => setShowCreateInput(!showCreateInput)}
                className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {showCreateInput && (
              <form onSubmit={handleCreate} className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="Space name..."
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  autoFocus
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-white text-xs outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-cyan-500 text-black font-bold rounded text-xs cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            {activeSpaces.length === 0 ? (
              <div className="p-4 text-center text-zinc-600 text-xs">No spaces created yet.</div>
            ) : (
              activeSpaces.map((space) => {
                const isActive = space.spaceId === activeSpaceId;
                return (
                  <div
                    key={space.spaceId}
                    onClick={() => onOpenSpace(space.spaceId)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-zinc-200'}`}>
                        {space.name}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[9px] font-extrabold rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Coords: [{space.currentCoordinates.join(', ')}]</span>
                      <span>Dim: [{space.currentDimensions.join('x')}]</span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-zinc-600 pt-1 border-t border-zinc-800/50">
                      <span>ID: {space.spaceId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSpace(space.spaceId);
                        }}
                        className="p-1 hover:text-red-400 transition cursor-pointer"
                        title="Delete Space"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: EXPERIMENTS */}
        {activeTab === 'EXPERIMENTS' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">My Experiments</span>
            {experiments.length === 0 ? (
              <div className="p-4 text-center text-zinc-600 text-xs">No experiments recorded.</div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.experimentId}
                  className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col gap-1 text-xs"
                >
                  <span className="font-bold text-zinc-200">{exp.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {exp.experimentId}</span>
                  <span className="text-[10px] text-zinc-600">Space: {exp.spaceId}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SAVED STATES */}
        {activeTab === 'SAVED_STATES' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Saved States</span>
            {savedStates.length === 0 ? (
              <div className="p-4 text-center text-zinc-600 text-xs">No saved states yet. Use "Save State" above.</div>
            ) : (
              savedStates.map((st) => (
                <div
                  key={st.stateId}
                  className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200 text-xs">{st.name}</span>
                    <button
                      onClick={() => onLoadSavedState(st.stateId)}
                      className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/50 text-blue-300 text-[10px] rounded font-bold transition cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    CS: {st.stateChecksum.slice(0, 8)} | Coords: [{st.snapshotData.coordinates.join(', ')}]
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: RECENT VIEWS */}
        {activeTab === 'RECENT_VIEWS' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Recent Views</span>
            {recentViews.length === 0 ? (
              <div className="p-4 text-center text-zinc-600 text-xs">No recent views recorded.</div>
            ) : (
              recentViews.map((v) => (
                <div
                  key={v.viewId}
                  onClick={() => onOpenSpace(v.spaceId)}
                  className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col gap-1 cursor-pointer hover:border-zinc-700 transition"
                >
                  <span className="font-bold text-zinc-200 text-xs">{v.spaceName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Space ID: {v.spaceId}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: CURRENT STATE TELEMETRY & CONTROLS */}
        {activeTab === 'STATE' && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Current Space State</span>
            {currentSpace ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                    <div className="text-zinc-500">Observer:</div>
                    <div className="text-white font-bold">{currentSpace.currentObserver}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                    <div className="text-zinc-500">Selected Object:</div>
                    <div className="text-white font-bold">{selectedObjectId ?? 'NONE'}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                    <div className="text-zinc-500">Coordinates:</div>
                    <div className="text-cyan-400 font-bold">[{currentSpace.currentCoordinates.join(', ')}]</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                    <div className="text-zinc-500">Dimensions:</div>
                    <div className="text-amber-400 font-bold">[{currentSpace.currentDimensions.join('x')}]</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Coordinate Nudge Controls:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        const [x, y, z] = currentSpace.currentCoordinates;
                        onModifyCoordinates([x + 1, y, z]);
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
                    >
                      +X (Nudge)
                    </button>
                    <button
                      onClick={() => {
                        const [x, y, z] = currentSpace.currentCoordinates;
                        onModifyCoordinates([x, y + 1, z]);
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
                    >
                      +Y (Nudge)
                    </button>
                    <button
                      onClick={() => {
                        const [x, y, z] = currentSpace.currentCoordinates;
                        onModifyCoordinates([x, y, z + 1]);
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
                    >
                      +Z (Nudge)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-600 text-xs">No active space.</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
