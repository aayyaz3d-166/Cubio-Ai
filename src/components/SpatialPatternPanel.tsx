/**
 * Spatial Pattern Discovery Panel
 * 
 * Two-Funnel Research UI:
 * Funnel 1: Detected Spatial Patterns (Runs, Repetitions, Clusters, Sequence Paths, Shapes)
 * Funnel 2: Compact Rule Generation, Deterministic Verification, & Theoretical Storage Savings Estimation
 * 
 * Includes interactive filtering, sorting, candidate inspection, and live 3D viewport binding.
 */

import React, { useState, useMemo } from 'react';
import {
  PatternRule,
  PatternType,
  SpatialPatternCandidate,
  SpatialPatternDiscoveryReport,
} from '../types/patterns';
import { MemoryGrid3D, RootMemory } from '../types/memory';
import { generateSpatialPatternReport } from '../core/patternRules';
import {
  Search,
  Sparkles,
  Zap,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Box,
  Repeat,
  Compass,
  Shapes,
  Info,
  ShieldCheck,
  Cpu,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface SpatialPatternPanelProps {
  grid: MemoryGrid3D;
  rootMemory?: RootMemory | null;
  selectedPattern: PatternRule | null;
  onSelectPattern: (rule: PatternRule | null) => void;
  onSelectCell?: (cellId: number | null) => void;
}

export const SpatialPatternPanel: React.FC<SpatialPatternPanelProps> = ({
  grid,
  rootMemory,
  selectedPattern,
  onSelectPattern,
  onSelectCell,
}) => {
  // Generate real-time Spatial Pattern Discovery Report
  const report: SpatialPatternDiscoveryReport = useMemo(() => {
    return generateSpatialPatternReport(rootMemory || grid);
  }, [grid, rootMemory]);

  // Filtering & Sorting State
  const [filterType, setFilterType] = useState<PatternType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE' | 'SAVINGS' | 'SIZE' | 'TYPE'>('SCORE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyValid, setOnlyValid] = useState<boolean>(false);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    let list = report.rules;

    if (filterType !== 'ALL') {
      list = list.filter((r) => r.patternType === filterType);
    }

    if (onlyValid) {
      list = list.filter((r) => r.isValid);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ruleSyntax.toLowerCase().includes(q) ||
          r.patternType.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'SCORE') return b.score - a.score;
      if (sortBy === 'SAVINGS') return b.estimatedSavingsPercent - a.estimatedSavingsPercent;
      if (sortBy === 'SIZE') return b.currentRecords - a.currentRecords;
      if (sortBy === 'TYPE') return a.patternType.localeCompare(b.patternType);
      return 0;
    });
  }, [report.rules, filterType, onlyValid, searchQuery, sortBy]);

  const getPatternTypeIcon = (type: PatternType) => {
    switch (type) {
      case 'SPATIAL_RUN':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'REPETITION':
        return <Repeat className="w-3.5 h-3.5 text-purple-400" />;
      case 'CLUSTER':
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case 'SEQUENCE_PATH':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'REPEATED_SHAPE':
        return <Shapes className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getPatternTypeBadge = (type: PatternType) => {
    switch (type) {
      case 'SPATIAL_RUN':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'REPETITION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'CLUSTER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'SEQUENCE_PATH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REPEATED_SHAPE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] text-[#E0E0E0] font-mono text-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-3 bg-[#141416] border-b border-[#2D2D2F] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Spatial Pattern Discovery Engine
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ESTIMATED — NOT YET APPLIED
          </span>
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
          Two-Funnel spatial intelligence: Discovers multi-dimensional geometries, synthesizes compact candidate rules, and deterministically validates 100% reversible cell reconstruction.
        </p>

        {/* Global Discovery Metrics Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
            <span className="text-[10px] text-gray-500 block">Patterns Found</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-cyan-400">
                {report.summary.totalPatternsFound}
              </span>
              <span className="text-[10px] text-gray-400">
                ({report.summary.validRulesCount} valid)
              </span>
            </div>
          </div>

          <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
            <span className="text-[10px] text-gray-500 block">Active Cell Coverage</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-purple-400">
                {report.summary.ruleCoveragePercent}%
              </span>
              <span className="text-[10px] text-gray-400">
                ({report.summary.activeCellsCoveredByRules}/{report.summary.activeCellsCount})
              </span>
            </div>
          </div>

          <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
            <span className="text-[10px] text-gray-500 block">Estimated Savings</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {report.summary.estimatedSavingsPercent}%
              </span>
              <span className="text-[10px] text-gray-400">theory</span>
            </div>
          </div>

          <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
            <span className="text-[10px] text-gray-500 block">Top Quality Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-amber-400">
                {report.summary.topScore}
              </span>
              <span className="text-[10px] text-gray-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Pattern Category Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
          <div className="flex items-center gap-1 bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F]">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-gray-400">Runs:</span>
            <span className="font-bold text-cyan-300">{report.summary.spatialRunsCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F]">
            <Repeat className="w-3 h-3 text-purple-400" />
            <span className="text-gray-400">Repetitions:</span>
            <span className="font-bold text-purple-300">{report.summary.repetitionsCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F]">
            <Box className="w-3 h-3 text-amber-400" />
            <span className="text-gray-400">Clusters:</span>
            <span className="font-bold text-amber-300">{report.summary.clustersCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F]">
            <Compass className="w-3 h-3 text-emerald-400" />
            <span className="text-gray-400">Paths:</span>
            <span className="font-bold text-emerald-300">{report.summary.sequencePathsCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F]">
            <Shapes className="w-3 h-3 text-rose-400" />
            <span className="text-gray-400">Shapes:</span>
            <span className="font-bold text-rose-300">{report.summary.repeatedShapesCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="p-2.5 bg-[#0D0D0E] border-b border-[#2D2D2F] flex flex-wrap items-center justify-between gap-2">
        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          {(['ALL', 'SPATIAL_RUN', 'REPETITION', 'CLUSTER', 'SEQUENCE_PATH', 'REPEATED_SHAPE'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2 py-1 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-[#141416] text-gray-400 hover:text-white border-[#2D2D2F]'
                }`}
              >
                {cat === 'ALL'
                  ? 'All'
                  : cat === 'SPATIAL_RUN'
                  ? 'Runs'
                  : cat === 'REPETITION'
                  ? 'Repetitions'
                  : cat === 'CLUSTER'
                  ? 'Clusters'
                  : cat === 'SEQUENCE_PATH'
                  ? 'Paths'
                  : 'Shapes'}
              </button>
            )
          )}
        </div>

        {/* Sort & Search */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1 bg-[#141416] px-2 py-1 rounded border border-[#2D2D2F]">
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-gray-300 focus:outline-hidden cursor-pointer"
            >
              <option value="SCORE" className="bg-[#141416]">Highest Score</option>
              <option value="SAVINGS" className="bg-[#141416]">Highest Savings</option>
              <option value="SIZE" className="bg-[#141416]">Largest Pattern</option>
              <option value="TYPE" className="bg-[#141416]">Pattern Type</option>
            </select>
          </div>

          <label className="flex items-center gap-1 text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyValid}
              onChange={(e) => setOnlyValid(e.target.checked)}
              className="rounded bg-[#141416] border-[#2D2D2F] text-cyan-500 focus:ring-0"
            />
            <span>Valid Only</span>
          </label>
        </div>
      </div>

      {/* Candidate Pattern List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#2D2D2F] text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-50" />
            <p className="font-semibold text-gray-400 text-xs">No matching spatial patterns found</p>
            <p className="text-[11px] text-gray-600 mt-1 font-sans">
              Try adjusting your filter criteria or encoding longer repetitive sequences into the 3D memory grid.
            </p>
          </div>
        ) : (
          filteredCandidates.map((rule, idx) => {
            const isSelected = selectedPattern?.ruleId === rule.ruleId;
            const originalCells = rule.validationDetails.originalCellIds;

            return (
              <div
                key={rule.ruleId}
                onClick={() => {
                  onSelectPattern(isSelected ? null : rule);
                  if (originalCells.length > 0 && onSelectCell) {
                    onSelectCell(originalCells[0]);
                  }
                }}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1A1E] border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#0E0E10] border-[#2D2D2F] hover:border-[#3D3D3F] hover:bg-[#141416]'
                }`}
              >
                {/* Candidate Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${getPatternTypeBadge(
                        rule.patternType
                      )}`}
                    >
                      {getPatternTypeIcon(rule.patternType)}
                      {rule.patternType.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-xs text-white truncate max-w-[220px]">
                      {rule.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Validation Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                        rule.isValid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {rule.isValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          PASS
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" />
                          FAIL
                        </>
                      )}
                    </span>

                    {/* Pattern Score Badge */}
                    <div className="bg-[#1C1C1E] px-2 py-0.5 rounded border border-[#2D2D2F] text-[10px]">
                      <span className="text-gray-500">Score:</span>{' '}
                      <span className="font-bold text-amber-400">{rule.score}</span>
                      <span className="text-gray-600">/100</span>
                    </div>
                  </div>
                </div>

                {/* Trajectory / Cells Sequence */}
                <div className="mt-2 p-2 bg-[#0A0A0B] rounded border border-[#232326] text-[11px]">
                  <div className="flex items-center justify-between text-gray-500 text-[10px] mb-1">
                    <span>Cells Trajectory ({originalCells.length} cells):</span>
                    <span>Block {rule.parameters.blockId ?? 0}</span>
                  </div>
                  <div className="text-cyan-300 font-mono flex items-center flex-wrap gap-1">
                    {originalCells.slice(0, 10).map((cellId, cIdx) => (
                      <span key={cIdx} className="flex items-center gap-1">
                        <span className="bg-[#17171A] px-1.5 py-0.5 rounded text-[10px] text-gray-300 border border-[#2D2D2F]">
                          {cellId}
                        </span>
                        {cIdx < Math.min(originalCells.length - 1, 9) && (
                          <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                        )}
                      </span>
                    ))}
                    {originalCells.length > 10 && (
                      <span className="text-gray-500 text-[10px]">
                        +{originalCells.length - 10} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidate Rule Syntax */}
                <div className="mt-2 p-2 bg-[#121215] rounded border border-[#2D2D2F] text-[11px]">
                  <span className="text-[10px] text-gray-500 block mb-0.5">Proposed Compact Rule:</span>
                  <code className="text-purple-300 font-bold block">{rule.ruleSyntax}</code>
                </div>

                {/* Storage Reduction & Deterministic Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-2 pt-1 border-t border-[#1F1F22] text-[10px]">
                  <div>
                    <span className="text-gray-500 block">Current Records:</span>
                    <span className="text-gray-300 font-bold">
                      {rule.currentRecords} records ({rule.estimatedBytesBefore} B)
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Rule Records:</span>
                    <span className="text-cyan-400 font-bold">
                      {rule.estimatedRecords} record ({rule.estimatedBytesAfter} B)
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Potential Saving:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {rule.estimatedSavingsPercent}%
                    </span>
                  </div>
                </div>

                {/* Expanded Inspection Details if Selected */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-[#2D2D2F] bg-[#141417] p-2.5 rounded text-[10px] space-y-2">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="font-bold text-white flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Reversibility Verification Details
                      </span>
                      <span className="text-gray-500">
                        {rule.validationDetails.validationDurationMs} ms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
                        <span className="text-gray-500 block text-[9px]">Original Cell IDs:</span>
                        <span className="text-gray-300">
                          {rule.validationDetails.originalCellIds.join(', ')}
                        </span>
                      </div>
                      <div className="bg-[#0A0A0B] p-2 rounded border border-[#2D2D2F]">
                        <span className="text-gray-500 block text-[9px]">Reconstructed Cell IDs:</span>
                        <span className="text-cyan-300">
                          {rule.validationDetails.reconstructedCellIds.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Score Breakdown Bar */}
                    <div>
                      <span className="text-gray-400 font-bold block mb-1">
                        Pattern Quality Score Breakdown ({rule.score}/100):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[9px] text-center">
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Repetition</span>
                          <span className="text-purple-300 font-bold">
                            {rule.scoreBreakdown.repetition}/20
                          </span>
                        </div>
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Continuity</span>
                          <span className="text-cyan-300 font-bold">
                            {rule.scoreBreakdown.spatialContinuity}/20
                          </span>
                        </div>
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Density</span>
                          <span className="text-amber-300 font-bold">
                            {rule.scoreBreakdown.density}/15
                          </span>
                        </div>
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Simplicity</span>
                          <span className="text-emerald-300 font-bold">
                            {rule.scoreBreakdown.ruleSimplicity}/15
                          </span>
                        </div>
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Savings</span>
                          <span className="text-emerald-400 font-bold">
                            {rule.scoreBreakdown.estimatedSavings}/20
                          </span>
                        </div>
                        <div className="bg-[#0A0A0B] p-1 rounded border border-[#2D2D2F]">
                          <span className="text-gray-500 block">Confidence</span>
                          <span className="text-cyan-400 font-bold">
                            {rule.scoreBreakdown.reconstructionConfidence}/10
                          </span>
                        </div>
                      </div>
                    </div>
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
