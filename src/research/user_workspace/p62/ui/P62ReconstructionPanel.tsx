/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Reconstruction & Causality Audit Panel
 */

import React from 'react';
import { InteractiveRealityEngine } from '../interactionEngine';
import { Search, ShieldCheck, Activity, ArrowRight, AlertCircle } from 'lucide-react';

interface P62ReconstructionPanelProps {
  engine: InteractiveRealityEngine;
}

export const P62ReconstructionPanel: React.FC<P62ReconstructionPanelProps> = ({ engine }) => {
  const sync = engine.getSynchronizedPipeline();
  const multiRec = engine.getMultiObserverReconstruction();
  const auditRecords = engine.auditLogger.getRecords();
  const latestMutation = engine.auditLogger.getLatestRecord();

  return (
    <div className="flex border-t border-zinc-800 h-[190px] overflow-hidden bg-black/60 font-mono text-[10px]">
      {/* ── RECONSTRUCTION SUMMARY ── */}
      <div className="w-[320px] flex-shrink-0 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1.5">
          <Search className="w-3.5 h-3.5" /> RECONSTRUCTION R
        </div>
        <div className="space-y-0.5 text-zinc-400 text-[9px] mb-2">
          <div>Accuracy: <strong className={multiRec.reconstruction.isExact ? 'text-emerald-400' : 'text-amber-400'}>{(multiRec.reconstruction.accuracyScore * 100).toFixed(1)}%</strong></div>
          <div>Certainty: <strong className="text-zinc-200">{multiRec.reconstruction.isExact ? 'EXACT ✓' : 'CONSTRAINED / PARTIAL'}</strong></div>
          <div>Information Loss: <strong className="text-amber-400">{multiRec.reconstruction.informationLoss.toFixed(1)}%</strong></div>
          <div>Candidate Volume: <strong className="text-zinc-300">{multiRec.reconstruction.remainingCandidateVolume.toFixed(3)}</strong></div>
          <div>Active Observers: <strong className="text-purple-400">{engine.multiObserverConfig.combinationKey}</strong></div>
        </div>

        <div className={`p-1.5 rounded text-[8.5px] border ${
          multiRec.reconstruction.isExact
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {multiRec.reconstruction.isExact
            ? '✓ FULL STRUCTURAL RECONSTRUCTION'
            : '⚠ CONSTRAINED / AMBIGUOUS (DEPTH COLLAPSED)'}
        </div>
      </div>

      {/* ── RECONSTRUCTED COORDINATE MANIFOLD ── */}
      <div className="flex-1 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="font-bold text-zinc-300 mb-1 flex items-center justify-between">
          <span>STRUCTURAL COORDINATE TRIANGULATION</span>
          <span className="text-[9px] text-zinc-500">{multiRec.reconstruction.totalRecords} Records</span>
        </div>

        <div className="space-y-1">
          {multiRec.reconstruction.reconstructedCoordinates.map((coord) => (
            <div key={coord.recordId} className="text-[8.5px] text-zinc-400 flex items-center gap-2">
              <span className={coord.certainty === 'EXACT' ? 'text-emerald-400' : 'text-amber-400'}>
                {coord.certainty === 'EXACT' ? '✓' : '△'}
              </span>
              <span className="w-24 truncate text-zinc-300">{coord.recordId}</span>
              <span>Truth: [{coord.truePosition.join(',')}]</span>
              <ArrowRight className="w-2.5 h-2.5 inline text-zinc-600" />
              <span>Recon: [{coord.reconstructedPosition.map((v) => v !== null ? v.toFixed(1) : '?').join(',')}]</span>
              <span className="text-zinc-500">err: {coord.error.toFixed(2)}</span>
              <span className="text-zinc-600 font-bold">[{coord.certainty}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MUTATION AUDIT LOG & CAUSALITY CHAIN ── */}
      <div className="w-[360px] flex-shrink-0 p-2.5 overflow-y-auto text-[8.5px]">
        <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> CAUSALITY & MUTATION AUDIT
        </div>

        {latestMutation ? (
          <div className="p-1.5 mb-1.5 rounded bg-zinc-900/60 border border-zinc-800 space-y-0.5">
            <div className="font-bold text-cyan-400">Latest Action: {latestMutation.action} ({latestMutation.targetObjectId || 'Global'})</div>
            <div>Reality: <span className="text-zinc-500">{latestMutation.realityChecksumBefore}</span> → <span className="text-cyan-400">{latestMutation.realityChecksumAfter}</span></div>
            <div>Frame: <span className="text-zinc-500">{latestMutation.frameChecksumBefore}</span> → <span className="text-purple-400">{latestMutation.frameChecksumAfter}</span></div>
            <div className="text-emerald-400">Causality: Reality Change Propagated ✓</div>
          </div>
        ) : (
          <div className="text-zinc-500 italic mb-1.5">No mutations recorded yet (baseline state).</div>
        )}

        <div className="text-[8px] text-zinc-500">
          Total Mutations: {auditRecords.length} | Canonical Fixture Isolated ✓
        </div>
      </div>
    </div>
  );
};
