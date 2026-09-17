/**
 * 3D Memory Studio - Rule Optimizer Panel
 * 
 * Displays candidate representations, actual deterministic byte sizes,
 * exact equality validation results, and winning representation selection.
 * 
 * Research Disclaimer: "SIMULATION — NOT YET SAVED"
 */

import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Scale,
  Binary,
  Layers,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  Code,
  FileCode2,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import {
  CandidateRepresentation,
  PatternOptimizationResult,
  RepresentationType,
  RuleOptimizerReport,
} from '../types/optimizer';
import { PatternType } from '../types/patterns';

interface RuleOptimizerPanelProps {
  report: RuleOptimizerReport;
  selectedResult: PatternOptimizationResult | null;
  onSelectResult: (result: PatternOptimizationResult | null) => void;
  onSelectCandidate?: (candidate: CandidateRepresentation) => void;
  onOpenTestModal?: () => void;
}

export const RuleOptimizerPanel: React.FC<RuleOptimizerPanelProps> = ({
  report,
  selectedResult,
  onSelectResult,
  onSelectCandidate,
  onOpenTestModal,
}) => {
  const [filterWinner, setFilterWinner] = useState<'ALL' | 'RULE_WON' | 'RAW_WON'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(
    selectedResult ? selectedResult.patternId : (report.results[0]?.patternId ?? null)
  );
  const [inspectCandidateId, setInspectCandidateId] = useState<string | null>(null);

  // Filtered patterns list
  const filteredResults = useMemo(() => {
    return report.results.filter((res) => {
      if (filterWinner === 'RULE_WON' && !res.didRuleWinOverRaw) return false;
      if (filterWinner === 'RAW_WON' && res.didRuleWinOverRaw) return false;
      if (filterType !== 'ALL' && res.patternType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = res.patternId.toLowerCase().includes(q);
        const matchTitle = res.patternTitle.toLowerCase().includes(q);
        const matchWinner = res.winnerType.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchWinner) return false;
      }
      return true;
    });
  }, [report.results, filterWinner, filterType, searchQuery]);

  const handleSelectPattern = (res: PatternOptimizationResult) => {
    onSelectResult(res);
    setExpandedPatternId(res.patternId === expandedPatternId ? null : res.patternId);
    if (res.candidates.length > 0) {
      setInspectCandidateId(res.winningCandidate.candidateId);
      if (onSelectCandidate) {
        onSelectCandidate(res.winningCandidate);
      }
    }
  };

  const getRepTypeBadgeColor = (type: RepresentationType) => {
    switch (type) {
      case 'RAW':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'SPATIAL_RUN':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'REPETITION':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'CLUSTER':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'SEQUENCE_PATH':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'REPEATED_SHAPE':
        return 'bg-pink-950/80 text-pink-300 border-pink-800/60';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div id="rule-optimizer-panel" className="flex flex-col h-full bg-[#0E0E10] text-[#E0E0E0] overflow-hidden">
      {/* Top Header & Simulation Disclaimer */}
      <div className="p-4 border-b border-[#222226] bg-[#121215] shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Funnel 1 — Rule Optimizer</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60 tracking-wider animate-pulse">
                  SIMULATION — NOT YET SAVED
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Calculates real serialized byte cost for RAW vs candidate rules to select the minimal storage representation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTestModal && (
              <button
                id="btn-run-optimizer-tests"
                onClick={onOpenTestModal}
                className="px-3 py-1.5 rounded bg-[#1B1B20] hover:bg-[#25252C] border border-[#2D2D35] text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Run 8-Test Suite
              </button>
            )}
          </div>
        </div>

        {/* Global Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <div className="p-2.5 bg-[#0A0A0C] rounded border border-[#1E1E22] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Total Patterns
            </div>
            <div className="text-lg font-bold text-white">
              {report.summary.totalPatternsEvaluated}
            </div>
          </div>

          <div className="p-2.5 bg-[#0A0A0C] rounded border border-[#1E1E22] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Binary className="w-3 h-3 text-amber-400" /> RAW Baseline
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono">
              {report.summary.totalRawBytes} B
            </div>
          </div>

          <div className="p-2.5 bg-[#0A0A0C] rounded border border-[#1E1E22] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Optimized Cost
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono">
              {report.summary.totalOptimizedBytes} B
            </div>
          </div>

          <div className="p-2.5 bg-[#0A0A0C] rounded border border-emerald-950/60 bg-emerald-950/20 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-400" /> Net Savings
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              -{report.summary.totalSavingsBytes} B ({report.summary.overallSavingsPercent}%)
            </div>
          </div>

          <div className="p-2.5 bg-[#0A0A0C] rounded border border-[#1E1E22] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Scale className="w-3 h-3 text-purple-400" /> Rule vs RAW Wins
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-0.5">
              <span className="text-cyan-400">{report.summary.rulesWonCount} Rules</span>
              <span className="text-gray-500">/</span>
              <span className="text-amber-400">{report.summary.rawWonCount} RAW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 border-b border-[#222226] bg-[#101014] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded bg-[#16161A] p-0.5 border border-[#26262B]">
            <button
              id="filter-all"
              onClick={() => setFilterWinner('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterWinner === 'ALL'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({report.results.length})
            </button>
            <button
              id="filter-rule-won"
              onClick={() => setFilterWinner('RULE_WON')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterWinner === 'RULE_WON'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Rule Won ({report.summary.rulesWonCount})
            </button>
            <button
              id="filter-raw-won"
              onClick={() => setFilterWinner('RAW_WON')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterWinner === 'RAW_WON'
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800/60'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              RAW Won ({report.summary.rawWonCount})
            </button>
          </div>

          <select
            id="filter-pattern-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#16161A] border border-[#26262B] text-gray-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Pattern Types</option>
            <option value="SPATIAL_RUN">Spatial Runs</option>
            <option value="REPETITION">Repetitions</option>
            <option value="CLUSTER">Clusters</option>
            <option value="SEQUENCE_PATH">Sequence Paths</option>
            <option value="REPEATED_SHAPE">Repeated Shapes</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-optimizer-patterns"
            type="text"
            placeholder="Search pattern ID, rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 rounded bg-[#16161A] border border-[#26262B] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48"
          />
        </div>
      </div>

      {/* Main Content Area: Patterns List & Candidate Comparison Table */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filteredResults.length === 0 ? (
          <div className="p-8 text-center bg-[#121215] rounded-lg border border-[#222226] text-gray-400 space-y-2">
            <Info className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="font-semibold text-gray-300">No patterns match current filter.</p>
            <p className="text-xs text-gray-500">
              Try changing the filter or inputting more token data in the Memory panel.
            </p>
          </div>
        ) : (
          filteredResults.map((patternRes) => {
            const isExpanded = expandedPatternId === patternRes.patternId;
            const isSelected = selectedResult?.patternId === patternRes.patternId;

            return (
              <div
                key={patternRes.patternId}
                id={`optimizer-card-${patternRes.patternId}`}
                className={`rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[#15151A] border-cyan-600/70 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#121215] border-[#222226] hover:border-[#303038]'
                }`}
              >
                {/* Pattern Header Card */}
                <div
                  onClick={() => handleSelectPattern(patternRes)}
                  className="p-3.5 cursor-pointer flex items-center justify-between flex-wrap gap-2 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-gray-400 hover:text-white">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span className="font-mono font-bold text-xs text-cyan-400">
                      #{patternRes.patternId}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRepTypeBadgeColor(
                        patternRes.patternType as RepresentationType
                      )}`}
                    >
                      {patternRes.patternType}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {patternRes.patternTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Winner Badge */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-400 text-[11px]">Winner:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          patternRes.didRuleWinOverRaw
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}
                      >
                        {patternRes.winnerType}
                      </span>
                    </div>

                    {/* Savings Indicator */}
                    <div className="text-right">
                      {patternRes.didRuleWinOverRaw ? (
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          -{patternRes.netSavingsBytes} B ({patternRes.netSavingsPercent}%)
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-gray-400">
                          RAW Minimal ({patternRes.originalRawBytes} B)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Comparison & Candidate Inspection */}
                {isExpanded && (
                  <div className="border-t border-[#202026] p-4 bg-[#0B0B0E] space-y-4">
                    {/* Candidates Representation Table */}
                    <div className="rounded border border-[#222226] bg-[#101014] overflow-hidden">
                      <div className="p-2.5 bg-[#16161A] border-b border-[#222226] flex items-center justify-between text-xs font-semibold text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-cyan-400" />
                          Candidate Representations Evaluation
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Deterministic Binary Serialization
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#121216] text-[10px] uppercase text-gray-400 border-b border-[#1E1E22]">
                            <tr>
                              <th className="p-2.5">Representation Type</th>
                              <th className="p-2.5">Serialized Bytes</th>
                              <th className="p-2.5">Original (RAW)</th>
                              <th className="p-2.5">Net Savings</th>
                              <th className="p-2.5">Savings %</th>
                              <th className="p-2.5">Exact Validation</th>
                              <th className="p-2.5 text-center">Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1A1E]">
                            {patternRes.candidates.map((cand) => {
                              const isWinner = cand.candidateId === patternRes.winningCandidate.candidateId;
                              const isInspecting = inspectCandidateId === cand.candidateId;

                              return (
                                <tr
                                  key={cand.candidateId}
                                  onClick={() => {
                                    setInspectCandidateId(cand.candidateId);
                                    if (onSelectCandidate) onSelectCandidate(cand);
                                  }}
                                  className={`cursor-pointer transition-colors ${
                                    isInspecting
                                      ? 'bg-cyan-950/30'
                                      : 'hover:bg-[#141418]'
                                  }`}
                                >
                                  <td className="p-2.5 font-medium flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRepTypeBadgeColor(
                                        cand.representationType
                                      )}`}
                                    >
                                      {cand.representationType}
                                    </span>
                                    <span className="text-gray-300">{cand.displayName}</span>
                                  </td>

                                  <td className="p-2.5 font-mono font-bold text-white">
                                    {cand.serializedBytes} B
                                  </td>

                                  <td className="p-2.5 font-mono text-gray-400">
                                    {cand.originalBytes} B
                                  </td>

                                  <td className="p-2.5 font-mono font-semibold">
                                    {cand.savingsBytes > 0 ? (
                                      <span className="text-emerald-400">-{cand.savingsBytes} B</span>
                                    ) : (
                                      <span className="text-gray-500">0 B</span>
                                    )}
                                  </td>

                                  <td className="p-2.5 font-mono font-semibold">
                                    {cand.savingsPercent > 0 ? (
                                      <span className="text-emerald-400">{cand.savingsPercent}%</span>
                                    ) : (
                                      <span className="text-gray-500">0.00%</span>
                                    )}
                                  </td>

                                  <td className="p-2.5">
                                    {cand.validationStatus === 'VALID' ? (
                                      <span className="inline-flex items-center gap-1 text-green-400 text-[11px] font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% VALID
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-bold">
                                        <XCircle className="w-3.5 h-3.5" /> FAIL
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-2.5 text-center">
                                    {isWinner ? (
                                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px] tracking-wider animate-pulse">
                                        ★ WINNER
                                      </span>
                                    ) : (
                                      <span className="text-gray-600 text-[10px]">Candidate</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Selected Candidate Detailed Inspection Drawer */}
                    {(() => {
                      const inspectingCandidate =
                        patternRes.candidates.find((c) => c.candidateId === inspectCandidateId) ||
                        patternRes.winningCandidate;

                      return (
                        <div className="p-3.5 bg-[#121216] rounded-lg border border-[#222228] space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-[#202026] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4 text-cyan-400" />
                              <span className="font-bold text-white">
                                Binary Payload & Framing Inspector:
                              </span>
                              <span className="font-mono text-cyan-300 font-semibold">
                                {inspectingCandidate.displayName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-mono">
                              <span className="text-gray-400">
                                Header: <strong className="text-white">{inspectingCandidate.headerBytes} B</strong>
                              </span>
                              <span className="text-gray-400">
                                Payload: <strong className="text-white">{inspectingCandidate.payloadBytes} B</strong>
                              </span>
                              <span className="text-gray-400">
                                Total: <strong className="text-cyan-400">{inspectingCandidate.serializedBytes} B</strong>
                              </span>
                            </div>
                          </div>

                          {/* Rule Syntax & Hex Dump */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                                <span>Rule Syntax Definition</span>
                                <span className="text-purple-400">Deterministic Assembly</span>
                              </div>
                              <div className="p-2.5 bg-[#09090B] rounded border border-[#1E1E24] font-mono text-xs text-purple-300 break-all select-all">
                                {inspectingCandidate.ruleSyntax}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                                <span>Serialized Hex Buffer</span>
                                <span className="text-cyan-400 font-mono">
                                  {inspectingCandidate.serializedBytes} Bytes
                                </span>
                              </div>
                              <div className="p-2.5 bg-[#09090B] rounded border border-[#1E1E24] font-mono text-xs text-cyan-300 break-all select-all">
                                {inspectingCandidate.hexDump}
                              </div>
                            </div>
                          </div>

                          {/* Field by Field Framing Breakdown */}
                          {inspectingCandidate.fieldBreakdown.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                Canonical Framing Byte Offset Breakdown
                              </div>
                              <div className="divide-y divide-[#1A1A20] bg-[#09090B] rounded border border-[#1E1E24] overflow-hidden text-[11px]">
                                {inspectingCandidate.fieldBreakdown.map((f, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="p-2 flex items-center justify-between flex-wrap gap-2 hover:bg-[#101014]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-gray-500 text-[10px]">
                                        [0x{f.byteOffset.toString(16).padStart(2, '0').toUpperCase()}..0x
                                        {(f.byteOffset + f.byteLength - 1).toString(16).padStart(2, '0').toUpperCase()}]
                                      </span>
                                      <span className="font-semibold text-gray-300">{f.fieldName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-400">{f.valueDescription}</span>
                                      <span className="font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-900/50 text-[10px]">
                                        {f.byteLength} B
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reversible Expansion Verification Log */}
                          <div className="p-2.5 bg-[#0A0A0C] rounded border border-[#1E1E22] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-400" />
                              <span className="text-gray-300">
                                Exact Expansion Test:{' '}
                                <strong className="text-green-400">
                                  {inspectingCandidate.reconstructedCellIds.length} /{' '}
                                  {inspectingCandidate.originalCellIds.length} Cells Reconstructed
                                </strong>
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-gray-400">
                              Verification Duration: {inspectingCandidate.validationDurationMs}ms
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
