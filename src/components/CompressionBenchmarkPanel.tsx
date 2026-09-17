/**
 * 3D Memory Studio - Funnel 4: Compression Proof & Benchmark Panel
 * 
 * Provides interactive scientific visualization of real measured byte compression:
 * - Dataset Breakdown with Exact Byte Measurements
 * - Status Badges (COMPRESSED, NO COMPRESSION, INVALID)
 * - Break-Even Analysis Inspector (RAW Bytes vs Rule Bytes)
 * - Scale & Multi-Block Overhead Analyzers
 * - Regularity Compression Curve
 * - 3D Studio Loader for any benchmark dataset
 * - Full JSON & Markdown Report Exporters
 */

import React, { useState, useMemo } from 'react';
import {
  BenchmarkDatasetResult,
  CompressionBenchmarkSuiteResult,
  RuleBreakEvenAnalysis,
} from '../types/compressionBenchmark';
import {
  runCompressionBenchmarkSuite,
  BENCHMARK_DATASET_GENERATORS,
  generateBenchmarkReport,
} from '../core/compressionBenchmark';
import { RootMemory } from '../types/memory';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BarChart3,
  Box,
  CheckCircle2,
  ChevronRight,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  Layers,
  Percent,
  Play,
  RotateCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

interface CompressionBenchmarkPanelProps {
  onLoadDatasetToStudio?: (rootMemory: RootMemory, datasetName: string) => void;
}

export const CompressionBenchmarkPanel: React.FC<CompressionBenchmarkPanelProps> = ({
  onLoadDatasetToStudio,
}) => {
  const [suiteResult, setSuiteResult] = useState<CompressionBenchmarkSuiteResult | null>(() => {
    return runCompressionBenchmarkSuite();
  });
  const [isRunning, setIsRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'DATASETS' | 'BREAK_EVEN' | 'SCALE' | 'MULTIBLOCK' | 'REGULARITY'>('DATASETS');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('SINGLE_TOKEN_REPETITION');
  const [selectedBreakEvenRule, setSelectedBreakEvenRule] = useState<string>('SPATIAL_RUN');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleRunSuite = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const res = runCompressionBenchmarkSuite();
    setSuiteResult(res);
    setIsRunning(false);
  };

  const handleExportJSON = () => {
    if (!suiteResult) return;
    const blob = new Blob([JSON.stringify(suiteResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3d-memory-compression-benchmark-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    if (!suiteResult) return;
    const reportText = generateBenchmarkReport(suiteResult);
    navigator.clipboard.writeText(reportText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLoadDataset = (datasetId: string) => {
    const generatorDef = BENCHMARK_DATASET_GENERATORS.find((g) => g.id === datasetId);
    if (generatorDef && onLoadDatasetToStudio) {
      const memory = generatorDef.generate();
      onLoadDatasetToStudio(memory, generatorDef.name);
    }
  };

  const selectedDataset = useMemo(() => {
    return suiteResult?.datasetResults.find((d) => d.datasetId === selectedDatasetId) || suiteResult?.datasetResults[0];
  }, [suiteResult, selectedDatasetId]);

  const selectedBreakEvenAnalysis = useMemo(() => {
    return (
      suiteResult?.breakEvenAnalyses.find((b) => b.ruleType === selectedBreakEvenRule) ||
      suiteResult?.breakEvenAnalyses[0]
    );
  }, [suiteResult, selectedBreakEvenRule]);

  if (!suiteResult) return null;
  const { summary } = suiteResult;

  return (
    <div className="space-y-4 p-4 text-gray-200 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0E0E12] border border-[#222226] p-4 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
              FUNNEL 4
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Compression Proof & Benchmark Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Scientifically verifies real serialized storage reduction (<span className="text-emerald-300 font-mono">compactTotalBytes &lt; originalTotalBytes</span>) with mandatory lossless roundtrip parity.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyReport}
            className="px-2.5 py-1.5 rounded bg-[#1C1C22] hover:bg-[#25252E] border border-[#33333D] text-xs font-mono flex items-center gap-1.5 cursor-pointer text-gray-300 transition-colors"
            title="Copy Full Markdown Report"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
            <span>{copySuccess ? 'Copied!' : 'Copy Report'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 rounded bg-[#1C1C22] hover:bg-[#25252E] border border-[#33333D] text-xs font-mono flex items-center gap-1.5 cursor-pointer text-gray-300 transition-colors"
            title="Export Raw Benchmark JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleRunSuite}
            disabled={isRunning}
            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Benchmarking...' : 'Re-run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Datasets & Roundtrip */}
        <div className="bg-[#121216] border border-[#222226] p-3 rounded-lg space-y-1">
          <div className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-between">
            <span>Datasets & Roundtrip</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {summary.passedRoundtripCount} / {summary.totalDatasets}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{summary.compressedDatasetsCount} Compressed</span>
            <span>•</span>
            <span className="text-amber-400">{summary.noCompressionDatasetsCount} Unchanged</span>
          </div>
        </div>

        {/* Overall Storage Reduction */}
        <div className="bg-[#121216] border border-[#222226] p-3 rounded-lg space-y-1">
          <div className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-between">
            <span>Overall Reduction</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {summary.overallReductionPercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-gray-400">
            Ratio: <strong className="text-cyan-300 font-mono">{summary.overallCompressionRatio.toFixed(2)} : 1</strong>
          </div>
        </div>

        {/* Total Bytes Measured */}
        <div className="bg-[#121216] border border-[#222226] p-3 rounded-lg space-y-1">
          <div className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-between">
            <span>Total Real Bytes</span>
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-mono text-white">
            {(summary.totalCompactBytes / 1024).toFixed(1)} <span className="text-xs text-gray-400 font-normal">/ {(summary.totalOriginalBytes / 1024).toFixed(1)} KB</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            Savings: -{(summary.totalSavingsBytes / 1024).toFixed(1)} KB
          </div>
        </div>

        {/* Determinism */}
        <div className="bg-[#121216] border border-[#222226] p-3 rounded-lg space-y-1">
          <div className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-between">
            <span>Determinism Proof</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
            {suiteResult.determinismVerification.passed ? '100% REPRODUCIBLE' : 'DETERMINISM FAILED'}
          </div>
          <div className="text-[10px] text-gray-400 truncate">
            {suiteResult.determinismVerification.details}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#222226] pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSubTab('DATASETS')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'DATASETS'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-[#18181D]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>12 Datasets Breakdown</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BREAK_EVEN')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'BREAK_EVEN'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-[#18181D]'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rule Break-Even Analysis</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SCALE')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'SCALE'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-700 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-[#18181D]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Scale Benchmark (100..500k)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MULTIBLOCK')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'MULTIBLOCK'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-[#18181D]'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Block Overhead</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REGULARITY')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'REGULARITY'
              ? 'bg-pink-950/80 text-pink-300 border border-pink-700 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-[#18181D]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-pink-400" />
          <span>Regularity Curve</span>
        </button>
      </div>

      {/* TAB 1: 12 DATASETS BREAKDOWN */}
      {activeSubTab === 'DATASETS' && (
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#222226] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-[#15151A] border-b border-[#222226] flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-300">SCIENTIFIC BENCHMARK RESULTS (12 DETERMINISTIC DATASETS)</span>
              <span className="text-gray-400">Click a dataset to view details & load into 3D Viewport</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#121216] border-b border-[#222226] text-gray-400">
                    <th className="p-2.5">Dataset</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Original</th>
                    <th className="p-2.5 text-right">Compact</th>
                    <th className="p-2.5 text-right">Reduction</th>
                    <th className="p-2.5 text-right">Ratio</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Roundtrip</th>
                    <th className="p-2.5 text-center">3D Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D22]">
                  {suiteResult.datasetResults.map((d) => {
                    const isSelected = d.datasetId === selectedDatasetId;
                    return (
                      <tr
                        key={d.datasetId}
                        onClick={() => setSelectedDatasetId(d.datasetId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-950/30' : 'hover:bg-[#16161C]'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${d.compressionStatus === 'COMPRESSED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span>{d.datasetName}</span>
                        </td>
                        <td className="p-2.5 text-gray-400 text-[11px]">{d.category}</td>
                        <td className="p-2.5 text-right text-gray-300">{d.originalBytes} B</td>
                        <td className="p-2.5 text-right text-white font-bold">{d.compactBytes} B</td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              d.reductionPercent > 0
                                ? 'text-emerald-400'
                                : d.reductionPercent === 0
                                ? 'text-gray-400'
                                : 'text-amber-400'
                            }
                          >
                            {d.reductionPercent > 0 ? `-${d.reductionPercent.toFixed(1)}%` : `${d.reductionPercent.toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-cyan-300 font-bold">{d.compressionRatio.toFixed(2)} : 1</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.compressionStatus === 'COMPRESSED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : d.compressionStatus === 'NO_COMPRESSION'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                : 'bg-red-950 text-red-300 border border-red-700'
                            }`}
                          >
                            {d.compressionStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 ${
                              d.roundtripStatus === 'PASS'
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {d.roundtripStatus === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {d.roundtripStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadDataset(d.datasetId);
                            }}
                            className="px-2 py-1 bg-[#1C1C22] hover:bg-emerald-600 hover:text-black rounded border border-[#33333D] text-[10px] text-gray-300 font-mono transition-colors flex items-center gap-1 mx-auto"
                            title="Load memory into Studio 3D Canvas"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Dataset Deep Dive Card */}
          {selectedDataset && (
            <div className="bg-[#121216] border border-[#26262C] p-4 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222226] pb-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedDataset.datasetName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C1C22] text-gray-300 font-mono">
                      {selectedDataset.datasetId}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{selectedDataset.description}</div>
                </div>

                <button
                  onClick={() => handleLoadDataset(selectedDataset.datasetId)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded font-mono flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Load Into 3D Viewport</span>
                </button>
              </div>

              {/* Grid Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 bg-[#16161C] rounded border border-[#222226]">
                  <span className="text-gray-500 block text-[10px]">ACTIVE CELLS</span>
                  <span className="text-white font-bold text-sm">{selectedDataset.totalActiveCells} cells</span>
                  <span className="text-gray-400 text-[10px] block">Across {selectedDataset.blockCount} block(s)</span>
                </div>

                <div className="p-2 bg-[#16161C] rounded border border-[#222226]">
                  <span className="text-gray-500 block text-[10px]">RULE COVERAGE</span>
                  <span className="text-emerald-400 font-bold text-sm">{selectedDataset.ruleCoveragePercent.toFixed(1)}%</span>
                  <span className="text-gray-400 text-[10px] block">{selectedDataset.ruleCoveredCells} rule cells</span>
                </div>

                <div className="p-2 bg-[#16161C] rounded border border-[#222226]">
                  <span className="text-gray-500 block text-[10px]">RAW FALLBACK</span>
                  <span className="text-amber-400 font-bold text-sm">{selectedDataset.rawFallbackPercent.toFixed(1)}%</span>
                  <span className="text-gray-400 text-[10px] block">{selectedDataset.rawCoveredCells} raw cells</span>
                </div>

                <div className="p-2 bg-[#16161C] rounded border border-[#222226]">
                  <span className="text-gray-500 block text-[10px]">LATENCY</span>
                  <span className="text-cyan-300 font-bold text-sm">{selectedDataset.totalTimeMs.toFixed(1)} ms</span>
                  <span className="text-gray-400 text-[10px] block">Enc: {selectedDataset.encodingTimeMs}ms | Dec: {selectedDataset.decodingTimeMs}ms</span>
                </div>
              </div>

              {/* Opcode Count Badges */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-1">
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-gray-300">
                  Total Records: <strong className="text-white">{selectedDataset.recordCount}</strong>
                </span>
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-cyan-300">
                  Runs: <strong>{selectedDataset.spatialRunCount}</strong>
                </span>
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-emerald-300">
                  Repetitions: <strong>{selectedDataset.repetitionCount}</strong>
                </span>
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-purple-300">
                  Clusters: <strong>{selectedDataset.clusterCount}</strong>
                </span>
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-pink-300">
                  Shapes: <strong>{selectedDataset.repeatedShapeCount}</strong>
                </span>
                <span className="px-2 py-1 bg-[#1A1A22] rounded border border-[#2D2D36] text-amber-300">
                  RAW Fallbacks: <strong>{selectedDataset.rawRecordCount}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RULE BREAK-EVEN ANALYSIS */}
      {activeSubTab === 'BREAK_EVEN' && (
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#222226] p-4 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222226] pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  Deterministic Rule Break-Even Thresholds
                </h3>
                <p className="text-xs text-gray-400">
                  Calculated from actual serialized byte measurements. Pinpoints the exact pattern length where a rule becomes cheaper than canonical RAW fallback.
                </p>
              </div>

              {/* Rule Selector Buttons */}
              <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto">
                {suiteResult.breakEvenAnalyses.map((ba) => (
                  <button
                    key={ba.ruleType}
                    onClick={() => setSelectedBreakEvenRule(ba.ruleType)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      selectedBreakEvenRule === ba.ruleType
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                        : 'text-gray-400 hover:text-white bg-[#18181E]'
                    }`}
                  >
                    {ba.ruleType}
                  </button>
                ))}
              </div>
            </div>

            {selectedBreakEvenAnalysis && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#16161D] p-3 rounded border border-[#262630]">
                  <div>
                    <span className="text-xs text-gray-400 block font-mono">MEASURED BREAK-EVEN THRESHOLD</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      ≥ {selectedBreakEvenAnalysis.breakEvenUnits} {selectedBreakEvenAnalysis.unitLabel}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-400 font-mono">
                    <span>Below threshold: <strong className="text-amber-400">RAW is cheaper</strong></span>
                    <br />
                    <span>At / above threshold: <strong className="text-emerald-400">Rule compresses</strong></span>
                  </div>
                </div>

                {/* Table of Break-Even Points */}
                <div className="overflow-x-auto border border-[#222226] rounded">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#141418] border-b border-[#222226] text-gray-400">
                        <th className="p-2">Pattern Size ({selectedBreakEvenAnalysis.unitLabel})</th>
                        <th className="p-2 text-right">RAW Equivalent</th>
                        <th className="p-2 text-right">Rule Serialized</th>
                        <th className="p-2 text-right">Net Savings</th>
                        <th className="p-2 text-center">Winning Representation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D1D22]">
                      {selectedBreakEvenAnalysis.points.map((pt) => (
                        <tr
                          key={pt.patternSize}
                          className={pt.isRuleCheaper ? 'bg-emerald-950/20' : 'bg-amber-950/10'}
                        >
                          <td className="p-2 font-bold text-white">
                            {pt.patternSize} {selectedBreakEvenAnalysis.unitLabel}
                          </td>
                          <td className="p-2 text-right text-gray-400">{pt.rawBytes} B</td>
                          <td className="p-2 text-right font-bold text-cyan-300">{pt.ruleBytes} B</td>
                          <td className="p-2 text-right font-bold">
                            <span className={pt.savingsBytes > 0 ? 'text-emerald-400' : 'text-gray-500'}>
                              {pt.savingsBytes > 0 ? `+${pt.savingsBytes} B` : `${pt.savingsBytes} B`}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pt.isRuleCheaper
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}
                            >
                              {pt.isRuleCheaper ? `${selectedBreakEvenAnalysis.ruleType} WINS` : 'RAW FALLBACK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCALE BENCHMARK */}
      {activeSubTab === 'SCALE' && (
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#222226] p-4 rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Scale & Throughput Benchmark (100 to 500,000 Tokens)
              </h3>
              <p className="text-xs text-gray-400">
                Measures storage behavior and compression ratios as input token volumes scale across large multi-block memories.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#222226] rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141418] border-b border-[#222226] text-gray-400">
                    <th className="p-2.5">Dataset Scale</th>
                    <th className="p-2.5 text-right">Blocks</th>
                    <th className="p-2.5 text-right">Original Size</th>
                    <th className="p-2.5 text-right">Compact Size</th>
                    <th className="p-2.5 text-right">Reduction</th>
                    <th className="p-2.5 text-right">Ratio</th>
                    <th className="p-2.5 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D22]">
                  {suiteResult.scaleResults.map((sr) => (
                    <tr key={sr.tokenCount} className="hover:bg-[#16161C]">
                      <td className="p-2.5 font-bold text-white">{sr.label}</td>
                      <td className="p-2.5 text-right text-gray-400">{sr.blockCount} blocks</td>
                      <td className="p-2.5 text-right text-gray-300">{(sr.originalBytes / 1024).toFixed(1)} KB</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold">{(sr.compactBytes / 1024).toFixed(1)} KB</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">-{sr.reductionPercent.toFixed(1)}%</td>
                      <td className="p-2.5 text-right text-cyan-300 font-bold">{sr.compressionRatio.toFixed(2)} : 1</td>
                      <td className="p-2.5 text-right text-gray-400">{sr.encodingTimeMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-BLOCK OVERHEAD */}
      {activeSubTab === 'MULTIBLOCK' && (
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#222226] p-4 rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-400" />
                Multi-Block Framing Overhead (1 to 64 Blocks)
              </h3>
              <p className="text-xs text-gray-400">
                Examines whether 10-byte block table headers begin to dominate binary size as hierarchical depth increases.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#222226] rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141418] border-b border-[#222226] text-gray-400">
                    <th className="p-2.5">Blocks Allocated</th>
                    <th className="p-2.5 text-right">Implicit Capacity</th>
                    <th className="p-2.5 text-right">Block Framing Overhead</th>
                    <th className="p-2.5 text-right">Overhead % of File</th>
                    <th className="p-2.5 text-right">Compact Size</th>
                    <th className="p-2.5 text-right">Reduction %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D22]">
                  {suiteResult.multiBlockResults.map((mb) => (
                    <tr key={mb.blockCount} className="hover:bg-[#16161C]">
                      <td className="p-2.5 font-bold text-white">{mb.blockCount} Block(s)</td>
                      <td className="p-2.5 text-right text-gray-400">{mb.totalCapacity} cells</td>
                      <td className="p-2.5 text-right text-amber-300 font-bold">{mb.blockHeaderOverheadBytes} Bytes</td>
                      <td className="p-2.5 text-right text-gray-300">{mb.blockHeaderOverheadPercent.toFixed(1)}%</td>
                      <td className="p-2.5 text-right text-cyan-300 font-bold">{mb.compactBytes} B</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold">-{mb.reductionPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REGULARITY CURVE */}
      {activeSubTab === 'REGULARITY' && (
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#222226] p-4 rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                Empirical Compression Curve (1% to 100% Pattern Regularity)
              </h3>
              <p className="text-xs text-gray-400">
                Demonstrates how real measured serialized byte reduction scales as spatial regularity increases.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#222226] rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141418] border-b border-[#222226] text-gray-400">
                    <th className="p-2.5">Regularity %</th>
                    <th className="p-2.5">Composition</th>
                    <th className="p-2.5 text-right">Original</th>
                    <th className="p-2.5 text-right">Compact</th>
                    <th className="p-2.5 text-right">Reduction %</th>
                    <th className="p-2.5 text-right">Ratio</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D22]">
                  {suiteResult.regularityCurve.map((rc) => (
                    <tr key={rc.regularityPercent} className="hover:bg-[#16161C]">
                      <td className="p-2.5 font-bold text-white">{rc.regularityPercent}%</td>
                      <td className="p-2.5 text-gray-400 text-[11px]">{rc.description}</td>
                      <td className="p-2.5 text-right text-gray-400">{rc.originalBytes} B</td>
                      <td className="p-2.5 text-right font-bold text-white">{rc.compactBytes} B</td>
                      <td className="p-2.5 text-right font-bold">
                        <span className={rc.reductionPercent > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {rc.reductionPercent > 0 ? `-${rc.reductionPercent.toFixed(1)}%` : `${rc.reductionPercent.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-cyan-300 font-bold">{rc.compressionRatio.toFixed(2)} : 1</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rc.compressionStatus === 'COMPRESSED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {rc.compressionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
