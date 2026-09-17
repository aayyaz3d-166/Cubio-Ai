/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Entity Inspector Panel
 */

import React, { useState } from 'react';
import { IndexRecord } from '../types';
import { Database, Tag, Star, GitFork, ShieldCheck } from 'lucide-react';

interface P610WorkspaceInspectorProps {
  selectedRecord: IndexRecord | null;
  indexChecksum: string;
  onAddTag: (record: IndexRecord, tag: string) => void;
  onRemoveTag: (record: IndexRecord, tag: string) => void;
  onTogglePin: (record: IndexRecord) => void;
}

export const P610WorkspaceInspector: React.FC<P610WorkspaceInspectorProps> = ({
  selectedRecord,
  indexChecksum,
  onAddTag,
  onRemoveTag,
  onTogglePin,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (!newTag.trim() || !selectedRecord) return;
    onAddTag(selectedRecord, newTag.trim());
    setNewTag('');
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> ENTITY INSPECTOR
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold text-[8px]">
          SCHEMA 6.10.0
        </span>
      </div>

      <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Index Checksum:</span>
          <span className="text-zinc-300 font-mono">{indexChecksum}</span>
        </div>
      </div>

      {selectedRecord ? (
        <div className="space-y-2">
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Entity Type:</span>
              <span className="text-amber-400 font-bold">{selectedRecord.entityType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Name:</span>
              <span className="text-zinc-200 font-bold truncate max-w-[160px]">
                {selectedRecord.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Entity ID:</span>
              <span className="text-zinc-400 font-mono truncate max-w-[160px]">
                {selectedRecord.entityId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Space ID:</span>
              <span className="text-zinc-400 font-mono truncate max-w-[160px]">
                {selectedRecord.spaceId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Lineage:</span>
              <span className="text-purple-400 font-mono truncate max-w-[160px]">
                {selectedRecord.lineageId || 'CANONICAL'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Checksum Ref:</span>
              <span className="text-cyan-400 font-mono">{selectedRecord.checksumRef}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Pinned:</span>
              <button
                onClick={() => onTogglePin(selectedRecord)}
                className={`font-bold flex items-center gap-0.5 cursor-pointer ${
                  selectedRecord.isPinned ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                {selectedRecord.isPinned ? 'PINNED' : 'UNPINNED'}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <div className="text-zinc-500 text-[8px]">Tags:</div>
            <div className="flex flex-wrap gap-1">
              {selectedRecord.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-[7.5px] text-zinc-300 flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => onRemoveTag(selectedRecord, tag)}
                    className="text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1 pt-1">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8px] focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAddTag}
                className="px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded border border-cyan-500/30 text-[8px] cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-4 text-[8.5px]">
          Select an entity to inspect.
        </div>
      )}
    </div>
  );
};
