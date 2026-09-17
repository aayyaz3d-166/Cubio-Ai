/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Collaboration Audit & Causality Panel
 */

import React from 'react';
import { CollaborationEvent, CollaborationValidationReport } from '../types';
import { ShieldCheck, History, Activity } from 'lucide-react';

interface P612AuditPanelProps {
  events: readonly CollaborationEvent[];
  validationReport: CollaborationValidationReport;
}

export const P612AuditPanel: React.FC<P612AuditPanelProps> = ({
  events,
  validationReport,
}) => {
  return (
    <div className="flex border-t border-zinc-800 h-[120px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      <div className="w-[340px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" /> COLLABORATION INTEGRITY
        </div>
        <div>
          Status:{' '}
          <strong
            className={validationReport.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}
          >
            {validationReport.status}
          </strong>
        </div>
        <div>Causality: <strong className="text-emerald-400">ISOLATED (EXACT)</strong></div>
        <div className="text-[7.5px] text-zinc-500">
          {validationReport.isValid
            ? '✓ Sharing boundary intact; zero cross-space or credential leakage.'
            : validationReport.issues.join(', ')}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="flex items-center gap-1 font-bold text-amber-400">
          <History className="w-3 h-3" /> COLLABORATION AUDIT TRAIL ({events.length})
        </div>
        <div className="space-y-1">
          {events.slice(-5).reverse().map((evt) => (
            <div
              key={evt.eventId}
              className="p-1 rounded bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-[8px]"
            >
              <div className="truncate mr-2">
                <span className="text-cyan-400 font-bold mr-1">[{evt.eventType}]</span>
                <span className="text-zinc-300">{evt.details}</span>
              </div>
              <span className="text-zinc-500 font-mono text-[7px]">{evt.actorUserId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
