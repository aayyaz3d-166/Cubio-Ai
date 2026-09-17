/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Filter Panel
 */

import React from 'react';
import { IndexEntityType, EntityStatus, WorkspaceSearchQuery } from '../types';
import { Filter } from 'lucide-react';

interface P610FilterPanelProps {
  query: WorkspaceSearchQuery;
  onUpdateQuery: (updater: (prev: WorkspaceSearchQuery) => WorkspaceSearchQuery) => void;
}

const ENTITY_TYPES: IndexEntityType[] = [
  'SPACE',
  'EXPERIMENT',
  'SAVED_STATE',
  'RECENT_VIEW',
  'IMPORT',
  'CLONE',
  'SHARE_PACKAGE',
];

export const P610FilterPanel: React.FC<P610FilterPanelProps> = ({ query, onUpdateQuery }) => {
  const toggleEntityType = (type: IndexEntityType) => {
    onUpdateQuery((prev) => {
      const current = prev.entityTypes || [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, entityTypes: next.length > 0 ? next : undefined };
    });
  };

  const togglePinnedOnly = () => {
    onUpdateQuery((prev) => ({
      ...prev,
      isPinned: prev.isPinned ? undefined : true,
    }));
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> FILTERS
        </span>
        <button
          onClick={togglePinnedOnly}
          className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors cursor-pointer ${
            query.isPinned
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
          }`}
        >
          {query.isPinned ? '★ Pinned Only' : '☆ All Items'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {ENTITY_TYPES.map((type) => {
          const isSelected = query.entityTypes?.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleEntityType(type)}
              className={`px-1.5 py-0.5 rounded text-[7.5px] border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/50 font-bold'
                  : 'bg-black/40 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
};
