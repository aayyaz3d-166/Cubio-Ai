/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Search Bar
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface P610SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
}

export const P610SearchBar: React.FC<P610SearchBarProps> = ({
  searchText,
  onSearchChange,
}) => {
  return (
    <div className="relative flex items-center">
      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5" />
      <input
        type="text"
        placeholder="Search Spaces, Experiments, Saved States, tags, IDs..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-8 pr-7 py-1.5 bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 text-[9px] font-mono focus:outline-none focus:border-cyan-500 transition-colors"
      />
      {searchText && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
