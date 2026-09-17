/**
 * 3D Memory Studio — Funnel 77
 * Component: ViewportSelectionMarker
 */

import React from 'react';
import { SpatialSelectionContext } from '../types';
import { Target } from 'lucide-react';

interface ViewportSelectionMarkerProps {
  selection: SpatialSelectionContext | null;
}

export const ViewportSelectionMarker: React.FC<ViewportSelectionMarkerProps> = ({ selection }) => {
  if (!selection || !selection.selectedId) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 px-3 py-2 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-xl font-mono text-xs select-none shadow-2xl flex items-center gap-3">
      <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
        <Target className="w-4 h-4 animate-spin-slow" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Selected:</span>
          <span className="font-extrabold text-cyan-300">{selection.label || selection.selectedId}</span>
        </div>
        {selection.position && (
          <div className="text-[10px] text-zinc-400 font-medium">
            X: {selection.position[0].toFixed(1)} Y: {selection.position[1].toFixed(1)} Z: {selection.position[2].toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};
