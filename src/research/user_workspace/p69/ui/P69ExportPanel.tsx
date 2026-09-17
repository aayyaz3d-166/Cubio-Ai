/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Space Export Panel
 */

import React from 'react';
import { PersonalSpace } from '../../p68/types';
import { ResearchExportPackage } from '../types';
import { Download, CheckCircle2, XCircle, Share2, Copy } from 'lucide-react';

interface P69ExportPanelProps {
  activeSpace: PersonalSpace | undefined;
  lastExport: ResearchExportPackage | null;
  onExportSpace: () => void;
  onCloneSpace: () => void;
  onCreateSharePackage: () => void;
}

export const P69ExportPanel: React.FC<P69ExportPanelProps> = ({
  activeSpace,
  lastExport,
  onExportSpace,
  onCloneSpace,
  onCreateSharePackage,
}) => {
  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> EXPORT & SHARING
        </span>
      </div>

      <div className="space-y-1.5">
        <button
          onClick={onExportSpace}
          disabled={!activeSpace}
          className="w-full py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded border border-cyan-500/30 flex items-center justify-center gap-1.5 text-[9px] cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3 h-3" /> Export Space (JSON Package)
        </button>

        <button
          onClick={onCloneSpace}
          disabled={!activeSpace}
          className="w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded border border-purple-500/30 flex items-center justify-center gap-1.5 text-[9px] cursor-pointer disabled:opacity-50"
        >
          <Copy className="w-3 h-3" /> Clone Space as Independent Domain
        </button>

        <button
          onClick={onCreateSharePackage}
          disabled={!activeSpace}
          className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/30 flex items-center justify-center gap-1.5 text-[9px] cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-3 h-3" /> Create Read-Only Share Package
        </button>
      </div>

      {lastExport && (
        <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
          <div className="flex items-center justify-between font-bold text-zinc-300">
            <span>Last Export:</span>
            <span
              className={
                lastExport.manifest.classification === 'RESEARCH_EXPORT_READY'
                  ? 'text-emerald-400 flex items-center gap-0.5'
                  : 'text-red-400 flex items-center gap-0.5'
              }
            >
              {lastExport.manifest.classification === 'RESEARCH_EXPORT_READY' ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <XCircle className="w-2.5 h-2.5" />
              )}
              {lastExport.manifest.classification}
            </span>
          </div>
          <div className="text-[7.5px] text-zinc-500 truncate">
            Export ID: {lastExport.manifest.exportId}
          </div>
          <div className="text-[7.5px] text-zinc-500 truncate">
            Checksum: {lastExport.manifest.exportChecksum}
          </div>
        </div>
      )}
    </div>
  );
};
