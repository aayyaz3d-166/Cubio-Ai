/**
 * CUBiO AI — Phase 25: Self-Optimization Center
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Empirical benchmarking matrix comparing Candidates A, B, C vs Base across accuracy, latency, memory, regressions.
 */

import React, { useState } from 'react';
import { Gauge, Play, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { SelfOptimizationMatrix } from '../types';
import {
  CURRENT_PRODUCTION_BASELINE,
  INITIAL_OPTIMIZATION_CANDIDATES,
  buildOptimizationMatrix,
} from '../state/selfOptimizationEngine';

export interface SelfOptimizationCenterProps {
  readonly initialMatrix?: SelfOptimizationMatrix;
}

export const SelfOptimizationCenter: React.FC<SelfOptimizationCenterProps> = ({
  initialMatrix,
}) => {
  const [matrix, setMatrix] = useState<SelfOptimizationMatrix>(
    initialMatrix ?? buildOptimizationMatrix()
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      // Re-run benchmarking with updated timestamp
      const updated = buildOptimizationMatrix(INITIAL_OPTIMIZATION_CANDIDATES);
      setMatrix(updated);
      setIsRunning(false);
    }, 400);
  };

  const allItems = [matrix.currentBaseline, ...matrix.candidates];

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              SELF-OPTIMIZATION BENCHMARKING CENTER
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Comparative matrix: <span className="text-slate-300">Base</span> vs{' '}
              <span className="text-cyan-400">Candidate A</span>,{' '}
              <span className="text-rose-400">Candidate B (1 reg)</span>,{' '}
              <span className="text-amber-400">Candidate C (Best)</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 font-mono"
        >
          <Play className="w-3.5 h-3.5" />
          {isRunning ? 'Running Benchmarks...' : 'Run Comparative Matrix'}
        </button>
      </div>

      {/* Best Candidate Announcement */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Recommended Candidate:</span>
          <span className="text-amber-300 font-bold">{matrix.bestCandidateId}</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Last benchmarked at {new Date(matrix.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Benchmark Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="pb-3 pl-3">Candidate / Model</th>
              <th className="pb-3">Accuracy</th>
              <th className="pb-3">Latency (ms)</th>
              <th className="pb-3">Memory (MB)</th>
              <th className="pb-3">Regressions</th>
              <th className="pb-3 pr-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {allItems.map((item) => {
              const isBase = item.status === 'BASE';
              const isBest = item.status === 'BEST';
              const isReject = item.status === 'REJECT';

              return (
                <tr
                  key={item.id}
                  className={
                    'hover:bg-slate-800/40 transition-colors ' +
                    (isBest ? 'bg-amber-950/20' : isReject ? 'bg-rose-950/10' : '')
                  }
                >
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2">
                      <span className={'font-bold ' + (isBest ? 'text-amber-300' : isBase ? 'text-slate-200' : 'text-slate-400')}>
                        {item.label}
                      </span>
                      {isBest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-800 text-amber-400 font-bold">
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-emerald-400 font-bold">
                      {item.accuracyPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{item.latencyMs.toFixed(1)} ms</td>
                  <td className="py-3 text-slate-300">{item.memoryMb.toFixed(1)} MB</td>
                  <td className="py-3">
                    {item.regressions === 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 0 Regressions
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> {item.regressions} Regression (REJECT)
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <span
                      className={
                        'px-2 py-0.5 rounded font-bold text-[10px] ' +
                        (isBest
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : isReject
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300')
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};