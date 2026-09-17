/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Information Boundary Inspector Panel
 */

import React from 'react';
import { FusionResult, PropertyInformationBoundary } from '../types';
import { ShieldAlert, CheckCircle, HelpCircle, Lock } from 'lucide-react';

interface P64InformationBoundaryPanelProps {
  fusionResult: FusionResult;
}

export const P64InformationBoundaryPanel: React.FC<P64InformationBoundaryPanelProps> = ({
  fusionResult,
}) => {
  const boundaries = fusionResult.informationBoundaries;

  const geometric = boundaries.filter((b) => b.category === 'GEOMETRIC_SPATIAL');
  const observableNonGeo = boundaries.filter((b) => b.category === 'OBSERVABLE_NON_GEOMETRIC');
  const unobservable = boundaries.filter((b) => b.category === 'UNOBSERVABLE_INTERNAL_PAYLOAD');

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-amber-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" /> TRIPARTITE INFORMATION BOUNDARY
        </span>
        <span className="text-[9px] text-zinc-500">{boundaries.length} Tracked Properties</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* DOMAIN 1: GEOMETRIC SPATIAL */}
        <div className="p-2 rounded bg-black/40 border border-cyan-500/30">
          <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 1. GEOMETRIC SPATIAL
          </div>
          <div className="text-[8.5px] text-zinc-400 space-y-0.5">
            <div>Recoverable: <strong className="text-emerald-400">YES (via Triangulation)</strong></div>
            <div>Accuracy: <strong className="text-zinc-200">{(fusionResult.geometricAccuracy * 100).toFixed(1)}%</strong></div>
            <div>Loss: <strong className="text-amber-400">{fusionResult.geometricInformationLoss.toFixed(1)}%</strong></div>
          </div>
        </div>

        {/* DOMAIN 2: OBSERVABLE NON-GEOMETRIC */}
        <div className="p-2 rounded bg-black/40 border border-emerald-500/30">
          <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 2. OBSERVABLE NON-GEOMETRIC
          </div>
          <div className="text-[8.5px] text-zinc-400 space-y-0.5">
            <div>Properties: <strong className="text-zinc-200">Label, Color, Category</strong></div>
            <div>Status: <strong className="text-emerald-400">100% PRESERVED</strong></div>
            <div>In Projection: <strong className="text-zinc-200">YES</strong></div>
          </div>
        </div>

        {/* DOMAIN 3: UNOBSERVABLE INTERNAL PAYLOAD */}
        <div className="p-2 rounded bg-black/40 border border-red-500/30">
          <div className="text-red-400 font-bold mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3" /> 3. UNOBSERVABLE PAYLOAD
          </div>
          <div className="text-[8.5px] text-zinc-400 space-y-0.5">
            <div>In Principle: <strong className="text-red-400">UNRECOVERABLE</strong></div>
            <div>Recovered: <strong className="text-red-400">0.0%</strong></div>
            <div>Observers Needed: <strong className="text-zinc-500">N/A (Unprojected)</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
