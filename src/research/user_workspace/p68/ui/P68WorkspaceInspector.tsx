/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Workspace Inspector Panel
 */

import React from 'react';
import { PersonalSpace } from '../types';
import { Database } from 'lucide-react';

interface P68WorkspaceInspectorProps {
  activeSpace: PersonalSpace | undefined;
  workspaceChecksum: string;
}

export const P68WorkspaceInspector: React.FC<P68WorkspaceInspectorProps> = ({
  activeSpace,
  workspaceChecksum,
}) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> WORKSPACE INSPECTOR
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold text-[8px]">
          SCHEMA 6.8.0
        </span>
      </div>

      <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Workspace Checksum:</span>
          <span className="text-zinc-300 font-mono">{workspaceChecksum}</span>
        </div>
        {activeSpace ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Active Space ID:</span>
              <span className="text-amber-400 font-bold">{activeSpace.spaceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Space Name:</span>
              <span className="text-zinc-200">{activeSpace.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Space Checksum:</span>
              <span className="text-zinc-300 font-mono">{activeSpace.spaceChecksum}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Reality Checksum:</span>
              <span className="text-cyan-400 font-mono">{activeSpace.reality.realityChecksum}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Model Checksum:</span>
              <span className="text-purple-400 font-mono">{activeSpace.modelScene.modelChecksum}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Geometry Checksum:</span>
              <span className="text-emerald-400 font-mono">{activeSpace.geometryScene.sceneChecksum}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Active Observers:</span>
              <span className="text-zinc-300">{activeSpace.observers.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Dimension State:</span>
              <span className="text-amber-400 font-bold">
                {activeSpace.dimension.dimensionType} ({activeSpace.dimension.activeDimensions}D)
              </span>
            </div>
          </>
        ) : (
          <div className="text-zinc-500 italic py-1">No active space selected.</div>
        )}
      </div>
    </div>
  );
};
