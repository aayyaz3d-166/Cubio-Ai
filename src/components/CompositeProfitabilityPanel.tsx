/**
 * 3D Memory Studio - Funnel 11: Composite Profitability & Selection Panel
 * 
 * Interactive research interface for inspecting exact binary serialized costs,
 * candidate profitability scoring, overlap conflict resolution, and byte savings telemetry.
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Binary,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  Filter,
  Layers,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  XCircle,
  Zap,
} from 'lucide-react';
import { MemoryGrid3D } from '../types';
import { runFunnel11Benchmark } from '../funnel11/core/benchmark';
import { generateFunnel11Report } from '../funnel11/core/report';
import { selectCompositeEntries } from '../funnel11/core/selector';
import { runFunnel11TestSuite } from '../funnel11/test_runner';
import { CompositeCandidateFamily } from '../funnel10/types/candidate';
import { createBenchmarkCandidateFamily } from '../funnel11/core/benchmark';

interface CompositeProfitabilityPanelProps {
  grid: MemoryGrid3D;
  onSelectCandidate?: (signature: string) => void;
}

export const CompositeProfitabilityPanel: React.FC<CompositeProfitabilityPanelProps> = ({
  grid,
  onSelectCandidate,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateSig, setSelectedCandidateSig] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<ReturnType<typeof runFunnel11TestSuite> | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Generate standard benchmark candidate families
  const candidateFamilies = useMemo<CompositeCandidateFamily[]>(() => {
    return [
      // 1. High repetition candidate (6 occurrences, 3 children) -> Profitable
      createBenchmarkCandidateFamily(
        'COMPOSITE{D101@[0,0,0]|D102@[2,0,0]|D103@[0,2,0]}',
        [101, 102, 103],
        [[0, 0, 0], [2, 0, 0], [0, 2, 0]],
        [
          { x: 0, y: 0, z: 0 },
          { x: 4, y: 0, z: 0 },
          { x: 0, y: 4, z: 0 },
          { x: 4, y: 4, z: 0 },
          { x: 0, y: 0, z: 4 },
          { x: 4, y: 0, z: 4 },
        ]
      ),
      // 2. Medium repetition candidate (5 occurrences, 4 children) -> Highly profitable
      createBenchmarkCandidateFamily(
        'COMPOSITE{D201@[0,0,0]|D202@[1,1,0]|D203@[2,0,0]|D204@[1,-1,0]}',
        [201, 202, 203, 204],
        [[0, 0, 0], [1, 1, 0], [2, 0, 0], [1, -1, 0]],
        [
          { x: 0, y: 2, z: 0 },
          { x: 3, y: 2, z: 0 },
          { x: 0, y: 2, z: 3 },
          { x: 3, y: 2, z: 3 },
          { x: 0, y: 5, z: 0 },
        ]
      ),
      // 3. Marginal candidate (2 occurrences, 3 children) -> Barely profitable or break-even
      createBenchmarkCandidateFamily(
        'COMPOSITE{D301@[0,0,0]|D302@[1,1,1]|D303@[2,2,2]}',
        [301, 302, 303],
        [[0, 0, 0], [1, 1, 1], [2, 2, 2]],
        [{ x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 3 }]
      ),
      // 4. Single occurrence candidate (1 occurrence, 2 children) -> Unprofitable
      createBenchmarkCandidateFamily(
        'COMPOSITE{D401@[0,0,0]|D402@[1,0,0]}',
        [401, 402],
        [[0, 0, 0], [1, 0, 0]],
        [{ x: 0, y: 0, z: 0 }]
      ),
      // 5. Cross-block candidate (spans block 0 and block 1) -> Rejected
      createBenchmarkCandidateFamily(
        'COMPOSITE{D501@[0,0,0]|D502@[0,1,0]}',
        [501, 502],
        [[0, 0, 0], [0, 1, 0]],
        [
          { x: 0, y: 0, z: 0, blockId: 0 },
          { x: 2, y: 0, z: 0, blockId: 1 },
        ]
      ),
    ];
  }, []);

  const selectionResult = useMemo(() => {
    return selectCompositeEntries(candidateFamilies);
  }, [candidateFamilies]);

  const report = useMemo(() => {
    return generateFunnel11Report(selectionResult);
  }, [selectionResult]);

  const benchmarkReport = useMemo(() => {
    return runFunnel11Benchmark();
  }, []);

  const filteredCandidates = useMemo(() => {
    return report.candidates.filter((c) => {
      if (filterMode === 'ACCEPTED' && c.status !== 'ACCEPTED') return false;
      if (filterMode === 'REJECTED' && c.status !== 'REJECTED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.candidateId.toLowerCase().includes(q) ||
          c.canonicalSignature.toLowerCase().includes(q) ||
          (c.rejectionReason && c.rejectionReason.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [report.candidates, filterMode, searchQuery]);

  const activeCandidate = useMemo(() => {
    if (!selectedCandidateSig) return report.candidates[0] ?? null;
    return report.candidates.find((c) => c.canonicalSignature === selectedCandidateSig) ?? report.candidates[0] ?? null;
  }, [report.candidates, selectedCandidateSig]);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const res = runFunnel11TestSuite();
      setTestResults(res);
      setIsRunningTests(false);
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-[#0E0E10] text-gray-200 font-mono text-xs overflow-hidden">
      {/* Top Header & Telemetry */}
      <div className="border-b border-[#252528] bg-[#141417] p-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-950/80 border border-emerald-500/70 flex items-center justify-center text-emerald-400 font-bold">
            F11
          </div>
          <div>
            <div className="font-bold text-gray-100 flex items-center gap-2">
              <span>Funnel 11: Composite Profitability & Selection</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                Deterministic Byte Proof
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              Only composites with actual serialized byte savings (totalCompositeCost &lt; expandedChildCost) are accepted.
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-[11px]"
          >
            <Play className="w-3 h-3" />
            <span>{isRunningTests ? 'Running F11 Suite...' : 'Run F11 Tests (10/10)'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-[#111114] border-b border-[#252528] shrink-0">
        <div className="p-2 rounded bg-[#18181C] border border-[#2A2A30]">
          <div className="text-[10px] text-gray-400 uppercase">Analyzed Families</div>
          <div className="text-base font-bold text-gray-100 mt-0.5">{report.summary.totalCandidateFamilies}</div>
          <div className="text-[10px] text-gray-500">From Funnel 10 discovery</div>
        </div>

        <div className="p-2 rounded bg-[#18181C] border border-[#2A2A30]">
          <div className="text-[10px] text-emerald-400 uppercase">Accepted (Profitable)</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">{report.summary.profitableCandidateCount}</div>
          <div className="text-[10px] text-emerald-500/80">{report.summary.totalAcceptedOccurrences} occurrences</div>
        </div>

        <div className="p-2 rounded bg-[#18181C] border border-[#2A2A30]">
          <div className="text-[10px] text-rose-400 uppercase">Rejected (Deficit)</div>
          <div className="text-base font-bold text-rose-400 mt-0.5">{report.summary.rejectedCandidateCount}</div>
          <div className="text-[10px] text-rose-500/80">0% byte waste</div>
        </div>

        <div className="p-2 rounded bg-[#18181C] border border-[#2A2A30]">
          <div className="text-[10px] text-cyan-400 uppercase">Expanded Child Cost</div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">{report.summary.totalExpandedBytes} B</div>
          <div className="text-[10px] text-gray-500">Level 2 Dict refs</div>
        </div>

        <div className="p-2 rounded bg-[#18181C] border border-[#2A2A30]">
          <div className="text-[10px] text-purple-400 uppercase">Selected Comp. Cost</div>
          <div className="text-base font-bold text-purple-400 mt-0.5">{report.summary.totalSelectedBytes} B</div>
          <div className="text-[10px] text-gray-500">Def + occurrence refs</div>
        </div>

        <div className="p-2 rounded bg-[#18181C] border border-emerald-500/40 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-300 uppercase font-bold">Net Byte Savings</div>
          <div className="text-base font-bold text-emerald-300 mt-0.5">+{report.summary.netSavingsBytes} B</div>
          <div className="text-[10px] text-emerald-400/90">{report.summary.overallReductionPercent}% reduction</div>
        </div>
      </div>

      {/* Main Content Split: Left Candidate List, Right Diagnostic Details */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Candidate List */}
        <div className="w-full md:w-1/2 border-r border-[#252528] flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="p-2.5 bg-[#141417] border-b border-[#252528] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  filterMode === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                All ({report.candidates.length})
              </button>
              <button
                onClick={() => setFilterMode('ACCEPTED')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  filterMode === 'ACCEPTED' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50' : 'text-emerald-400/70 hover:text-emerald-300'
                }`}
              >
                Accepted ({report.summary.profitableCandidateCount})
              </button>
              <button
                onClick={() => setFilterMode('REJECTED')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  filterMode === 'REJECTED' ? 'bg-rose-900/80 text-rose-200 border border-rose-500/50' : 'text-rose-400/70 hover:text-rose-300'
                }`}
              >
                Rejected ({report.summary.rejectedCandidateCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search signatures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0E0E10] border border-[#2A2A30] rounded px-2 py-0.5 text-[11px] text-gray-200 focus:outline-hidden focus:border-cyan-500 w-36"
            />
          </div>

          {/* Candidate Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {filteredCandidates.length === 0 ? (
              <div className="p-4 text-center text-gray-500 italic">No candidates match current filter.</div>
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = activeCandidate?.canonicalSignature === cand.canonicalSignature;
                const isAcc = cand.status === 'ACCEPTED';
                return (
                  <div
                    key={cand.candidateId}
                    onClick={() => {
                      setSelectedCandidateSig(cand.canonicalSignature);
                      onSelectCandidate?.(cand.canonicalSignature);
                    }}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? isAcc
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-xs'
                          : 'bg-rose-950/40 border-rose-500 shadow-xs'
                        : isAcc
                        ? 'bg-[#141417] border-[#252528] hover:border-emerald-500/50'
                        : 'bg-[#141417] border-[#252528] hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                          isAcc ? 'bg-emerald-900/80 text-emerald-200' : 'bg-rose-900/80 text-rose-200'
                        }`}>
                          {cand.candidateId}
                        </span>
                        <span className="font-bold text-gray-200 truncate max-w-[200px]">
                          {cand.canonicalSignature}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        {isAcc ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />
                            +{cand.actualSavings} B ({cand.reductionPercent}%)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            {cand.actualSavings} B
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sub-row telemetry */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 border-t border-[#222226] pt-1">
                      <span>Occurrences: <strong className="text-gray-300">{cand.occurrenceCount}</strong></span>
                      <span>Expanded: <strong className="text-cyan-400">{cand.expandedChildCost}B</strong></span>
                      <span>Total Comp: <strong className="text-purple-400">{cand.totalCompositeCost}B</strong></span>
                      <span>Status: <strong className={isAcc ? 'text-emerald-400' : 'text-rose-400'}>{cand.status}</strong></span>
                    </div>

                    {!isAcc && cand.rejectionReason && (
                      <div className="mt-1 text-[10px] text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        <span>Reason: <strong>{cand.rejectionReason}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Candidate Inspector & Diagnostic Panel */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#0E0E10]">
          {activeCandidate ? (
            <>
              {/* Candidate Detail Card */}
              <div className={`p-3 rounded border ${
                activeCandidate.status === 'ACCEPTED'
                  ? 'bg-emerald-950/20 border-emerald-500/60'
                  : 'bg-rose-950/20 border-rose-500/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-100">{activeCandidate.candidateId}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      activeCandidate.status === 'ACCEPTED'
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-500'
                        : 'bg-rose-900 text-rose-200 border border-rose-500'
                    }`}>
                      {activeCandidate.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Blocks: <strong>{activeCandidate.blockIds.join(', ')}</strong>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded bg-[#0A0A0C] border border-[#222226] font-mono text-[11px] text-cyan-300 break-all">
                  {activeCandidate.canonicalSignature}
                </div>

                {/* Byte Breakdown Matrix */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-[#141417] border border-[#252528]">
                    <div className="text-[10px] text-gray-400">Definition Bytes (Header + Records)</div>
                    <div className="text-sm font-bold text-purple-300">{activeCandidate.compositeDefinitionCost} B</div>
                    <div className="text-[10px] text-gray-500">Stored once in composite table</div>
                  </div>

                  <div className="p-2 rounded bg-[#141417] border border-[#252528]">
                    <div className="text-[10px] text-gray-400">Reference Bytes ({activeCandidate.occurrenceCount} occ)</div>
                    <div className="text-sm font-bold text-purple-300">{activeCandidate.referenceCost} B</div>
                    <div className="text-[10px] text-gray-500">12B per occurrence reference</div>
                  </div>

                  <div className="p-2 rounded bg-[#141417] border border-[#252528]">
                    <div className="text-[10px] text-cyan-400 font-bold">Expanded Child Cost</div>
                    <div className="text-sm font-bold text-cyan-300">{activeCandidate.expandedChildCost} B</div>
                    <div className="text-[10px] text-gray-500">Without Level 3 composition</div>
                  </div>

                  <div className={`p-2 rounded border ${
                    activeCandidate.status === 'ACCEPTED'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}>
                    <div className="text-[10px] font-bold uppercase">Net Actual Savings</div>
                    <div className="text-sm font-bold">
                      {activeCandidate.actualSavings > 0 ? `+${activeCandidate.actualSavings} B` : `${activeCandidate.actualSavings} B`}
                    </div>
                    <div className="text-[10px]">
                      {activeCandidate.reductionPercent}% reduction ({activeCandidate.compressionRatio}x ratio)
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Dataset Benchmark Table */}
              <div className="p-3 rounded bg-[#141417] border border-[#252528]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Funnel 11 Multi-Dataset Benchmark</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Agg Savings vs F5: <strong className="text-emerald-400">+{benchmarkReport.aggregateSavingsVsFunnel5Bytes}B ({benchmarkReport.aggregateSavingsVsFunnel5Percent}%)</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#252528] text-gray-400 text-left">
                        <th className="py-1 px-1">Dataset</th>
                        <th className="py-1 px-1">Original</th>
                        <th className="py-1 px-1">F5 Base</th>
                        <th className="py-1 px-1">F11 Bytes</th>
                        <th className="py-1 px-1">Savings vs F5</th>
                        <th className="py-1 px-1">Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D1D22]">
                      {benchmarkReport.datasets.map((d) => (
                        <tr key={d.datasetName} className="hover:bg-[#1A1A20]">
                          <td className="py-1 px-1 font-bold text-gray-300">{d.datasetName}</td>
                          <td className="py-1 px-1 text-gray-400">{d.originalBytes}B</td>
                          <td className="py-1 px-1 text-cyan-400">{d.funnel5Bytes}B</td>
                          <td className="py-1 px-1 text-purple-400 font-bold">{d.funnel11SelectedBytes}B</td>
                          <td className="py-1 px-1">
                            {d.additionalSavingsVsFunnel5Bytes > 0 ? (
                              <span className="text-emerald-400 font-bold">+{d.additionalSavingsVsFunnel5Bytes}B ({d.additionalSavingsVsFunnel5Percent}%)</span>
                            ) : (
                              <span className="text-gray-500">0B (0.0%)</span>
                            )}
                          </td>
                          <td className="py-1 px-1 font-bold text-gray-300">{d.compressionRatioVsOriginal}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Test Suite Telemetry if Run */}
              {testResults && (
                <div className="p-3 rounded bg-[#141417] border border-emerald-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Funnel 11 Verification Results</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-500/60">
                      {testResults.passedTests}/{testResults.totalTests} PASSED
                    </span>
                  </div>

                  <div className="space-y-1">
                    {testResults.results.map((t) => (
                      <div key={t.testId} className="flex items-start gap-1.5 text-[10px] p-1 rounded bg-[#0E0E10] border border-[#202026]">
                        {t.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold text-gray-200">[{t.testId}] {t.name}: </span>
                          <span className="text-gray-400">{t.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">Select a candidate to view cost and byte metrics.</div>
          )}
        </div>
      </div>
    </div>
  );
};
