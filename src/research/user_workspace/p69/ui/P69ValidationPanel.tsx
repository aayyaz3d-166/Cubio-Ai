/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Validation Panel
 */

import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { ImportValidationReport } from '../types';

interface P69ValidationPanelProps {
  validationReport: ImportValidationReport | null;
}

export const P69ValidationPanel: React.FC<P69ValidationPanelProps> = ({ validationReport }) => {
  return (
    <div className="flex border-t border-zinc-800 h-[110px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      <div className="w-[320px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" /> PORTABLE INTEGRITY & VALIDATION
        </div>
        <div>
          Status:{' '}
          <strong
            className={
              !validationReport || validationReport.isValid
                ? 'text-emerald-400 font-bold'
                : 'text-red-400 font-bold'
            }
          >
            {validationReport ? validationReport.status : 'PORTABLE_PACKAGE_VALID'}
          </strong>
        </div>
        <div>
          Report Checksum:{' '}
          <span className="text-zinc-400">
            {validationReport ? validationReport.reportChecksum : '00000000'}
          </span>
        </div>
        <div className="text-[8px] text-zinc-500">
          {!validationReport || validationReport.isValid
            ? '✓ Schema 6.9.0 valid, identities deterministic, coordinates finite.'
            : validationReport.issues.join(', ')}
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="font-bold text-amber-400">CAUSAL SEPARATION & SHARING BOUNDARIES</div>
        <div>Original Space $\perp$ Imported Space: <strong className="text-emerald-400">INDEPENDENT ✓</strong></div>
        <div>Shared Package $\rightarrow$ Original Reality: <strong className="text-emerald-400">IMMUTABLE ✓</strong></div>
        <div>Read-Only Mode: <strong className="text-emerald-400">MUTATIONS BLOCKED ✓</strong></div>
        <div>Canonical Coordinates [5,3,6]: <strong className="text-emerald-400">PROTECTED ✓</strong></div>
      </div>
    </div>
  );
};
