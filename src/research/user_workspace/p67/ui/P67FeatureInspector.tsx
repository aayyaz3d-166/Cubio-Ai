/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Feature Inspector Panel
 */

import React from 'react';
import { ParametricFeature, ParametricFeatureGraph } from '../types';
import { P67ParameterPanel } from './P67ParameterPanel';
import { P67ConstraintPanel } from './P67ConstraintPanel';
import { Layers, ShieldCheck } from 'lucide-react';

interface P67FeatureInspectorProps {
  feature: ParametricFeature | null;
  graph: ParametricFeatureGraph;
  onUpdateParam: (paramId: string, value: number) => void;
}

export const P67FeatureInspector: React.FC<P67FeatureInspectorProps> = ({
  feature,
  graph,
  onUpdateParam,
}) => {
  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── FEATURE HEADER ── */}
      {feature ? (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1 text-[9px]">
          <div className="font-bold text-purple-400 text-[10.5px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> {feature.name}
          </div>
          <div>Feature ID: <strong className="text-zinc-200">{feature.id}</strong></div>
          <div>State: <strong className="text-emerald-400">{feature.state}</strong></div>
          <div>Checksum: <strong className="text-cyan-400">{feature.checksum}</strong></div>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-center text-zinc-500 italic text-[10px]">
          No feature selected.
        </div>
      )}

      {/* ── PARAMETERS ── */}
      <P67ParameterPanel feature={feature} graph={graph} onUpdateParam={onUpdateParam} />

      {/* ── CONSTRAINTS ── */}
      <P67ConstraintPanel feature={feature} />
    </div>
  );
};
