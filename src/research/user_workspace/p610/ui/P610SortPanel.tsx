/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Sort Panel
 */

import React from 'react';
import { SortField, SortDirection, SortSpec } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface P610SortPanelProps {
  sortSpec: SortSpec;
  onSortChange: (spec: SortSpec) => void;
}

const SORT_FIELDS: { label: string; field: SortField }[] = [
  { label: 'Name', field: 'NAME' },
  { label: 'Created', field: 'CREATED_AT' },
  { label: 'Updated', field: 'UPDATED_AT' },
  { label: 'Checksum', field: 'CHECKSUM' },
  { label: 'Type', field: 'ENTITY_TYPE' },
];

export const P610SortPanel: React.FC<P610SortPanelProps> = ({ sortSpec, onSortChange }) => {
  const toggleDirection = () => {
    onSortChange({
      ...sortSpec,
      direction: sortSpec.direction === 'ASC' ? 'DESC' : 'ASC',
    });
  };

  const handleFieldSelect = (field: SortField) => {
    onSortChange({
      ...sortSpec,
      primaryField: field,
    });
  };

  return (
    <div className="flex items-center justify-between p-2 bg-zinc-900/40 rounded-lg border border-zinc-800 font-mono text-[9px]">
      <div className="flex items-center gap-1">
        <span className="text-zinc-500">Sort:</span>
        <div className="flex gap-1">
          {SORT_FIELDS.map((item) => (
            <button
              key={item.field}
              onClick={() => handleFieldSelect(item.field)}
              className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors cursor-pointer ${
                sortSpec.primaryField === item.field
                  ? 'bg-zinc-800 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-black/30 text-zinc-500 border-zinc-800/80 hover:text-zinc-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={toggleDirection}
        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1 text-[8px] cursor-pointer"
      >
        {sortSpec.direction === 'ASC' ? (
          <>
            <ArrowUp className="w-2.5 h-2.5" /> ASC
          </>
        ) : (
          <>
            <ArrowDown className="w-2.5 h-2.5" /> DESC
          </>
        )}
      </button>
    </div>
  );
};
