/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parameter Inspector Panel
 */

import React from 'react';
import { ParametricFeature, ParametricFeatureGraph } from '../types';
import { Sliders, CheckCircle2 } from 'lucide-react';

interface P67ParameterPanelProps {
  feature: ParametricFeature | null;
  graph: ParametricFeatureGraph;
  onUpdateParam: (paramId: string, value: number) => void;
}

export const P67ParameterPanel: React.FC<P67ParameterPanelProps> = ({
  feature,
  graph,
  onUpdateParam,
}) => {
  if (!feature) {
    return (
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-500 italic text-center">
        Select a feature from the tree to edit parameters.
      </div>
    );
  }

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> PARAMETERS ({feature.parameters.length})
        </span>
        <span className="text-[8px] text-zinc-500">{feature.id}</span>
      </div>

      <div className="space-y-2">
        {feature.parameters.map((p) => (
          <div key={p.id} className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-zinc-300 font-bold">{p.name}</span>
              <span className="text-cyan-400">
                {p.value} {p.unit}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={(p.max - p.min) / 100}
              value={p.value}
              onChange={(e) => onUpdateParam(p.id, parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[7.5px] text-zinc-600">
              <span>Min: {p.min}</span>
              <span>Max: {p.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
