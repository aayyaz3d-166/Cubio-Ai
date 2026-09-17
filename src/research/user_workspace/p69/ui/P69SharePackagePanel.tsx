/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Share Package Panel
 */

import React from 'react';
import { SharePackage } from '../types';
import { Share2, Lock } from 'lucide-react';

interface P69SharePackagePanelProps {
  sharePackage: SharePackage | null;
  onViewInReadonly: () => void;
}

export const P69SharePackagePanel: React.FC<P69SharePackagePanelProps> = ({
  sharePackage,
  onViewInReadonly,
}) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" /> SHARE PACKAGE (IMMUTABLE)
        </span>
        <span className="flex items-center gap-1 text-[8px] text-zinc-400">
          <Lock className="w-2.5 h-2.5 text-amber-400" /> Read-Only
        </span>
      </div>

      {sharePackage ? (
        <div className="space-y-1.5">
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Share Package ID:</span>
              <span className="text-zinc-300 font-bold">{sharePackage.sharePackageId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Source Space ID:</span>
              <span className="text-amber-400">{sharePackage.sourceSpaceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Checksum:</span>
              <span className="text-zinc-400 font-mono">{sharePackage.checksum}</span>
            </div>
          </div>

          <button
            onClick={onViewInReadonly}
            className="w-full py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/30 flex items-center justify-center gap-1 text-[8.5px] cursor-pointer"
          >
            Open in Read-Only Workspace
          </button>
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-2 text-[8.5px]">
          No active share package generated.
        </div>
      )}
    </div>
  );
};
