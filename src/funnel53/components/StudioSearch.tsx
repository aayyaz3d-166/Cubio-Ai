/**
 * 3D Memory Studio — Funnel 53
 * Component: StudioSearch
 *
 * Minimalist top-left live search bar integrated with F50 search.
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface StudioSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const StudioSearch: React.FC<StudioSearchProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="relative flex items-center select-none font-mono">
      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search state, 369, entity..."
        className="bg-[#111114]/90 backdrop-blur-md border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-cyan-500 shadow-xl w-44 sm:w-64 transition-all"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-2 text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
