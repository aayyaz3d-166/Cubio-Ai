/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Provenance Panel
 */

import React from 'react';
import { PersonalSpace } from '../../p68/types';
import { GitFork } from 'lucide-react';

interface P69ProvenancePanelProps {
  activeSpace: PersonalSpace | undefined;
}

export const P69ProvenancePanel: React.FC<P69ProvenancePanelProps> = ({ activeSpace }) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-purple-400 flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5" /> PROVENANCE & LINEAGE
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-purple-300 font-bold text-[8px]">
          SCHEMA 6.9.0
        </span>
      </div>

      <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Source Space Ref:</span>
          <span className="text-zinc-300 font-mono">
            {activeSpace?.metadata.sourceSpaceIdRef || 'ROOT (None)'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Lineage ID:</span>
          <span className="text-purple-400 font-mono">
            {activeSpace?.metadata.lineageId || 'CANONICAL_LINEAGE'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Author:</span>
          <span className="text-zinc-300">{activeSpace?.metadata.author || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Space Checksum:</span>
          <span className="text-zinc-400 font-mono">{activeSpace?.spaceChecksum || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};
