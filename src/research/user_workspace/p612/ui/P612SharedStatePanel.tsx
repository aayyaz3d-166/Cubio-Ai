/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Shared State & Privacy Boundary Panel
 */

import React from 'react';
import { SharedWorkspaceState } from '../types';
import { Eye, ShieldCheck, Lock } from 'lucide-react';

interface P612SharedStatePanelProps {
  sharedState: SharedWorkspaceState | null;
}

export const P612SharedStatePanel: React.FC<P612SharedStatePanelProps> = ({ sharedState }) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> SHARED STATE
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold text-[8px]">
          SCHEMA 6.12.0
        </span>
      </div>

      {sharedState ? (
        <div className="space-y-2 text-[8.5px]">
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Reality Checksum:</span>
              <span className="text-zinc-300 font-mono">{sharedState.realityChecksum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Shared State Checksum:</span>
              <span className="text-cyan-400 font-mono">{sharedState.sharedStateChecksum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Shared Objects:</span>
              <span className="text-zinc-200 font-bold">{sharedState.objects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Shared Observers:</span>
              <span className="text-zinc-200 font-bold">{sharedState.observers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dimension:</span>
              <span className="text-amber-400 font-bold">{sharedState.dimension.dimensionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Viewport:</span>
              <span className="text-purple-400 font-bold">{sharedState.view.viewportMode}</span>
            </div>
          </div>

          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/40 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> EXCLUDED PRIVATE STATE
            </div>
            <div className="text-[7.5px] text-zinc-400 space-y-0.5">
              <div>✓ Other user spaces: ISOLATED</div>
              <div>✓ Private experiments: EXCLUDED</div>
              <div>✓ Account credentials: EXCLUDED</div>
              <div>✓ Payment / billing: EXCLUDED</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-4 text-[8.5px]">
          No shared state active or access revoked.
        </div>
      )}
    </div>
  );
};
