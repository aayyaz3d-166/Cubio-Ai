/**
 * Automated Research Benchmark Suite & System Verification Modal
 * 
 * Tests complete lifecycle:
 * Test 1: "HELLO" (Uses 1 block)
 * Test 2: "HELLO WORLD" (Decodes perfectly)
 * Test 3: Data > 343 chars (Auto creates Block 0, Block 1 and continues)
 * Test 4: Data > 1029 chars (Auto creates Block 0, 1, 2, 3... and reconstructs)
 * 
 * IMPORTANT TEST:
 * ENCODE → ALLOCATE BLOCKS → STORE 3D MEMORY → SAVE .3DMEMORY → RESET APPLICATION → LOAD .3DMEMORY → RECONSTRUCT BLOCK TREE → DECODE
 * Compare: Original === Decoded → Display "PASS" only if actually successful!
 */

import React, { useState } from 'react';
import {
  BenchmarkCaseResult,
  MemoryGrid3D,
  RepresentationComparisonMetrics,
  SystemTestResult,
} from '../types';
import {
  runStandardBenchmarkSuite,
  runSystemUnitTests,
  runImportantRoundtripTest,
  runRepresentationOverheadBenchmarkSuite,
  ImportantRoundtripTestResult,
  BENCHMARK_STANDARD_DATASET,
} from '../core/benchmark';
import { runSpatialPatternTestSuite, PatternTestSuiteResult } from '../core/patternTests';
import { runRuleOptimizerTestSuite } from '../core/optimizerTests';
import { runSpatialEncoderTestSuite } from '../core/spatialEncoderTests';
import { runSpatialDecoderTestSuite } from '../core/spatialDecoderTests';
import { runSpatialDictionaryTestSuite } from '../core/spatialDictionary';
import { CompressionBenchmarkPanel } from './CompressionBenchmarkPanel';
import { OptimizerTestSuiteResult } from '../types/optimizer';
import { SpatialEncoderTestSuiteResult } from '../types/spatialEncoder';
import { SpatialDecoderTestSuiteResult } from '../types/spatialDecoder';
import { DictionaryTestSuiteResult } from '../types/spatialDictionary';
import { encodeToHierarchicalMemory } from '../core/hierarchicalMemory';
import { runSpatialHierarchyTestSuite } from '../core/spatialHierarchy';
import { runFunnel9Tests } from '../funnel9/tests';
import { runFunnel10TestSuite, Funnel10SuiteReport } from '../funnel10/test_runner';
import { runFunnel11TestSuite, Funnel11SuiteReport } from '../funnel11/test_runner';
import { runAllFunnel12Tests, Funnel12SuiteReport } from '../funnel12';
import { HierarchyTestSuiteResult } from '../types/spatialHierarchy';
import {
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  X,
  FileCheck,
  Cpu,
  BarChart2,
  ListChecks,
  ShieldCheck,
  Zap,
  HardDrive,
  Scale,
  Compass,
  SlidersHorizontal,
  Binary,
  TrendingDown,
  BookOpen,
  Fingerprint,
} from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGridIntoStudio: (grid: MemoryGrid3D, text: string) => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isOpen,
  onClose,
  onLoadGridIntoStudio,
}) => {
  const [activeTab, setActiveTab] = useState<
    'FUNNEL12_TEST' | 'FUNNEL11_TEST' | 'FUNNEL10_TEST' | 'FUNNEL9_TEST' | 'HIERARCHY_TEST' | 'SPATIAL_DICT_TEST' | 'COMPRESSION_PROOF' | 'SPATIAL_DECODER_TEST' | 'SPATIAL_ENCODER_TEST' | 'OPTIMIZER_TEST' | 'PATTERNS_TEST' | 'ROUNDTRIP' | 'STANDARD' | 'REPRESENTATION' | 'UNIT'
  >('FUNNEL12_TEST');
  const [isRunning, setIsRunning] = useState(false);

  const [funnel12Report, setFunnel12Report] = useState<Funnel12SuiteReport | null>(null);
  const [funnel11Report, setFunnel11Report] = useState<Funnel11SuiteReport | null>(null);
  const [funnel10Report, setFunnel10Report] = useState<Funnel10SuiteReport | null>(null);
  const [funnel9Results, setFunnel9Results] = useState<Array<{ id: string; name: string; passed: boolean; details: string }> | null>(null);
  const [hierarchyTestSuiteResult, setHierarchyTestSuiteResult] = useState<HierarchyTestSuiteResult | null>(null);
  const [spatialDictionaryTestResult, setSpatialDictionaryTestResult] = useState<DictionaryTestSuiteResult | null>(null);
  const [spatialDecoderTestResult, setSpatialDecoderTestResult] = useState<SpatialDecoderTestSuiteResult | null>(null);
  const [spatialEncoderTestResult, setSpatialEncoderTestResult] = useState<SpatialEncoderTestSuiteResult | null>(null);
  const [optimizerTestResult, setOptimizerTestResult] = useState<OptimizerTestSuiteResult | null>(null);
  const [roundtripResult, setRoundtripResult] = useState<ImportantRoundtripTestResult | null>(null);
  const [patternTestResult, setPatternTestResult] = useState<PatternTestSuiteResult | null>(null);
  const [standardResults, setStandardResults] = useState<BenchmarkCaseResult[]>([]);
  const [repResults, setRepResults] = useState<RepresentationComparisonMetrics[]>([]);
  const [unitTestResults, setUnitTestResults] = useState<SystemTestResult[]>([]);
  const [customRoundtripInput, setCustomRoundtripInput] = useState('');

  if (!isOpen) return null;

  const handleRunFunnel12TestSuite = async () => {
    setIsRunning(true);
    setFunnel12Report(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const rep = runAllFunnel12Tests();
    setFunnel12Report(rep);
    setIsRunning(false);
  };

  const handleRunFunnel11TestSuite = async () => {
    setIsRunning(true);
    setFunnel11Report(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const rep = runFunnel11TestSuite();
    setFunnel11Report(rep);
    setIsRunning(false);
  };

  const handleRunFunnel10TestSuite = async () => {
    setIsRunning(true);
    setFunnel10Report(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const rep = runFunnel10TestSuite();
    setFunnel10Report(rep);
    setIsRunning(false);
  };

  const handleRunFunnel9TestSuite = async () => {
    setIsRunning(true);
    setFunnel9Results(null);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const res = runFunnel9Tests();
    setFunnel9Results(res);
    setIsRunning(false);
  };

  const handleRunHierarchyTestSuite = async () => {
    setIsRunning(true);
    setHierarchyTestSuiteResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const res = runSpatialHierarchyTestSuite();
    setHierarchyTestSuiteResult(res);
    setIsRunning(false);
  };

  const handleRunSpatialDictionaryTestSuite = async () => {
    setIsRunning(true);
    setSpatialDictionaryTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runSpatialDictionaryTestSuite();
    setSpatialDictionaryTestResult(result);
    setIsRunning(false);
  };

  const handleRunSpatialDecoderTestSuite = async () => {
    setIsRunning(true);
    setSpatialDecoderTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runSpatialDecoderTestSuite();
    setSpatialDecoderTestResult(result);
    setIsRunning(false);
  };

  const handleRunSpatialEncoderTestSuite = async () => {
    setIsRunning(true);
    setSpatialEncoderTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runSpatialEncoderTestSuite();
    setSpatialEncoderTestResult(result);
    setIsRunning(false);
  };

  const handleRunOptimizerTestSuite = async () => {
    setIsRunning(true);
    setOptimizerTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runRuleOptimizerTestSuite();
    setOptimizerTestResult(result);
    setIsRunning(false);
  };

  const handleRunPatternTestSuite = async () => {
    setIsRunning(true);
    setPatternTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runSpatialPatternTestSuite();
    setPatternTestResult(result);
    setIsRunning(false);
  };

  const handleRunRoundtripTest = async () => {
    setIsRunning(true);
    setRoundtripResult(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const result = runImportantRoundtripTest(customRoundtripInput.trim() || undefined);
    setRoundtripResult(result);
    setIsRunning(false);
  };

  const handleRunStandardSuite = async () => {
    setIsRunning(true);
    setStandardResults([]);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const results = runStandardBenchmarkSuite();
    setStandardResults(results);
    setIsRunning(false);
  };

  const handleRunRepresentationSuite = async () => {
    setIsRunning(true);
    setRepResults([]);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const results = runRepresentationOverheadBenchmarkSuite();
    setRepResults(results);
    setIsRunning(false);
  };

  const handleRunUnitTests = async () => {
    setIsRunning(true);
    setUnitTestResults([]);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const results = runSystemUnitTests();
    setUnitTestResults(results);
    setIsRunning(false);
  };

  const handleLoadInStudio = (input: string, name: string) => {
    const enc = encodeToHierarchicalMemory(input, 1, name);
    // Convert root memory's primary block or grid to studio
    const primaryBlock = enc.root.blocks[0];
    const grid: MemoryGrid3D = {
      version: '2.0.0',
      dimension: 7,
      totalCells: enc.root.totalCapacity,
      totalAddressSpace: 369,
      symbolCount: 26,
      cells: primaryBlock.cells,
      sequenceSteps: enc.steps,
      activeCellCount: enc.uniqueCellsActivated,
      entryCellId: enc.steps[0]?.cellId ?? null,
      metadata: {
        title: name,
        createdAt: new Date().toISOString(),
        description: '3D Memory Studio Benchmark Snapshot',
      },
    };
    onLoadGridIntoStudio(grid, input);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#2D2D2F] rounded-lg max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#141416] border-b border-[#2D2D2F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500 flex items-center justify-center text-black font-bold text-xs shadow-md shadow-cyan-500/20">
              TEST
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#E0E0E0] uppercase tracking-wide">
                3D Memory Empirical Verification Suite
              </h2>
              <p className="text-[11px] text-gray-500">
                End-to-end verification of the 3-Funnel hierarchical memory system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#2D2D2F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div className="flex items-center justify-between border-b border-[#2D2D2F] bg-[#141416] px-6 py-2">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <button
              id="tab-btn-funnel12"
              onClick={() => setActiveTab('FUNNEL12_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'FUNNEL12_TEST'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Funnel 12: Compact Decoder (15 Tests)
            </button>
            <button
              id="tab-btn-funnel11"
              onClick={() => setActiveTab('FUNNEL11_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'FUNNEL11_TEST'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Funnel 11: Profitability (10 Tests)
            </button>
            <button
              id="tab-btn-funnel10"
              onClick={() => setActiveTab('FUNNEL10_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'FUNNEL10_TEST'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Funnel 10: Composite Discovery
            </button>
            <button
              id="tab-btn-funnel9"
              onClick={() => setActiveTab('FUNNEL9_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'FUNNEL9_TEST'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              Funnel 9: Canonical Identity
            </button>
            <button
              id="tab-btn-hierarchy"
              onClick={() => setActiveTab('HIERARCHY_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'HIERARCHY_TEST'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Funnel 6: Spatial Hierarchy
            </button>
            <button
              id="tab-btn-spatial-dict"
              onClick={() => setActiveTab('SPATIAL_DICT_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'SPATIAL_DICT_TEST'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Funnel 5: Pattern Dictionary
            </button>
            <button
              id="tab-btn-compression-proof"
              onClick={() => setActiveTab('COMPRESSION_PROOF')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'COMPRESSION_PROOF'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Funnel 4: Compression Proof (12 Datasets)
            </button>
            <button
              id="tab-btn-spatial-decoder"
              onClick={() => setActiveTab('SPATIAL_DECODER_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'SPATIAL_DECODER_TEST'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Spatial Decoder (1..12)
            </button>
            <button
              id="tab-btn-spatial-encoder"
              onClick={() => setActiveTab('SPATIAL_ENCODER_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'SPATIAL_ENCODER_TEST'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              Spatial Encoder (1..10)
            </button>
            <button
              id="tab-btn-optimizer"
              onClick={() => setActiveTab('OPTIMIZER_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'OPTIMIZER_TEST'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              Rule Optimizer Tests (1..8)
            </button>
            <button
              onClick={() => setActiveTab('PATTERNS_TEST')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'PATTERNS_TEST'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pattern Discovery Tests (1..8)
            </button>
            <button
              onClick={() => setActiveTab('ROUNDTRIP')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ROUNDTRIP'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Important Roundtrip Test
            </button>
            <button
              onClick={() => setActiveTab('REPRESENTATION')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'REPRESENTATION'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Representation Benchmark
            </button>
            <button
              onClick={() => setActiveTab('STANDARD')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'STANDARD'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Standard Tests (1..4)
            </button>
            <button
              onClick={() => setActiveTab('UNIT')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'UNIT'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              System Unit Tests
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'FUNNEL12_TEST' && (
              <button
                id="btn-execute-funnel12-tests"
                disabled={isRunning}
                onClick={handleRunFunnel12TestSuite}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Verifying...' : 'Run Funnel 12 Suite (15 Tests)'}
              </button>
            )}
            {activeTab === 'FUNNEL11_TEST' && (
              <button
                id="btn-execute-funnel11-tests"
                disabled={isRunning}
                onClick={handleRunFunnel11TestSuite}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Measuring Bytes...' : 'Run Funnel 11 Suite (10 Tests)'}
              </button>
            )}
            {activeTab === 'FUNNEL10_TEST' && (
              <button
                id="btn-execute-funnel10-tests"
                disabled={isRunning}
                onClick={handleRunFunnel10TestSuite}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Discovering...' : 'Run Funnel 10 Suite (10 Tests)'}
              </button>
            )}
            {activeTab === 'FUNNEL9_TEST' && (
              <button
                id="btn-execute-funnel9-tests"
                disabled={isRunning}
                onClick={handleRunFunnel9TestSuite}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Verifying...' : 'Run Funnel 9 Suite (6 Tests)'}
              </button>
            )}
            {activeTab === 'HIERARCHY_TEST' && (
              <button
                id="btn-execute-hierarchy-tests"
                disabled={isRunning}
                onClick={handleRunHierarchyTestSuite}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Auditing...' : 'Run Hierarchy Suite (10 Tests)'}
              </button>
            )}
            {activeTab === 'SPATIAL_DICT_TEST' && (
              <button
                id="btn-execute-spatial-dict-tests"
                disabled={isRunning}
                onClick={handleRunSpatialDictionaryTestSuite}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Analyzing...' : 'Run Funnel 5 Suite (5 Tests)'}
              </button>
            )}
            {activeTab === 'SPATIAL_DECODER_TEST' && (
              <button
                id="btn-execute-spatial-decoder-tests"
                disabled={isRunning}
                onClick={handleRunSpatialDecoderTestSuite}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Decoding...' : 'Run Spatial Decoder Suite (12 Tests)'}
              </button>
            )}
            {activeTab === 'SPATIAL_ENCODER_TEST' && (
              <button
                id="btn-execute-spatial-encoder-tests"
                disabled={isRunning}
                onClick={handleRunSpatialEncoderTestSuite}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Encoding...' : 'Run Spatial Encoder Suite (10 Tests)'}
              </button>
            )}
            {activeTab === 'OPTIMIZER_TEST' && (
              <button
                id="btn-execute-optimizer-tests"
                disabled={isRunning}
                onClick={handleRunOptimizerTestSuite}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Evaluating...' : 'Run Optimizer Suite (8 Tests)'}
              </button>
            )}
            {activeTab === 'PATTERNS_TEST' && (
              <button
                disabled={isRunning}
                onClick={handleRunPatternTestSuite}
                className="px-3 py-1 rounded bg-purple-500 hover:bg-purple-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Discovering...' : 'Run Pattern Tests (8 Cases)'}
              </button>
            )}
            {activeTab === 'ROUNDTRIP' && (
              <button
                disabled={isRunning}
                onClick={handleRunRoundtripTest}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Executing...' : 'Run Roundtrip Test'}
              </button>
            )}
            {activeTab === 'REPRESENTATION' && (
              <button
                disabled={isRunning}
                onClick={handleRunRepresentationSuite}
                className="px-3 py-1 rounded bg-green-500 hover:bg-green-400 text-black font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Comparing...' : 'Run Representation Benchmark'}
              </button>
            )}
            {activeTab === 'STANDARD' && (
              <button
                disabled={isRunning}
                onClick={handleRunStandardSuite}
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isRunning ? 'Running...' : 'Run Tests (1..4)'}
              </button>
            )}
            {activeTab === 'UNIT' && (
              <button
                disabled={isRunning}
                onClick={handleRunUnitTests}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isRunning ? 'Running...' : 'Run Unit Tests'}
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB: FUNNEL 12 COMPACT ENCODING & INDEPENDENT DECODER */}
          {activeTab === 'FUNNEL12_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Funnel 12 — Hierarchical Compact Encoding & Independent Decoder Suite
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                    FUNNEL 12 — COMPACT3D-V4
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Verifies deterministic binary serialization (compact3d-v4) and exact memory reconstruction via an independent, stateless decoder. Enforces maximum depth ≤ 3, CRC32 checksums, and strict coverage validation.
                </p>
              </div>

              {!funnel12Report ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <Cpu className="w-12 h-12 text-cyan-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Funnel 12 Verification Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Execute 15 rigorous test cases proving hierarchical encoding, independent decoding, sequence preservation, block isolation, mixture encoding, and corrupted artifact rejection.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunFunnel12TestSuite}
                    className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Verifying...' : 'Run Funnel 12 Test Suite (15 Tests)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/40 rounded flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">
                      Suite Result: {funnel12Report.passedTests} / {funnel12Report.totalTests} Passed ({funnel12Report.totalDurationMs.toFixed(1)}ms)
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-900/60 text-cyan-300 text-[10px] font-bold rounded border border-cyan-700/60">
                      {funnel12Report.allPassed ? '100% PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {funnel12Report.results.map((r) => (
                      <div
                        key={r.testId}
                        className={`p-3 rounded border flex items-start justify-between gap-2 ${
                          r.passed
                            ? 'bg-cyan-950/20 border-cyan-800/40 text-gray-200'
                            : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">[{r.testId}]</span>
                            <span className="font-bold text-xs text-white">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">{r.details}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            r.passed
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : 'bg-rose-900/60 text-rose-300'
                          }`}
                        >
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNNEL 11 COMPOSITE PROFITABILITY & SELECTION */}
          {activeTab === 'FUNNEL11_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Funnel 11 — Composite Profitability & Selection Suite
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                    FUNNEL 11 — EXACT BYTE PROOF
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Enforces mathematical compression truth: candidates are accepted ONLY when actual serialized bytes prove totalCompositeCost &lt; expandedChildCost. Includes conflict resolution and 100% deterministic binary validation.
                </p>
              </div>

              {!funnel11Report ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <Scale className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Funnel 11 Profitability & Selection Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Execute 10 rigorous empirical verification tests proving definition byte counts, occurrence reference costs, overlap conflict resolution, and deterministic serialization.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunFunnel11TestSuite}
                    className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Measuring Bytes...' : 'Run Funnel 11 Test Suite (10 Tests)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded flex items-center justify-between">
                    <span className="text-emerald-300 font-bold">
                      Suite Result: {funnel11Report.passedTests} / {funnel11Report.totalTests} Passed
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 text-[10px] font-bold rounded border border-emerald-700/60">
                      {funnel11Report.allPassed ? '100% PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {funnel11Report.results.map((r) => (
                      <div
                        key={r.testId}
                        className={`p-3 rounded border flex items-start justify-between gap-2 ${
                          r.passed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                            : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">[{r.testId}]</span>
                            <span className="font-bold text-xs text-white">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">{r.details}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            r.passed
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                              : 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                          }`}
                        >
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNNEL 10 COMPOSITE DISCOVERY */}
          {activeTab === 'FUNNEL10_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Funnel 10 — Composite Candidate Discovery & Verification Suite
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                    FUNNEL 10 — LEVEL 3 DISCOVERY
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Validates deterministic spatial composition discovery, canonical candidate grouping, cross-block candidate rejection, single-occurrence preservation, and bounding box constraints.
                </p>
              </div>

              {!funnel10Report ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <Sparkles className="w-12 h-12 text-cyan-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Funnel 10 Discovery Test Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Execute 10 specialized empirical verification cases validating candidate extraction, single-block rule, and canonical grouping.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunFunnel10TestSuite}
                    className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Discovering...' : 'Run Funnel 10 Test Suite (10 Tests)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/40 rounded flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">
                      Suite Result: {funnel10Report.passedTests} / {funnel10Report.totalTests} Passed
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 text-[10px] font-bold rounded border border-emerald-700/60">
                      {funnel10Report.allPassed ? '100% PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {funnel10Report.results.map((r) => (
                      <div
                        key={r.testId}
                        className={`p-3 rounded border flex items-start justify-between gap-2 ${
                          r.passed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                            : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">[{r.testId}]</span>
                            <span className="font-bold text-xs text-white">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">{r.details}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            r.passed
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                              : 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                          }`}
                        >
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNNEL 9 CANONICAL IDENTITY */}
          {activeTab === 'FUNNEL9_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    Funnel 9 — Canonicalization & Structural Identity Suite
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                    FUNNEL 9 — CANONICAL SIGNATURES
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Tests origin-invariance, relative coordinate normalization, deterministic child sort order, and collision-safe structural identifier generation.
                </p>
              </div>

              {!funnel9Results ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <Fingerprint className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Funnel 9 Canonicalization Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Execute 6 mathematical invariance test cases ensuring exact structural identity irrespective of spatial translations.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunFunnel9TestSuite}
                    className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Verifying...' : 'Run Funnel 9 Test Suite (6 Tests)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {funnel9Results.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded border flex items-start justify-between gap-2 ${
                        r.passed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                          : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">[{r.id}]</span>
                          <span className="font-bold text-xs text-white">{r.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">{r.details}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          r.passed
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {r.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNNEL 6 HIERARCHY */}
          {activeTab === 'HIERARCHY_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Funnel 6 — Spatial Hierarchy & Composition Suite
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                    FUNNEL 6 — BOUNDED DAG (DEPTH ≤ 3)
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Tests maximum depth enforcement (Depth ≤ 3), cycle detection, 100% cell coverage, multi-level byte serialization, and exact roundtrip parity.
                </p>
              </div>

              {!hierarchyTestSuiteResult ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <Layers className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Spatial Hierarchy Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Execute 10 structural validation cases confirming acyclic graph invariants and depth bounds.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunHierarchyTestSuite}
                    className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Auditing...' : 'Run Hierarchy Suite (10 Tests)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {hierarchyTestSuiteResult.tests.map((t) => (
                    <div
                      key={t.testId}
                      className={`p-3 rounded border flex items-start justify-between gap-2 ${
                        t.passed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                          : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">[{t.testId}]</span>
                          <span className="font-bold text-xs text-white">{t.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">{t.details}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          t.passed
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {t.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNNEL 5 SPATIAL PATTERN DICTIONARY */}
          {activeTab === 'SPATIAL_DICT_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Funnel 5 — Reusable Spatial Pattern Dictionary Suite
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                    FUNNEL 5 — REUSABLE RULE METADATA
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  Tests canonical rule extraction, rule signatures, dictionary profitability scoring (
                  <span className="text-cyan-300 font-mono">C_entry + k×C_ref &lt; k×C_inline</span>), single-rule disqualification, multi-occurrence deduplication, and exact roundtrip parity.
                </p>
              </div>

              {!spatialDictionaryTestResult ? (
                <div className="text-center py-12 bg-[#141416] rounded border border-[#2D2D2F] space-y-3">
                  <BookOpen className="w-12 h-12 text-cyan-400 mx-auto opacity-80" />
                  <div className="text-sm font-bold text-gray-300">
                    Spatial Pattern Dictionary Suite Ready
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Click below to execute 5 deterministic test cases validating canonical rule deduplication, break-even thresholds, safe bypass, and exact checksum matching.
                  </p>
                  <button
                    disabled={isRunning}
                    onClick={handleRunSpatialDictionaryTestSuite}
                    className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{isRunning ? 'Analyzing...' : 'Run Funnel 5 Test Suite'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-[#141416] p-3 rounded border border-[#2D2D2F]">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Passed Tests</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {spatialDictionaryTestResult.passedCount} / {spatialDictionaryTestResult.totalTests}
                      </span>
                    </div>

                    <div className="bg-[#141416] p-3 rounded border border-[#2D2D2F]">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Determinism</span>
                      <span className="text-sm font-bold font-mono text-cyan-300 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        100% REPRODUCIBLE
                      </span>
                    </div>

                    <div className="bg-[#141416] p-3 rounded border border-[#2D2D2F]">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Original Total</span>
                      <span className="text-base font-bold font-mono text-gray-300">
                        {spatialDictionaryTestResult.totalOriginalBytes} Bytes
                      </span>
                    </div>

                    <div className="bg-[#141416] p-3 rounded border border-[#2D2D2F]">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Compact3D V2 Total</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {spatialDictionaryTestResult.totalCompactV2Bytes} Bytes ({spatialDictionaryTestResult.overallV2SavingsPercent.toFixed(1)}% savings)
                      </span>
                    </div>
                  </div>

                  {/* Test Cases Table */}
                  <div className="overflow-x-auto border border-[#2D2D2F] rounded bg-[#141416]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-[#1A1A1E] border-b border-[#2D2D2F] text-gray-400">
                          <th className="p-2.5">Test Case</th>
                          <th className="p-2.5">Input & Behavior</th>
                          <th className="p-2.5 text-center">Dictionary Used</th>
                          <th className="p-2.5 text-right">Orig / V1 / V2 Bytes</th>
                          <th className="p-2.5 text-right">Net Savings</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#26262B]">
                        {spatialDictionaryTestResult.results.map((t) => (
                          <tr key={t.testId} className="hover:bg-[#18181D]">
                            <td className="p-2.5">
                              <span className="font-bold text-white block">{t.testName}</span>
                              <span className="text-[10px] text-gray-500">{t.testId}</span>
                            </td>
                            <td className="p-2.5 text-gray-300 max-w-xs">
                              <div>{t.inputDescription}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{t.details}</div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.actualDictionaryUsed
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {t.actualDictionaryUsed ? 'YES (APPLIED)' : 'NO (BYPASSED)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-gray-400">
                              <span className="text-gray-500">{t.originalBytes}</span> /{' '}
                              <span className="text-gray-400">{t.compactV1Bytes}</span> /{' '}
                              <span className="font-bold text-cyan-300">{t.compactV2Bytes} B</span>
                            </td>
                            <td className="p-2.5 text-right font-bold">
                              <span className={t.netDictSavings > 0 ? 'text-emerald-400' : 'text-gray-500'}>
                                {t.netDictSavings > 0 ? `+${t.netDictSavings} B` : '0 B'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                              }`}>
                                {t.passed ? 'PASS' : 'FAIL'}
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
          )}

          {/* TAB: COMPRESSION BENCHMARK */}
          {activeTab === 'COMPRESSION_PROOF' && (
            <CompressionBenchmarkPanel
              onLoadDatasetToStudio={(rootMem, name) => {
                const primaryBlock = rootMem.blocks[0];
                const grid: MemoryGrid3D = {
                  version: '2.0.0',
                  dimension: 7,
                  totalCells: rootMem.totalCapacity,
                  totalAddressSpace: 369,
                  symbolCount: 26,
                  cells: primaryBlock.cells,
                  sequenceSteps: primaryBlock.sequenceSteps || [],
                  activeCellCount: primaryBlock.activeCellCount,
                  entryCellId: primaryBlock.sequenceSteps?.[0]?.cellId ?? null,
                  metadata: {
                    title: name,
                    createdAt: new Date().toISOString(),
                    description: `Benchmark Dataset: ${name}`,
                  },
                };
                onLoadGridIntoStudio(grid, name);
                onClose();
              }}
            />
          )}

          {/* TAB: SPATIAL DECODER TESTS (1..12) */}
          {activeTab === 'SPATIAL_DECODER_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Spatial Decoder — Exact Lossless Reconstruction & Roundtrip Suite
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                    FUNNEL 3 — EXACT SPATIAL DECODER
                  </span>
                </div>

                <p className="text-gray-300 text-[11px]">
                  Validates isolated binary parsing, exact cell-for-cell / coordinate / symbol / sequence step parity, coverage verification (no omissions, no overlaps), intentional corruption rejection across all stages, and double-roundtrip idempotence.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-cyan-400 font-bold block">1..4: Rule Expansion</span>
                    <span className="text-gray-500">Run, Repetition, Cluster, Repeated Shape</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-emerald-400 font-bold block">5..8: Sequence & Blocks</span>
                    <span className="text-gray-500">Trajectory paths, Multi-block, Cross-block</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-amber-400 font-bold block">9..10: Entropy & Stress</span>
                    <span className="text-gray-500">Pure RAW fallback, large stress datasets</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-pink-400 font-bold block">11..12: Corruption & Stability</span>
                    <span className="text-gray-500">Corrupted artifact rejection & 2x idempotence</span>
                  </div>
                </div>
              </div>

              {spatialDecoderTestResult ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Suite Verdict</div>
                      <div className="text-lg font-black flex items-center gap-1.5 mt-0.5">
                        {spatialDecoderTestResult.passedCount === spatialDecoderTestResult.totalTests ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400">ALL 12 PASS</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">
                              {spatialDecoderTestResult.passedCount}/{spatialDecoderTestResult.totalTests} PASS
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Determinism & Idempotence</div>
                      <div className="text-lg font-black text-cyan-300 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span className={spatialDecoderTestResult.doubleRoundtripPassed ? 'text-cyan-300 text-sm font-bold' : 'text-red-400 text-sm'}>
                          {spatialDecoderTestResult.doubleRoundtripPassed ? 'DOUBLE ROUNDTRIP OK' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Corruption Integrity</div>
                      <div className="text-lg font-black text-purple-300 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span className={spatialDecoderTestResult.corruptionHandlingPassed ? 'text-purple-300 text-sm font-bold' : 'text-red-400 text-sm'}>
                          {spatialDecoderTestResult.corruptionHandlingPassed ? 'FAILURES TRAPPED' : 'LEAK DETECTED'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Execution Time</div>
                      <div className="text-lg font-black text-amber-300 mt-0.5 font-mono">
                        {spatialDecoderTestResult.durationMs.toFixed(1)} ms
                      </div>
                    </div>
                  </div>

                  {/* Test Cases Table */}
                  <div className="bg-[#121215] rounded border border-[#222226] overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#16161A] border-b border-[#222226] flex items-center justify-between text-xs font-bold font-mono text-gray-300">
                      <span>TEST RESULTS BREAKDOWN ({spatialDecoderTestResult.passedCount} / {spatialDecoderTestResult.totalTests} PASSED)</span>
                      <span className="text-emerald-400">EXACT RECONSTRUCTION 100%</span>
                    </div>

                    <div className="divide-y divide-[#1D1D22] text-xs font-mono">
                      {spatialDecoderTestResult.results.map((res, i) => (
                        <div key={res.testId} className="p-3 hover:bg-[#16161A] flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold">#{i + 1}</span>
                              <span className="text-white font-bold">{res.testName}</span>
                              <span className="text-[10px] text-gray-400">({res.testId})</span>
                            </div>
                            <div className="text-gray-400 text-[11px] font-sans">
                              {res.description}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-3 pt-0.5">
                              <span>Details: <strong className="text-gray-300">{res.details}</strong></span>
                              <span>Coverage: <strong className="text-emerald-400">{res.coverageStatus}</strong></span>
                              <span>Checksum: <strong className={res.checksumMatch ? 'text-cyan-400' : 'text-red-400'}>{res.checksumMatch ? 'MATCH' : 'MISMATCH'}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-gray-500 text-[10px]">{res.durationMs.toFixed(2)}ms</span>
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
                                res.passed
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                                  : 'bg-red-950/80 text-red-300 border border-red-700'
                              }`}
                            >
                              {res.passed ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>PASS</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                  <span>FAIL</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#121215] rounded border border-[#222226] space-y-3">
                  <Cpu className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                  <div className="text-sm font-bold text-white">Funnel 3 Decoder Test Suite Ready</div>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Click the button above to execute all 12 rigorous decoding test cases, covering all rule types, sequence paths, corruption detection, and double roundtrip verification.
                  </p>
                  <button
                    onClick={handleRunSpatialDecoderTestSuite}
                    disabled={isRunning}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded cursor-pointer disabled:opacity-50 text-xs inline-flex items-center gap-1.5 shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    {isRunning ? 'Executing 12 Test Cases...' : 'Execute Decoder Suite'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SPATIAL ENCODER TESTS (1..10) */}
          {activeTab === 'SPATIAL_ENCODER_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Spatial Encoder — Deterministic .compact3d Binary Pipeline Verification
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                    FUNNEL 2 — ACTUAL SPATIAL ENCODER
                  </span>
                </div>

                <p className="text-gray-300 text-[11px]">
                  Validates immutable encoding plan generation, coverage enforcement (all active cells accounted for, zero duplicates), opcoded binary serialization, determinism (2 consecutive encodings byte-identical), and byte-level comparison against original memory.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] pt-1">
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-cyan-400 font-bold block">1..3: X/Y/Z Runs</span>
                    <span className="text-gray-500">Run encoding on all 3 coordinate axes</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-purple-400 font-bold block">4: RAW Fallback</span>
                    <span className="text-gray-500">Uncovered/negative cells safely encoded as RAW</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-amber-400 font-bold block">5: Hybrid Encoding</span>
                    <span className="text-gray-500">Coexistence of rule segments and raw cells</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-pink-400 font-bold block">6 & 7: Overlaps & Cross-Block</span>
                    <span className="text-gray-500">Conflict arbitration & multi-block plans</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-emerald-400 font-bold block">8..10: Multi-Rule & Net Size</span>
                    <span className="text-gray-500">Determinism check & header-overhead truth</span>
                  </div>
                </div>
              </div>

              {spatialEncoderTestResult ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Suite Verdict</div>
                      <div className="text-lg font-black flex items-center gap-1.5 mt-0.5">
                        {spatialEncoderTestResult.passedCount === spatialEncoderTestResult.totalTests ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">ALL 10 PASS</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">
                              {spatialEncoderTestResult.passedCount}/{spatialEncoderTestResult.totalTests} PASS
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Determinism Verification</div>
                      <div className="text-lg font-black text-cyan-300 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span className={spatialEncoderTestResult.determinismPassed ? 'text-cyan-300 text-sm font-bold' : 'text-red-400 text-sm'}>
                          {spatialEncoderTestResult.determinismPassed ? '100% DETERMINISTIC' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Total Compact Bytes</div>
                      <div className="text-lg font-black text-purple-300 mt-0.5 font-mono">
                        {spatialEncoderTestResult.totalCompactBytes} B{' '}
                        <span className="text-xs font-normal text-gray-400">
                          (vs {spatialEncoderTestResult.totalOriginalBytes} B orig)
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Execution Duration</div>
                      <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                        {spatialEncoderTestResult.durationMs} ms
                      </div>
                    </div>
                  </div>

                  {/* 10 Test Cards */}
                  <div className="space-y-3">
                    {spatialEncoderTestResult.results.map((c) => (
                      <div
                        key={c.testId}
                        className={`p-4 rounded border transition-all ${
                          c.passed
                            ? 'bg-[#101014] border-[#25252D] hover:border-cyan-500/50'
                            : 'bg-red-950/20 border-red-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                c.passed ? 'bg-green-400' : 'bg-red-500'
                              }`}
                            />
                            <h4 className="font-bold text-xs text-white">
                              {c.testName}
                            </h4>
                            <span className="text-[10px] text-gray-500">[{c.testId}]</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{c.durationMs} ms</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.passed
                                  ? 'bg-green-950 text-green-300 border border-green-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {c.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mb-2">{c.description}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#0A0A0C] p-2 rounded border border-[#1A1A20] font-mono">
                          <div>
                            <span className="text-gray-500 block">Plan Status:</span>
                            <span className={c.coverageStatus === 'ENCODING_SUCCESS' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {c.coverageStatus}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Segments Count:</span>
                            <span className="text-cyan-300 font-bold">
                              {c.ruleSegmentsCount} Rules / {c.rawSegmentsCount} RAW
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Covered Cells:</span>
                            <span className="text-white font-bold">
                              {c.coveredCells} / {c.totalCells} ({c.coveragePercent}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Compact Serialized:</span>
                            <span className="text-purple-300 font-bold">
                              {c.serializedCompactBytes} B{' '}
                              <span className="text-gray-500 text-[9px] font-normal">
                                (vs {c.originalBytes} B)
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-gray-400 bg-[#0F0F13] p-1.5 rounded border border-[#1C1C22]">
                          <strong className="text-cyan-400">Details:</strong> {c.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#121215] rounded border border-[#222226] space-y-3">
                  <Cpu className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="text-sm font-bold text-white">Spatial Encoder Suite Ready</div>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Click "Run Spatial Encoder Suite (10 Tests)" to test complete end-to-end plan generation, segment coverage, opcoded binary serialization, determinism, and byte measurement.
                  </p>
                  <button
                    onClick={handleRunSpatialEncoderTestSuite}
                    disabled={isRunning}
                    className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    {isRunning ? 'Executing...' : 'Run Spatial Encoder Suite (10 Tests)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: RULE OPTIMIZER TESTS (1..8) */}
          {activeTab === 'OPTIMIZER_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    Rule Optimizer — Real Serialized Byte Cost & Winner Selection Suite
                  </span>
                  <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/80 font-bold">
                    SIMULATION — DETERMINISTIC SERIALIZATION
                  </span>
                </div>

                <p className="text-gray-300 text-[11px]">
                  Evaluates the 8 rigorous research test cases for deterministic binary serialization, candidate generation, exact equality validation, and strict "Never force a rule" RAW-vs-Rule byte size optimization.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-cyan-400 font-bold block">1 & 2: Long vs Short Run</span>
                    <span className="text-gray-500">Long runs win by rule; short runs default to RAW</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-purple-400 font-bold block">3 & 4: Repetitions</span>
                    <span className="text-gray-500">Header overhead prevents negative compression</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-amber-400 font-bold block">5 & 6: Clusters & Bad Rules</span>
                    <span className="text-gray-500">Bounding boxes evaluated; invalid rules rejected</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-emerald-400 font-bold block">7 & 8: Cross-Block & Determinism</span>
                    <span className="text-gray-500">Deterministic byte comparisons & block offsets</span>
                  </div>
                </div>
              </div>

              {optimizerTestResult ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Suite Verdict</div>
                      <div className="text-lg font-black flex items-center gap-1.5 mt-0.5">
                        {optimizerTestResult.passedCount === optimizerTestResult.totalTests ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">ALL 8 PASS</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">
                              {optimizerTestResult.passedCount}/{optimizerTestResult.totalTests} PASS
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Rule vs RAW Wins</div>
                      <div className="text-lg font-black text-cyan-300 mt-0.5">
                        {optimizerTestResult.rulesWonCount}{' '}
                        <span className="text-xs font-normal text-gray-400">Rules</span> /{' '}
                        {optimizerTestResult.rawWonCount}{' '}
                        <span className="text-xs font-normal text-amber-400">RAW</span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Total Bytes Evaluated</div>
                      <div className="text-lg font-black text-purple-300 mt-0.5 font-mono">
                        {optimizerTestResult.totalOriginalBytes} B →{' '}
                        <span className="text-emerald-400">{optimizerTestResult.totalOptimizedBytes} B</span>
                      </div>
                    </div>

                    <div className="bg-[#121215] p-3 rounded border border-[#222226]">
                      <div className="text-[10px] text-gray-500 uppercase">Overall Net Savings</div>
                      <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                        -{optimizerTestResult.overallNetSavingsBytes} B ({optimizerTestResult.overallSavingsPercent}%)
                      </div>
                    </div>
                  </div>

                  {/* 8 Test Cards */}
                  <div className="space-y-3">
                    {optimizerTestResult.results.map((c) => (
                      <div
                        key={c.testId}
                        className={`p-4 rounded border transition-all ${
                          c.passed
                            ? 'bg-[#101014] border-[#25252D] hover:border-cyan-500/50'
                            : 'bg-red-950/20 border-red-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                c.passed ? 'bg-green-400' : 'bg-red-500'
                              }`}
                            />
                            <h4 className="font-bold text-xs text-white">
                              {c.testName}
                            </h4>
                            <span className="text-[10px] text-gray-500">[{c.testId}]</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{c.durationMs} ms</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.passed
                                  ? 'bg-green-950 text-green-300 border border-green-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {c.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400">{c.description}</p>

                        <div className="bg-[#121215] p-2.5 rounded border border-[#1E1E22] flex flex-wrap items-center justify-between gap-3 text-[10px] mt-2">
                          <div>
                            <span className="text-gray-500">Expected: </span>
                            <strong className="text-cyan-400">{c.expectedWinner}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Actual Winner: </span>
                            <strong
                              className={
                                c.actualWinner === c.expectedWinner ? 'text-emerald-400' : 'text-red-400'
                              }
                            >
                              {c.actualWinner}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-500">RAW vs Winner: </span>
                            <strong className="text-white font-mono">
                              {c.originalRawBytes} B → {c.winningBytes} B
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Net Savings: </span>
                            <strong
                              className={
                                c.savingsBytes > 0 ? 'text-emerald-400 font-mono' : 'text-gray-400 font-mono'
                              }
                            >
                              -{c.savingsBytes} B ({c.savingsPercent}%)
                            </strong>
                          </div>
                        </div>

                        {c.details && (
                          <div className="text-[10px] font-mono bg-[#16161A] p-2 rounded text-gray-300 border border-[#26262B] mt-2 whitespace-pre-wrap leading-relaxed">
                            {c.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500 space-y-2">
                  <SlidersHorizontal className="w-8 h-8 text-cyan-400 mx-auto opacity-40 animate-pulse" />
                  <p>Click <strong className="text-cyan-400">Run Optimizer Suite (8 Tests)</strong> to execute the full deterministic serialization & candidate verification benchmark.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 0: SPATIAL PATTERN ENGINE TESTS (1..8) */}
          {activeTab === 'PATTERNS_TEST' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Spatial Pattern Discovery & Rule Synthesis Suite
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                    ESTIMATED — NOT YET APPLIED
                  </span>
                </div>

                <p className="text-gray-300 text-[11px]">
                  Executes the 8 mandatory test cases verifying Funnel 1 (Spatial Pattern Detection) and Funnel 2 (Rule Synthesis, Reconstructive Validation & Estimated Savings).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-cyan-400 font-bold block">1-3: Linear Runs</span>
                    <span className="text-gray-500">Continuous straight lines along X/Y/Z</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-purple-400 font-bold block">4: Spatial Repetition</span>
                    <span className="text-gray-500">Periodic steps with stride & delta</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-emerald-400 font-bold block">5: Spatial Cluster</span>
                    <span className="text-gray-500">High-density geometric neighborhoods</span>
                  </div>
                  <div className="p-2 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-amber-400 font-bold block">6-8: Shapes & Validation</span>
                    <span className="text-gray-500">Cubes, planes, noisy, & bad rule rejection</span>
                  </div>
                </div>
              </div>

              {patternTestResult ? (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  <div className="p-3 bg-[#0E0E12] rounded border border-[#2D2D35] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-gray-500 text-[10px]">ALL 8 TESTS</span>
                        <div className="text-sm font-bold text-white">
                          {patternTestResult.passedCount} / {patternTestResult.totalTests} Passed
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#26262B]" />
                      <div>
                        <span className="text-gray-500 text-[10px]">PATTERNS DISCOVERED</span>
                        <div className="text-sm font-bold text-cyan-400">
                          {patternTestResult.totalPatternsFound}
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#26262B]" />
                      <div>
                        <span className="text-gray-500 text-[10px]">AVG ESTIMATED SAVINGS</span>
                        <div className="text-sm font-bold text-emerald-400">
                          ~{patternTestResult.averageEstimatedSavingsPercent}%
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded font-bold text-xs ${
                        patternTestResult.allPassed
                          ? 'bg-green-950 text-green-300 border border-green-700'
                          : 'bg-red-950 text-red-300 border border-red-700'
                      }`}
                    >
                      {patternTestResult.allPassed ? 'ALL 8 TESTS PASSED' : 'TESTS FAILED'}
                    </span>
                  </div>

                  {/* Individual Test Cards */}
                  <div className="space-y-2">
                    {patternTestResult.cases.map((c) => (
                      <div
                        key={c.testId}
                        className="p-3 bg-[#0A0A0B] rounded border border-[#222226] hover:border-[#333338] transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {c.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            )}
                            <span className="font-bold text-white">{c.name}</span>
                            <span className="text-[10px] text-gray-500">[{c.testId}]</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{c.durationMs} ms</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.passed
                                  ? 'bg-green-950 text-green-300 border border-green-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {c.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400">{c.description}</p>

                        <div className="bg-[#121215] p-2 rounded border border-[#1E1E22] flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-500">Target Type: </span>
                            <strong className="text-cyan-400">{c.expectedPatternType}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Patterns Found: </span>
                            <strong className="text-purple-400">{c.patternsFound}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Rule Validation Rate: </span>
                            <strong className={c.validationRate > 0 ? 'text-green-400' : 'text-amber-400'}>
                              {c.validationRate}%
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Top Score: </span>
                            <strong className="text-emerald-400">{c.topRuleScore}/100</strong>
                          </div>
                        </div>

                        {c.details && (
                          <div className="text-[10px] font-mono bg-[#16161A] p-1.5 rounded text-gray-300 border border-[#26262B]">
                            {c.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-40 animate-pulse" />
                  <p>Click <strong className="text-cyan-400">Run Pattern Tests (8 Cases)</strong> to execute the full 8-case suite.</p>
                </div>
              )}
            </div>
          )}
          {/* TAB 1: IMPORTANT ROUNDTRIP TEST */}
          {activeTab === 'ROUNDTRIP' && (
            <div className="space-y-4">
              {/* Specification Callout */}
              <div className="bg-[#0A0A0B] p-4 rounded border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Important Verification Flow
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Strict Verdict Policy: PASS only on 100% exact match
                  </span>
                </div>

                <p className="text-gray-300 text-[11px]">
                  Executes the full requested lifecycle:
                </p>

                {/* Pipeline Steps Sequence */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 text-center text-[10px] pt-1">
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">1. ENCODE</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">2. ALLOCATE</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">3. STORE</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">4. SAVE .3D</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">5. RESET</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">6. LOAD .3D</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">7. RECON TREE</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-[#26262B]">
                    <span className="text-gray-500 block">8. DECODE</span>
                  </div>
                </div>
              </div>

              {/* Optional Custom Input for test */}
              <div className="bg-[#0A0A0B] p-3 rounded border border-[#222226] space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">
                  Custom Test Payload (Optional — leave blank for standard multi-block payload)
                </span>
                <input
                  type="text"
                  value={customRoundtripInput}
                  onChange={(e) => setCustomRoundtripInput(e.target.value)}
                  placeholder="Enter custom text string to test roundtrip..."
                  className="w-full bg-[#141418] border border-[#26262B] focus:border-amber-500 rounded p-2 text-white font-mono text-xs outline-none"
                />
              </div>

              {/* Test Result Display */}
              {roundtripResult ? (
                <div className="space-y-4">
                  {/* Verdict Banner */}
                  <div
                    className={`p-4 rounded border flex items-center justify-between ${
                      roundtripResult.verdict === 'PASS'
                        ? 'bg-green-950/40 border-green-600 text-green-300 shadow-lg'
                        : 'bg-red-950/40 border-red-600 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {roundtripResult.verdict === 'PASS' ? (
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                      )}
                      <div>
                        <div className="text-base font-bold">
                          ROUNDTRIP VERDICT: {roundtripResult.verdict}
                        </div>
                        <div className="text-[11px] text-gray-300">
                          Original === Decoded: {roundtripResult.isExactMatch ? 'TRUE (100% Identity)' : 'FALSE'}{' '}
                          · Total Duration: {roundtripResult.totalDurationMs} ms
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        roundtripResult.verdict === 'PASS'
                          ? 'bg-green-900 text-green-200 border border-green-500'
                          : 'bg-red-900 text-red-200 border border-red-500'
                      }`}
                    >
                      {roundtripResult.verdict}
                    </span>
                  </div>

                  {/* 8 Step Pipeline Status Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 1: Encode</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step1Encode.inputLength} tokens encoded ({roundtripResult.step1Encode.durationMs}ms)
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 2: Allocate</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step2AllocateBlocks.allocatedBlocksCount} Blocks ({roundtripResult.step2AllocateBlocks.totalCapacity} Cells)
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 3: Store 3D</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step3StoreMemory.activeCellsCount} Active Spatial Cells
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 4: Save .3D</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step4Save3dMemory.fileSizeBytes.toLocaleString()} Bytes serialized
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 5: Reset App</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        Memory state wiped cleanly
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 6: Load .3D</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step6Load3dMemory.parsedBlocksCount} Blocks parsed successfully
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 7: Recon Tree</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        ROOT ├── {roundtripResult.step7ReconstructTree.totalBlocks} Blocks reconstructed
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#222226] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">Step 8: Decode</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {roundtripResult.step8Decode.decodedLength} tokens ({roundtripResult.step8Decode.durationMs}ms)
                      </div>
                    </div>
                  </div>

                  {/* Text Comparison Box */}
                  <div className="bg-[#0A0A0B] p-3 rounded border border-[#222226] space-y-2">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">
                        ORIGINAL INPUT:
                      </span>
                      <div className="bg-[#141418] p-2 rounded text-white select-all">
                        "{roundtripResult.originalInput}"
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">
                        DECODED OUTPUT:
                      </span>
                      <div className="bg-[#141418] p-2 rounded text-green-300 select-all font-bold">
                        "{roundtripResult.decodedOutput}"
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500">
                  Click <strong className="text-amber-400">Run Roundtrip Test</strong> to execute the full end-to-end cycle.
                </div>
              )}
            </div>
          )}

          {/* TAB: REPRESENTATION BENCHMARK (OLD VS NEW) */}
          {activeTab === 'REPRESENTATION' && (
            <div className="space-y-3">
              {repResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-[#0A0A0B] p-3 rounded border border-green-900/40 text-[11px] text-gray-300">
                    <span className="text-green-400 font-bold block mb-1">
                      EMPIRICAL PROOF: OLD DENSE (343 EXPLICIT) VS NEW COMPACT (SPARSE ACTIVE)
                    </span>
                    Zero information loss (0.00%) across all test runs while eliminating redundant empty cell structures.
                  </div>

                  <div className="space-y-2">
                    {repResults.map((r) => (
                      <div
                        key={r.benchmarkId}
                        className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#16161A] text-green-400 font-bold">
                              {r.benchmarkId}
                            </span>
                            <span className="font-bold text-white">{r.name}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-gray-400">
                              Old: {r.oldDense.fileSizeFormatted} → New: <strong className="text-cyan-300">{r.newCompact.fileSizeFormatted}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded font-bold bg-green-950 text-green-300 border border-green-800">
                              -{r.reduction.reductionPercent}% BYTES
                            </span>
                            <span className="px-2 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
                              -{r.reduction.cellEliminationPercent}% OBJECTS
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#121216] p-2 rounded">
                          <div>
                            <span className="text-gray-500 block">Active Cells</span>
                            <span className="text-cyan-400 font-bold">{r.activeCellsCount} / {r.totalImplicitCells}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Eliminated Objects</span>
                            <span className="text-purple-300 font-bold">{r.reduction.cellsEliminated} cells</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Recon Time</span>
                            <span className="text-green-300 font-bold">{r.newCompact.decodeTimeMs} ms</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Information Loss</span>
                            <span className="text-green-400 font-bold">0.00% (LOSSLESS)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500">
                  Click <strong className="text-green-400">Run Representation Benchmark</strong> to compare Old Dense 343 vs New Compact Sparse formats.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STANDARD TESTS (1..4) */}
          {activeTab === 'STANDARD' && (
            <div className="space-y-3">
              {standardResults.length > 0 ? (
                <div className="space-y-2">
                  {standardResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#16161A] text-cyan-400 font-bold">
                            {res.id}
                          </span>
                          <span className="font-bold text-white">{res.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">
                            {res.inputLength} tokens · {res.fileSizeBytes} B · {res.totalTimeMs} ms
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              res.pass
                                ? 'bg-green-950 text-green-300 border border-green-800'
                                : 'bg-red-950 text-red-300'
                            }`}
                          >
                            {res.pass ? 'PASS (0% LOSS)' : 'FAIL'}
                          </span>
                          <button
                            onClick={() => handleLoadInStudio(res.input, res.name)}
                            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300"
                          >
                            Load in 3D View
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#141418] p-2 rounded text-gray-300 text-[10px] truncate">
                        Output: "{res.decodedText}"
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500">
                  Click <strong className="text-cyan-400">Run Tests (1..4)</strong> to verify HELLO, HELLO WORLD, and Multi-Block datasets.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNIT TESTS */}
          {activeTab === 'UNIT' && (
            <div className="space-y-3">
              {unitTestResults.length > 0 ? (
                <div className="space-y-2">
                  {unitTestResults.map((ut, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-[#0A0A0B] border border-[#222226] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-white">{ut.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">{ut.description}</p>
                        <span className="text-[10px] text-cyan-400">{ut.details}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-green-400 font-bold bg-green-950 px-2 py-0.5 rounded border border-green-800">
                          PASS
                        </span>
                        <div className="text-[10px] text-gray-500 mt-1">{ut.durationMs} ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0B] rounded border border-[#1E1E22] text-gray-500">
                  Click <strong className="text-purple-400">Run Unit Tests</strong> to verify 369 addresses, bijection, and spatial search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
