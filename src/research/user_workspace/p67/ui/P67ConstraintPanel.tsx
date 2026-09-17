/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Constraint Panel
 */

import React from 'react';
import { ParametricFeature } from '../types';
import { Anchor } from 'lucide-react';

interface P67ConstraintPanelProps {
  feature: ParametricFeature | null;
}

export const P67ConstraintPanel: React.FC<P67ConstraintPanelProps> = ({ feature }) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-amber-400 flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5" /> CONSTRAINTS & TOPOLOGY
        </span>
      </div>

      <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
        <div>Feature Type: <strong className="text-zinc-200">{feature?.type || 'N/A'}</strong></div>
        <div>Certainty: <strong className="text-emerald-400">{feature?.certainty || 'EXACT'}</strong></div>
        <div>Parent: <span className="text-zinc-500">{feature?.parentFeatureId || 'Root'}</span></div>
        <div>Dependencies: <span className="text-zinc-400">{feature?.dependencyIds.join(', ') || 'None'}</span></div>
      </div>
    </div>
  );
};
