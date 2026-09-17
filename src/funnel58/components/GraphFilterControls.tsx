/**
 * 3D Memory Studio — Funnel 58
 * Component: GraphFilterControls
 *
 * Relationship type & strength filtering toolbar.
 */

import React from 'react';
import { GraphFilterCriteria, GraphRelationshipType, GraphStrengthFilter } from '../types';
import { Filter } from 'lucide-react';

interface GraphFilterControlsProps {
  filters: GraphFilterCriteria;
  onUpdateFilters: (f: GraphFilterCriteria) => void;
}

const TYPES: GraphRelationshipType[] = [
  'SEMANTIC',
  'CATEGORY',
  'DOMAIN',
  'SOURCE',
  'SEQUENCE',
  'COORDINATE',
];

const STRENGTHS: GraphStrengthFilter[] = ['ALL', 'STRONG', 'MEDIUM', 'WEAK'];

export const GraphFilterControls: React.FC<GraphFilterControlsProps> = ({
  filters,
  onUpdateFilters,
}) => {
  const toggleType = (t: GraphRelationshipType) => {
    const nextSet = new Set(filters.allowedTypes);
    if (nextSet.has(t)) {
      if (nextSet.size > 1) nextSet.delete(t);
    } else {
      nextSet.add(t);
    }
    onUpdateFilters({ ...filters, allowedTypes: nextSet });
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <Filter className="w-3 h-3 text-teal-400" />
        <span>Relationship Filters</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => {
          const active = filters.allowedTypes.has(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50'
                  : 'bg-zinc-800/60 text-zinc-500 border border-zinc-800'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/80">
        <span className="text-[10px] text-zinc-500 mr-1">Strength:</span>
        {STRENGTHS.map((s) => (
          <button
            key={s}
            onClick={() => onUpdateFilters({ ...filters, strengthFilter: s })}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
              filters.strengthFilter === s
                ? 'bg-cyan-500 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
