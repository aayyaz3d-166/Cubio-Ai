/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Space & Entity Search Results List
 */

import React from 'react';
import { IndexRecord } from '../types';
import { Folder, Star, Tag, ExternalLink } from 'lucide-react';

interface P610SpaceResultsProps {
  records: readonly IndexRecord[];
  selectedRecordId: string | null;
  onSelectRecord: (record: IndexRecord) => void;
  onTogglePin: (record: IndexRecord) => void;
  onOpenEntity: (record: IndexRecord) => void;
}

export const P610SpaceResults: React.FC<P610SpaceResultsProps> = ({
  records,
  selectedRecordId,
  onSelectRecord,
  onTogglePin,
  onOpenEntity,
}) => {
  return (
    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 font-mono text-[9px]">
      {records.length > 0 ? (
        records.map((rec) => {
          const isSelected = rec.recordId === selectedRecordId;

          return (
            <div
              key={rec.recordId}
              onClick={() => onSelectRecord(rec)}
              className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                  : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <div className="flex-1 truncate mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-zinc-800 text-[7px] text-zinc-300 font-bold">
                    {rec.entityType}
                  </span>
                  <span className="font-bold truncate text-zinc-200">{rec.name}</span>
                </div>
                <div className="text-[7.5px] text-zinc-500 truncate mt-0.5">
                  ID: {rec.entityId} | Space: {rec.spaceId} | CS: {rec.checksumRef.slice(0, 8)}
                </div>
                {rec.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="w-2.5 h-2.5 text-zinc-600" />
                    {rec.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1 py-0.2 rounded bg-black/60 border border-zinc-800 text-[7px] text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(rec);
                  }}
                  title={rec.isPinned ? 'Unpin' : 'Pin'}
                  className={`p-1 rounded hover:bg-zinc-800 cursor-pointer ${
                    rec.isPinned ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEntity(rec);
                  }}
                  title="Open Target"
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-zinc-500 italic py-8 text-[9px]">
          No matching entities found in workspace index.
        </div>
      )}
    </div>
  );
};
