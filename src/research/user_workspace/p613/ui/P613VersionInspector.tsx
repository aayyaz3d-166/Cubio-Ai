/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Inspector Panel
 */

import React from 'react';
import { WorkspaceVersion } from '../types';
import { Database, GitCommit, ShieldCheck, Box } from 'lucide-react';

interface P613VersionInspectorProps {
  selectedVersion: WorkspaceVersion | null;
}

export const P613VersionInspector: React.FC<P613VersionInspectorProps> = ({ selectedVersion }) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> VERSION INSPECTOR
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold text-[8px]">
          SCHEMA 6.13.0
        </span>
      </div>

      {selectedVersion ? (
        <div className="space-y-2 text-[8.5px]">
          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Version ID:</span>
              <span className="text-zinc-200 font-mono">{selectedVersion.versionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Workspace ID:</span>
              <span className="text-zinc-300 font-mono">{selectedVersion.workspaceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Parent Version:</span>
              <span className="text-purple-400 font-mono">
                {selectedVersion.parentVersionId || 'ROOT (None)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Type:</span>
              <span className="text-amber-400 font-bold">{selectedVersion.versionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">State Checksum:</span>
              <span className="text-cyan-400 font-mono">{selectedVersion.stateChecksum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Lineage ID:</span>
              <span className="text-zinc-400 font-mono truncate max-w-[150px]">
                {selectedVersion.lineageId}
              </span>
            </div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1">
            <div className="font-bold text-zinc-300 flex items-center gap-1">
              <Box className="w-3 h-3 text-cyan-400" /> STATE PAYLOAD
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Reality Checksum:</span>
              <span className="text-zinc-300 font-mono">{selectedVersion.statePayload.realityChecksum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">3D Objects:</span>
              <span className="text-zinc-200 font-bold">{selectedVersion.statePayload.objects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Observers:</span>
              <span className="text-zinc-200 font-bold">{selectedVersion.statePayload.observers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dimension:</span>
              <span className="text-amber-400 font-bold">
                {selectedVersion.statePayload.dimension.dimensionType} ({selectedVersion.statePayload.dimension.activeDimensions}D)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Viewport Mode:</span>
              <span className="text-purple-400 font-bold">{selectedVersion.statePayload.view.viewportMode}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 italic py-4 text-[8.5px]">
          Select a version to inspect.
        </div>
      )}
    </div>
  );
};
