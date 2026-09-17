/**
 * 3D Memory Studio — Funnel 46
 * Component: SearchConsolePanel
 *
 * Panel 10: Multi-criterion research search console with deterministic ranking
 * and direct "OPEN STATE" navigation.
 */

import React, { useState } from 'react';
import { SearchConsoleViewModel } from '../../funnel45/types';
import { Search, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';

interface SearchConsolePanelProps {
  searchConsole?: SearchConsoleViewModel;
  onExecuteSearch: (query: string) => void;
  onSelectState: (stateId: string) => void;
}

export const SearchConsolePanel: React.FC<SearchConsolePanelProps> = ({
  searchConsole,
  onExecuteSearch,
  onSelectState,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(searchConsole?.queryTerm || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onExecuteSearch(searchTerm.trim());
    }
  };

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by state ID, record key, checksum, 369 sequence, or coordinate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-md text-white text-xs placeholder-zinc-500 focus:outline-hidden focus:border-cyan-500 font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-md text-xs transition"
        >
          Search
        </button>
      </form>

      {/* Results Header */}
      {searchConsole && (
        <div className="flex items-center justify-between text-zinc-400 text-[11px] px-1">
          <div>
            Found <strong className="text-white">{searchConsole.totalFound}</strong> results for "
            <span className="text-cyan-300">{searchConsole.queryTerm}</span>"
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
            Policy: {searchConsole.rankingPolicy}
          </span>
        </div>
      )}

      {/* Results List */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden divide-y divide-[#27272a]">
        {!searchConsole || searchConsole.visibleResults.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            Enter a query term above to search across the Information Universe dataset.
          </div>
        ) : (
          searchConsole.visibleResults.map((res) => (
            <div
              key={res.stateId}
              className="p-3 hover:bg-zinc-800/40 transition flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[10px]">#{res.rank}</span>
                  <span className="font-bold text-white text-xs">{res.recordId}</span>
                  <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] px-1.5 py-0.2 rounded">
                    {res.matchType}
                  </span>
                </div>
                <div className="text-zinc-500 text-[10px] font-mono truncate max-w-md">
                  State: {res.stateId} • Checksum: {res.payloadChecksum}
                </div>
              </div>

              <button
                onClick={() => onSelectState(res.stateId)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-cyan-900/60 hover:text-cyan-300 border border-zinc-700 hover:border-cyan-700 text-zinc-300 rounded text-xs transition flex items-center gap-1 shrink-0"
              >
                <span>Open State</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
