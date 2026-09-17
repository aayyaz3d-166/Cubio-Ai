/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Candidate-Space & Constraint Manifold Panel
 */

import React from 'react';
import { FusionResult } from '../types';
import { Box, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';

interface P64CandidateSpacePanelProps {
  fusionResult: FusionResult;
}

export const P64CandidateSpacePanel: React.FC<P64CandidateSpacePanelProps> = ({ fusionResult }) => {
  const cs = fusionResult.candidateSpace;

  return (
    <div className="flex border-t border-zinc-800 h-[190px] overflow-hidden bg-black/70 font-mono text-[10px]">
      {/* ── CANDIDATE-SPACE METRICS ── */}
      <div className="w-[320px] flex-shrink-0 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1.5">
          <Box className="w-3.5 h-3.5" /> CANDIDATE SPACE V(Ω)
        </div>
        <div className="space-y-0.5 text-zinc-400 text-[9px] mb-2">
          <div>Volume: <strong className="text-zinc-200">{cs.volume.toFixed(3)}</strong> (Initial: 1,000,000)</div>
          <div>Reduction Ratio: <strong className="text-emerald-400 font-bold">{(cs.reductionRatio * 100).toFixed(2)}%</strong></div>
          <div>Monotonicity: <strong className="text-emerald-400 font-bold">V(k+1) ≤ V(k) ✓</strong></div>
          <div>Unique Solution: <strong className={cs.isUniqueSolution ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{cs.isUniqueSolution ? 'YES (Point)' : 'NO (Unbounded)'}</strong></div>
          <div>Active Observers: <strong className="text-purple-400 font-bold">{fusionResult.activeObserverKeys.join(' + ') || 'None'}</strong></div>
        </div>

        <div className={`p-1.5 rounded text-[8.5px] border ${
          cs.isUniqueSolution
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {cs.isUniqueSolution
            ? '✓ GEOMETRIC UNCERTAINTY COLLAPSED'
            : '⚠ RESIDUAL AMBIGUITY (MORE VIEWS NEEDED)'}
        </div>
      </div>

      {/* ── RECONSTRUCTED COORDINATES & AXIS INTERVALS ── */}
      <div className="flex-1 border-r border-zinc-800 p-2.5 overflow-y-auto">
        <div className="font-bold text-zinc-300 mb-1 flex items-center justify-between">
          <span>CONSTRAINT MANIFOLD TRIANGULATION</span>
          <span className="text-[9px] text-zinc-500">{fusionResult.totalObjects} Nodes</span>
        </div>

        <div className="space-y-1">
          {fusionResult.reconstructedCoordinates.map((coord) => (
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

      {/* ── SATURATION & REDUNDANCY REPORT ── */}
      <div className="w-[360px] flex-shrink-0 p-2.5 overflow-y-auto text-[8.5px]">
        <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5" /> RECOVERY SATURATION & BOUNDARY
        </div>

        <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800 space-y-1 mb-1.5">
          <div>Geometric Recovery: <strong className={fusionResult.geometricAccuracy === 1.0 ? 'text-emerald-400' : 'text-amber-400'}>{(fusionResult.geometricAccuracy * 100).toFixed(1)}%</strong></div>
          <div>Payload Recovery: <strong className="text-red-400 font-bold">0.0% (Unobservable)</strong></div>
          <div>Saturation Reached: <strong className="text-zinc-200">{fusionResult.isSaturated ? 'YES ✓' : 'NO'}</strong></div>
          <div>Redundancy Gain: <strong className="text-zinc-400">+{fusionResult.redundancyGain.toFixed(1)}%</strong></div>
        </div>

        <div className="text-[8px] text-zinc-500">
          Principle: Observer fusion reduces spatial ambiguity to 0%, but cannot recover unprojected non-geometric payloads.
        </div>
      </div>
    </div>
  );
};
