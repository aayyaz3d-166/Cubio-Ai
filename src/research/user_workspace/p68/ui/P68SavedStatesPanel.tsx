/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Saved States Panel
 */

import React, { useState } from 'react';
import { SavedStateRecord, PersonalSpace } from '../types';
import { Bookmark, Plus, RotateCcw, Trash2 } from 'lucide-react';

interface P68SavedStatesPanelProps {
  savedStates: readonly SavedStateRecord[];
  activeSpace: PersonalSpace | undefined;
  onCreateSavedState: (label: string) => void;
  onRestoreSavedState: (stateId: string) => void;
  onDeleteSavedState: (stateId: string) => void;
}

export const P68SavedStatesPanel: React.FC<P68SavedStatesPanelProps> = ({
  savedStates,
  activeSpace,
  onCreateSavedState,
  onRestoreSavedState,
  onDeleteSavedState,
}) => {
  const [label, setLabel] = useState('');

  const handleCreate = () => {
    if (!label.trim() || !activeSpace) return;
    onCreateSavedState(label.trim());
    setLabel('');
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5" /> SAVED STATES ({savedStates.length})
        </span>
      </div>

      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
        {savedStates.length > 0 ? (
          savedStates.map((st) => (
            <div
              key={st.stateId}
              className="p-2 rounded bg-black/40 border border-zinc-800 flex items-center justify-between text-[8.5px] hover:border-zinc-700 transition-colors"
            >
              <div className="truncate mr-2">
                <div className="font-bold text-zinc-200 truncate">{st.label}</div>
                <div className="text-[7.5px] text-zinc-500">
                  ID: {st.stateId} | CS: {st.stateChecksum.slice(0, 8)} | Observers: {st.observers.length}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRestoreSavedState(st.stateId)}
                  title="Restore this state"
                  className="px-1.5 py-0.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-0.5 text-[7.5px] cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Restore
                </button>
                <button
                  onClick={() => onDeleteSavedState(st.stateId)}
                  title="Delete state"
                  className="text-red-500/60 hover:text-red-400 p-0.5 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-zinc-500 italic py-1 text-[8.5px]">No saved states recorded.</div>
        )}
      </div>

      {activeSpace && (
        <div className="flex gap-1 pt-1 border-t border-zinc-800">
          <input
            type="text"
            placeholder="Saved state label..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 px-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8.5px] focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleCreate}
            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1 text-[8.5px] cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" /> Save
          </button>
        </div>
      )}
    </div>
  );
};
