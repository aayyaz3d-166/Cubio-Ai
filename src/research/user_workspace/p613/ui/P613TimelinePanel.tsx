/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Workspace Version Timeline Panel
 */

import React from 'react';
import { WorkspaceVersion } from '../types';
import { GitCommit, GitBranch, Bookmark, RotateCcw, Plus } from 'lucide-react';

interface P613TimelinePanelProps {
  versions: readonly WorkspaceVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (version: WorkspaceVersion) => void;
  onSaveVersion: () => void;
  onCreateCheckpoint: () => void;
  onRestoreVersion: (version: WorkspaceVersion) => void;
  onBranchVersion: (version: WorkspaceVersion) => void;
}

export const P613TimelinePanel: React.FC<P613TimelinePanelProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  onSaveVersion,
  onCreateCheckpoint,
  onRestoreVersion,
  onBranchVersion,
}) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <GitCommit className="w-3.5 h-3.5" /> VERSION TIMELINE ({versions.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={onSaveVersion}
            className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 rounded border border-cyan-500/40 text-[8px] font-bold cursor-pointer"
          >
            + Save
          </button>
          <button
            onClick={onCreateCheckpoint}
            className="px-2 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded border border-amber-500/40 text-[8px] font-bold cursor-pointer"
          >
            Checkpoint
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
        {versions.map((ver, idx) => {
          const isSelected = ver.versionId === selectedVersionId;
          const isHead = idx === versions.length - 1;

          return (
            <div
              key={ver.versionId}
              onClick={() => onSelectVersion(ver)}
              className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                  : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <div className="flex-1 truncate mr-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                      ver.versionType === 'INITIAL'
                        ? 'bg-zinc-800 text-zinc-300'
                        : ver.versionType === 'BRANCH'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                        : ver.versionType === 'MANUAL_CHECKPOINT'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        : ver.versionType === 'RESTORE_POINT'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {ver.versionType}
                  </span>
                  <span className="font-bold text-zinc-200 text-[8.5px] truncate">
                    V{ver.versionIndex} {ver.branchName ? `(${ver.branchName})` : ''}
                  </span>
                  {isHead && (
                    <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[7px] font-bold">
                      HEAD
                    </span>
                  )}
                </div>
                <div className="text-[7.5px] text-zinc-500 truncate mt-0.5">
                  {ver.changeSummary}
                </div>
                <div className="text-[7px] text-zinc-600 font-mono mt-0.5">
                  ID: {ver.versionId} | CS: {ver.stateChecksum.slice(0, 8)}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBranchVersion(ver);
                  }}
                  title="Create Branch from here"
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-purple-300 cursor-pointer"
                >
                  <GitBranch className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestoreVersion(ver);
                  }}
                  title="Restore this version"
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
