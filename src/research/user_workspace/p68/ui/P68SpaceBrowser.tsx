/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Space Browser (My Spaces)
 */

import React, { useState } from 'react';
import { PersonalSpace } from '../types';
import { Folder, Plus, Copy, Edit2, Trash2, RotateCcw, Search } from 'lucide-react';

interface P68SpaceBrowserProps {
  spaces: readonly PersonalSpace[];
  activeSpaceId: string | null;
  onOpenSpace: (spaceId: string) => void;
  onCreateSpace: (name: string) => void;
  onDuplicateSpace: (space: PersonalSpace) => void;
  onRenameSpace: (space: PersonalSpace, newName: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onResetSpace: (space: PersonalSpace) => void;
}

export const P68SpaceBrowser: React.FC<P68SpaceBrowserProps> = ({
  spaces,
  activeSpaceId,
  onOpenSpace,
  onCreateSpace,
  onDuplicateSpace,
  onRenameSpace,
  onDeleteSpace,
  onResetSpace,
}) => {
  const [search, setSearch] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredSpaces = spaces.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.spaceId.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newSpaceName.trim()) return;
    onCreateSpace(newSpaceName.trim());
    setNewSpaceName('');
  };

  const handleRenameSubmit = (space: PersonalSpace) => {
    if (editName.trim()) {
      onRenameSpace(space, editName.trim());
    }
    setEditingSpaceId(null);
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-amber-400 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5" /> MY SPACES ({spaces.length})
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
        <input
          type="text"
          placeholder="Search spaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-7 pr-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8.5px] focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Spaces List */}
      <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
        {filteredSpaces.map((sp) => {
          const isActive = sp.spaceId === activeSpaceId;
          const isEditing = editingSpaceId === sp.spaceId;

          return (
            <div
              key={sp.spaceId}
              className={`p-2 rounded border flex items-center justify-between transition-colors ${
                isActive
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1 mr-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-1 py-0.5 bg-black border border-zinc-700 rounded text-zinc-200 text-[8.5px]"
                  />
                  <button onClick={() => handleRenameSubmit(sp)} className="text-emerald-400 p-0.5">
                    ✓
                  </button>
                  <button onClick={() => setEditingSpaceId(null)} className="text-red-400 p-0.5">
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onOpenSpace(sp.spaceId)}
                  className="flex-1 text-left truncate cursor-pointer"
                >
                  <div className="font-bold truncate text-[9px]">{sp.name}</div>
                  <div className="text-[7.5px] text-zinc-500 truncate">
                    ID: {sp.spaceId} | CS: {sp.spaceChecksum.slice(0, 8)}
                  </div>
                </button>
              )}

              <div className="flex items-center gap-1">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => onDuplicateSpace(sp)}
                      title="Duplicate (Save As)"
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSpaceId(sp.spaceId);
                        setEditName(sp.name);
                      }}
                      title="Rename"
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onResetSpace(sp)}
                      title="Reset Space"
                      className="text-zinc-500 hover:text-amber-400 p-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </>
                )}
                {spaces.length > 1 && (
                  <button
                    onClick={() => onDeleteSpace(sp.spaceId)}
                    title="Delete Space"
                    className="text-red-500/60 hover:text-red-400 p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Space */}
      <div className="flex gap-1 pt-1 border-t border-zinc-800">
        <input
          type="text"
          placeholder="New Space Name..."
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          className="flex-1 px-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8.5px] focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={handleCreate}
          className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded border border-amber-500/30 flex items-center gap-1 text-[8.5px] cursor-pointer"
        >
          <Plus className="w-2.5 h-2.5" /> Create
        </button>
      </div>
    </div>
  );
};
