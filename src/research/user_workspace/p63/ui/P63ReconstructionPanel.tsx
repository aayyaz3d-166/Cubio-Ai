/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Reconstruction & Live Causality Panel
 */

import React from 'react';
import { MultiObserverWorkspace } from '../multiObserverWorkspace';
import { Search, Activity, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

interface P63ReconstructionPanelProps {
  workspace: MultiObserverWorkspace;
}

export const P63ReconstructionPanel: React.FC<P63ReconstructionPanelProps> = ({ workspace }) => {
  const recon = workspace.getReconstruction();
  const latestAudit = workspace.causalityAudit.getLatestRecord();
  const allAudits = workspace.causalityAudit.getRecords();

  return (
    <div className="flex border-t border-zinc-800 h-[190px] overflow-hidden bg-black/70 font-mono text-[10px]">
      {/* ── RECONSTRUCTION METRICS ── */}
      <div className="w-[320px] flex-shrink-0 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1.5">
          <Search className="w-3.5 h-3.5" /> RECONSTRUCTION R
        </div>
        <div className="space-y-0.5 text-zinc-400 text-[9px] mb-2">
          <div>Combination: <strong className="text-purple-400 font-bold">{recon.combinationKey}</strong></div>
          <div>Accuracy: <strong className={recon.isExact ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{(recon.accuracyScore * 100).toFixed(1)}%</strong></div>
          <div>Certainty: <strong className="text-zinc-200">{recon.certainty}</strong></div>
          <div>Info Loss: <strong className="text-amber-400">{recon.informationLoss.toFixed(1)}%</strong> | Gain: <strong className="text-emerald-400">+{recon.informationGain.toFixed(1)}%</strong></div>
          <div>Candidate Volume: <strong className="text-zinc-300">{recon.candidateSpace.volume.toFixed(3)}</strong> (Red: {(recon.candidateSpace.reductionRatio * 100).toFixed(2)}%)</div>
        </div>

        <div className={`p-1.5 rounded text-[8.5px] border ${
          recon.isExact
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {recon.isExact
            ? '✓ FULL GEOMETRIC RECONSTRUCTION'
            : '⚠ CONSTRAINED (SINGLE-VIEW DIMENSIONAL LOSS)'}
        </div>
      </div>

      {/* ── RECONSTRUCTED COORDINATE TRIANGULATION ── */}
      <div className="flex-1 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="font-bold text-zinc-300 mb-1 flex items-center justify-between">
          <span>COORDINATE CONSTRAINT INTERSECTION</span>
          <span className="text-[9px] text-zinc-500">{recon.totalObjects} Nodes</span>
        </div>

        <div className="space-y-1">
          {recon.reconstructedCoordinates.map((coord) => (
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

      {/* ── LIVE CAUSALITY CHAIN & AUDIT LOG ── */}
      <div className="w-[360px] flex-shrink-0 p-2.5 overflow-y-auto text-[8.5px]">
        <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> LIVE CAUSALITY CHAIN
        </div>

        {latestAudit ? (
          <div className="p-1.5 mb-1.5 rounded bg-zinc-900/60 border border-zinc-800 space-y-0.5">
            <div className="font-bold text-cyan-400">{latestAudit.description}</div>
            <div>Reality: <span className="text-zinc-500">{latestAudit.realityChecksumBefore}</span> → <span className="text-cyan-400">{latestAudit.realityChecksumAfter}</span></div>
            <div>Frames: [{latestAudit.frameChecksumsAfter.join(', ')}]</div>
            <div className="text-emerald-400 font-bold">Causality Preserved: {latestAudit.isCausallySeparated ? 'YES ✓' : 'NO ✗'}</div>
          </div>
        ) : (
          <div className="text-zinc-500 italic mb-1.5">No mutations recorded yet (baseline state).</div>
        )}

        <div className="text-[8px] text-zinc-500">
          Total Mutation Steps: {allAudits.length} | Canonical Isolation: Preserved ✓
        </div>
      </div>
    </div>
  );
};
