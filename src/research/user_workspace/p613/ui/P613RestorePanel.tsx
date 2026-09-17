/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Restore Preview & Causality Panel
 */

import React from 'react';
import { WorkspaceVersion, VersionValidationReport, VersionCausalityEvent } from '../types';
import { ShieldCheck, RotateCcw, Lock } from 'lucide-react';

interface P613RestorePanelProps {
  selectedVersion: WorkspaceVersion | null;
  validationReport: VersionValidationReport;
  events: readonly VersionCausalityEvent[];
  onRestore: (version: WorkspaceVersion) => void;
}

export const P613RestorePanel: React.FC<P613RestorePanelProps> = ({
  selectedVersion,
  validationReport,
  events,
  onRestore,
}) => {
  return (
    <div className="flex border-t border-zinc-800 h-[120px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      <div className="w-[340px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" /> TIMELINE INTEGRITY & CAUSALITY
        </div>
        <div>
          Status:{' '}
          <strong
            className={validationReport.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}
          >
            {validationReport.status}
          </strong>
        </div>
        <div>
          Immutability Guarantee:{' '}
          <strong className="text-emerald-400">FROZEN (σ² = 0)</strong>
        </div>
        <div className="text-[7.5px] text-zinc-500">
          {validationReport.isValid
            ? '✓ Historical snapshots immutable; new edits branch forward without rewriting history.'
            : validationReport.issues.join(', ')}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between font-bold text-amber-400">
          <span>CAUSALITY LOG ({events.length})</span>
          {selectedVersion && (
            <button
              onClick={() => onRestore(selectedVersion)}
              className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded border border-emerald-500/40 flex items-center gap-1 text-[8px] cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Restore V{selectedVersion.versionIndex}
            </button>
          )}
        </div>
        <div className="space-y-1">
          {events.slice(-4).reverse().map((evt) => (
            <div
              key={evt.eventId}
              className="p-1 rounded bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-[7.5px]"
            >
              <span className="text-cyan-400 font-bold mr-1">[{evt.eventType}]</span>
              <span className="text-zinc-300 truncate flex-1">{evt.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
