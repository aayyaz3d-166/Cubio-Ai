/**
 * 3D Memory Studio — Funnel 62
 * Component: DatabasePanel
 *
 * Browses, filters, and searches permitted indexed states.
 */

import React, { useState, useEffect } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { DataProvider } from '../types';
import { Search, Database, ChevronRight, ShieldCheck } from 'lucide-react';

interface DatabasePanelProps {
  dataProvider: DataProvider;
  selectedStateId: string | null;
  onSelectState: (stateId: string) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({
  dataProvider,
  selectedStateId,
  onSelectState,
}) => {
  const [states, setStates] = useState<readonly DimensionalInformationState[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    dataProvider.searchStates(query).then((res) => {
      if (isMounted) {
        setStates(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [dataProvider, query]);

  return (
    <div className="w-80 h-full bg-[#111114]/95 backdrop-blur-md border-r border-zinc-800 flex flex-col font-mono text-zinc-300 select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-bold text-xs text-white flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>DATABASE EXPLORER</span>
        </span>
        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-bold">
          {states.length} GREEN
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 bg-[#18181c] border border-zinc-700 px-2 py-1 rounded text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search records or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-hidden text-xs"
          />
        </div>
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="text-center py-6 text-zinc-500 text-xs">Loading records...</div>
        ) : states.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs">No records found.</div>
        ) : (
          states.map((s) => {
            const active = selectedStateId === s.stateId;
            return (
              <button
                key={s.stateId}
                onClick={() => onSelectState(s.stateId)}
                className={`w-full text-left p-2 rounded text-xs transition cursor-pointer flex items-center justify-between ${
                  active
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50'
                    : 'bg-[#18181c]/60 hover:bg-[#18181c] text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="font-bold text-[11px] truncate text-white">
                    {s.entityName || s.recordId}
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate">{s.stateId}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
