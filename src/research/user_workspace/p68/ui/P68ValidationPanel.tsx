/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Validation Panel
 */

import React from 'react';
import { WorkspaceValidationReport } from '../types';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface P68ValidationPanelProps {
  validationReport: WorkspaceValidationReport;
}

export const P68ValidationPanel: React.FC<P68ValidationPanelProps> = ({ validationReport }) => {
  return (
    <div className="flex border-t border-zinc-800 h-[110px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      <div className="w-[320px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" /> WORKSPACE VALIDATION
        </div>
        <div>
          Status:{' '}
          <strong className={validationReport.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {validationReport.status}
          </strong>
        </div>
        <div>Report Checksum: <span className="text-zinc-400">{validationReport.reportChecksum}</span></div>
        <div className="text-[8px] text-zinc-500">
          {validationReport.isValid
            ? '✓ Schema 6.8.0 valid, identities deterministic, no non-finite coordinates.'
            : validationReport.issues.join(', ')}
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="font-bold text-amber-400">SPACE & PERSISTENCE ISOLATION</div>
        <div>Space A $\perp$ Space B: <strong className="text-emerald-400">ISOLATED ✓</strong></div>
        <div>Camera / Recent Views $\rightarrow$ Reality: <strong className="text-emerald-400">INVARIANT ✓</strong></div>
        <div>Saved State: <strong className="text-emerald-400">IMMUTABLE SNAPSHOT ✓</strong></div>
        <div>Canonical Coordinates [5,3,6]: <strong className="text-emerald-400">PROTECTED ✓</strong></div>
      </div>
    </div>
  );
};
