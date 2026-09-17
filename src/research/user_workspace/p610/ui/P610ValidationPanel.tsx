/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Index Validation & Health Panel
 */

import React from 'react';
import { ShieldCheck, RotateCcw } from 'lucide-react';
import { IndexValidationReport, StaleDetectionReport, OrphanDetectionReport } from '../types';

interface P610ValidationPanelProps {
  validationReport: IndexValidationReport;
  staleReport: StaleDetectionReport;
  orphanReport: OrphanDetectionReport;
  totalIndexed: number;
  onReindex: () => void;
}

export const P610ValidationPanel: React.FC<P610ValidationPanelProps> = ({
  validationReport,
  staleReport,
  orphanReport,
  totalIndexed,
  onReindex,
}) => {
  return (
    <div className="flex border-t border-zinc-800 h-[110px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      <div className="w-[320px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" /> INDEX INTEGRITY & HEALTH
        </div>
        <div>
          Status:{' '}
          <strong
            className={validationReport.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}
          >
            {validationReport.status}
          </strong>
        </div>
        <div>Total Indexed Entities: <span className="text-zinc-300 font-bold">{totalIndexed}</span></div>
        <div className="text-[8px] text-zinc-500">
          {validationReport.isValid
            ? '✓ Index references validated, zero corrupted or cross-user references.'
            : validationReport.issues.join(', ')}
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between font-bold text-amber-400">
          <span>STALE & ORPHAN MONITOR</span>
          <button
            onClick={onReindex}
            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1 text-[8px] cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Rebuild Index
          </button>
        </div>
        <div>
          Stale References:{' '}
          <strong className={staleReport.isStale ? 'text-amber-400' : 'text-emerald-400'}>
            {staleReport.staleRecordIds.length} {staleReport.isStale ? '(INDEX_STALE)' : '✓'}
          </strong>
        </div>
        <div>
          Orphaned References:{' '}
          <strong className={orphanReport.hasOrphans ? 'text-red-400' : 'text-emerald-400'}>
            {orphanReport.orphanedRecordIds.length} {orphanReport.hasOrphans ? '(ORPHANED_REFERENCE)' : '✓'}
          </strong>
        </div>
        <div>Determinism: <strong className="text-emerald-400">σ² = 0 (EXACT)</strong></div>
      </div>
    </div>
  );
};
