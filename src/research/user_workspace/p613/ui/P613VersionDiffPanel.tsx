/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Diff & Delta Inspection Panel
 */

import React from 'react';
import { VersionDiff } from '../types';
import { GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';

interface P613VersionDiffPanelProps {
  diff: VersionDiff | null;
}

export const P613VersionDiffPanel: React.FC<P613VersionDiffPanelProps> = ({ diff }) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <GitCompare className="w-3.5 h-3.5" /> VERSION DELTA DIFF
        </span>
        {diff && (
          <span
            className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold ${
              diff.overallClassification === 'UNCHANGED'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : diff.overallClassification === 'BRANCHED'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                : 'bg-amber-950/60 text-amber-300 border border-amber-800'
            }`}
          >
            {diff.overallClassification}
          </span>
        )}
      </div>

      {diff ? (
        <div className="space-y-1.5 text-[8px]">
          <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between">
            <span className="text-zinc-500">Comparing:</span>
            <span className="text-zinc-300 font-mono">
              {diff.versionIdA.slice(0, 12)}... ↔ {diff.versionIdB.slice(0, 12)}...
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-500">Reality:</span>
              <span className={diff.changedReality ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {diff.changedReality ? 'MODIFIED' : 'EQUAL'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-500">Objects:</span>
              <span className={diff.changedObjects ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {diff.changedObjects ? 'MODIFIED' : 'EQUAL'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-500">Observers:</span>
              <span className={diff.changedObservers ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {diff.changedObservers ? 'MODIFIED' : 'EQUAL'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-500">Geometry:</span>
              <span className={diff.changedGeometry ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {diff.changedGeometry ? 'MODIFIED' : 'EQUAL'}
              </span>
            </div>
          </div>

          {(diff.addedObjectIds.length > 0 ||
            diff.removedObjectIds.length > 0 ||
            diff.modifiedObjectIds.length > 0) && (
            <div className="p-1.5 rounded bg-black/40 border border-zinc-800 space-y-0.5">
              {diff.addedObjectIds.length > 0 && (
                <div className="text-emerald-400">Added: {diff.addedObjectIds.join(', ')}</div>
              )}
              {diff.removedObjectIds.length > 0 && (
                <div className="text-red-400">Removed: {diff.removedObjectIds.join(', ')}</div>
              )}
              {diff.modifiedObjectIds.length > 0 && (
                <div className="text-amber-400">Modified: {diff.modifiedObjectIds.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-4 text-[8.5px]">
          Select versions to view diff.
        </div>
      )}
    </div>
  );
};
