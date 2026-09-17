/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Feature Tree Panel
 */

import React from 'react';
import { ParametricFeatureGraph, ParametricFeature } from '../types';
import { Network, Eye, EyeOff, Trash2, Box, CircleDot, Scissors } from 'lucide-react';

interface P67FeatureTreeProps {
  graph: ParametricFeatureGraph;
  selectedFeatureId: string | null;
  onSelectFeature: (id: string) => void;
  onToggleSuppress: (id: string) => void;
  onDeleteFeature: (id: string) => void;
}

export const P67FeatureTree: React.FC<P67FeatureTreeProps> = ({
  graph,
  selectedFeatureId,
  onSelectFeature,
  onToggleSuppress,
  onDeleteFeature,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'EXTRUDE':
      case 'REVOLVE':
        return <Box className="w-3 h-3 text-purple-400" />;
      case 'FILLET':
      case 'CHAMFER':
        return <Scissors className="w-3 h-3 text-amber-400" />;
      default:
        return <CircleDot className="w-3 h-3 text-cyan-400" />;
    }
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-purple-400 flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5" /> FEATURE TREE ({graph.features.length})
        </span>
        <span className="text-[8px] text-zinc-500">Order: {graph.executionOrder.join(' → ')}</span>
      </div>

      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
        {graph.features.map((f) => {
          const isSelected = f.id === selectedFeatureId;
          const isSuppressed = f.state === 'SUPPRESSED';

          return (
            <div
              key={f.id}
              onClick={() => onSelectFeature(f.id)}
              className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-300'
                  : isSuppressed
                  ? 'bg-zinc-900/40 border-zinc-800/40 text-zinc-600'
                  : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate text-[9px]">
                {getIcon(f.type)}
                <span className="font-bold truncate">{f.name}</span>
                <span className="text-[7.5px] text-zinc-500">[{f.type}]</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSuppress(f.id);
                  }}
                  title={isSuppressed ? 'Unsuppress' : 'Suppress'}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-0.5"
                >
                  {isSuppressed ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFeature(f.id);
                  }}
                  title="Delete Feature"
                  className="text-zinc-500 hover:text-red-400 cursor-pointer p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
