/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Recent Views Panel
 */

import React from 'react';
import { RecentViewRecord } from '../types';
import { Eye, Trash2 } from 'lucide-react';

interface P68RecentViewsPanelProps {
  recentViews: readonly RecentViewRecord[];
  onClearRecentViews: () => void;
}

export const P68RecentViewsPanel: React.FC<P68RecentViewsPanelProps> = ({
  recentViews,
  onClearRecentViews,
}) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-purple-400 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> RECENT VIEWS ({recentViews.length})
        </span>
        {recentViews.length > 0 && (
          <button
            onClick={onClearRecentViews}
            className="text-[7.5px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 cursor-pointer"
          >
            <Trash2 className="w-2.5 h-2.5" /> Clear
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
        {recentViews.length > 0 ? (
          recentViews.map((rv) => (
            <div
              key={rv.viewId}
              className="p-1.5 rounded bg-black/40 border border-zinc-800 text-[8px] flex items-center justify-between"
            >
              <div className="truncate">
                <span className="text-zinc-300 font-bold">{rv.viewId}</span>
                <span className="text-zinc-500 ml-1">
                  Pos: [{rv.view.cameraPosition.join(', ')}] | Mode: {rv.view.viewportMode}
                </span>
              </div>
              <span className="text-purple-400 text-[7px]">{rv.dimension.dimensionType}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-zinc-500 italic py-1 text-[8.5px]">No recent views recorded.</div>
        )}
      </div>
    </div>
  );
};
