/**
 * 3D Memory Studio - Funnel 2: Spatial Encoder Interactive Panel
 * 
 * Visualizes the immutable Encoding Plan, full cell coverage verification,
 * rule conflict resolution, and real serialized byte measurements.
 */

import React, { useMemo, useState } from 'react';
import { Coordinate3D, MemoryBlock, MemoryGrid3D, RootMemory } from '../types/memory';
import {
  Compact3DArtifact,
  EncodingPlan,
  PlanSegment,
  RuleConflict,
  SpatialEncoderResult,
  SpatialEncodingMeasurement,
  SpatialSegmentType,
} from '../types/spatialEncoder';
import { encodeToSpatialCompact } from '../core/spatialEncoder';
import {
  Binary,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code,
  Cpu,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  HardDrive,
  Info,
  Layers,
  Repeat,
  Scale,
  Shapes,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  XCircle,
  Zap,
} from 'lucide-react';

interface SpatialEncoderPanelProps {
  grid: MemoryGrid3D;
  rootMemory: RootMemory;
  selectedSegment: PlanSegment | null;
  onSelectSegment: (segment: PlanSegment | null) => void;
  onSelectBlock?: (blockId: number) => void;
  onSelectCell?: (cellId: number) => void;
}

export const SpatialEncoderPanel: React.FC<SpatialEncoderPanelProps> = ({
  grid,
  rootMemory,
  selectedSegment,
  onSelectSegment,
  onSelectBlock,
  onSelectCell,
}) => {
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<number | 'ALL'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<SpatialSegmentType | 'ALL'>('ALL');
  const [showArtifactModal, setShowArtifactModal] = useState<boolean>(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState<'JSON' | 'HEX' | 'STRUCTURE'>('JSON');

  // Run spatial encoder pipeline reactively
  const encoderResult: SpatialEncoderResult = useMemo(() => {
    return encodeToSpatialCompact(rootMemory);
  }, [rootMemory]);

  const { plan, artifact, measurement, binaryBuffer, hexDump, isValid, status } = encoderResult;

  // Filtered segments
  const filteredSegments = useMemo(() => {
    let list: PlanSegment[] = [];
    for (const bp of plan.blocks) {
      if (selectedBlockFilter !== 'ALL' && bp.blockId !== selectedBlockFilter) {
        continue;
      }
      for (const seg of bp.segments) {
        if (selectedTypeFilter !== 'ALL' && seg.type !== selectedTypeFilter) {
          continue;
        }
        list.push(seg);
      }
    }
    return list;
  }, [plan, selectedBlockFilter, selectedTypeFilter]);

  const handleDownloadCompactArtifact = () => {
    if (!artifact) return;
    const blob = new Blob([JSON.stringify(artifact, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory_${Date.now()}.compact3d`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBinaryFile = () => {
    if (!binaryBuffer || binaryBuffer.length === 0) return;
    const blob = new Blob([binaryBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory_${Date.now()}.cp3d`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D11] text-gray-200 text-xs font-mono select-none overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="p-3.5 border-b border-[#222228] bg-[#121217] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                Funnel 2: Spatial Encoder
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                  .compact3d
                </span>
              </h2>
              <p className="text-[10px] text-gray-400">
                Deterministic compact representation builder & byte measurement engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-inspect-artifact"
              onClick={() => setShowArtifactModal(true)}
              className="px-2.5 py-1 rounded bg-[#1C1C24] hover:bg-[#252532] text-gray-300 hover:text-white border border-[#2D2D3A] transition-all flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Artifact</span>
            </button>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-2 rounded bg-purple-950/40 border border-purple-800/60 flex items-center justify-between text-[10px] text-purple-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            EXPERIMENTAL COMPACT REPRESENTATION
          </span>
          <span className="text-[9px] bg-purple-900/80 px-2 py-0.5 rounded text-purple-200 border border-purple-700/80 font-mono">
            FUNNEL 2 / COMPRESSION UNVERIFIED
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Status & Integrity Checksum Card */}
        <div className="p-3 rounded-lg bg-[#14141A] border border-[#24242F] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
              Encoding Pipeline Status
            </span>
            <div className="flex items-center gap-1.5">
              {status === 'ENCODED' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-300 border border-green-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ENCODED (100% COVERAGE)
                </span>
              ) : status === 'RULE_CONFLICT' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  RULE CONFLICT
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-amber-400" />
                  ENCODING FAIL
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded bg-[#0E0E13] border border-[#1E1E28]">
              <span className="text-gray-500 block">Logical Memory Checksum:</span>
              <strong className="text-cyan-400 font-mono text-[11px] block mt-0.5">
                {measurement.logicalChecksum}
              </strong>
            </div>
            <div className="p-2 rounded bg-[#0E0E13] border border-[#1E1E28]">
              <span className="text-gray-500 block">Compact Artifact Checksum:</span>
              <strong className="text-purple-400 font-mono text-[11px] block mt-0.5">
                {measurement.compactChecksum}
              </strong>
            </div>
          </div>
        </div>

        {/* Coverage Validation Metric Grid */}
        <div className="p-3 rounded-lg bg-[#14141A] border border-[#24242F] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
              Cell Coverage Map Verification
            </span>
            <span className="text-[10px] text-gray-400">
              {plan.totalBlocks} Block{plan.totalBlocks > 1 ? 's' : ''} Evaluated
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-[9px] text-gray-500 uppercase block">Active</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {plan.totalActiveCells}
              </span>
            </div>

            <div className="p-2 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-[9px] text-gray-500 uppercase block">Covered</span>
              <span className="text-sm font-bold text-green-400 mt-0.5 block">
                {plan.totalCoveredCells}
              </span>
            </div>

            <div className="p-2 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-[9px] text-gray-500 uppercase block">Duplicates</span>
              <span
                className={`text-sm font-bold mt-0.5 block ${
                  plan.totalDuplicateCells === 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {plan.totalDuplicateCells}
              </span>
            </div>

            <div className="p-2 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-[9px] text-gray-500 uppercase block">Uncovered</span>
              <span
                className={`text-sm font-bold mt-0.5 block ${
                  plan.totalUncoveredCells === 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {plan.totalUncoveredCells}
              </span>
            </div>
          </div>

          {/* Representation Mix Count Chips */}
          <div className="pt-2 border-t border-[#1E1E28] space-y-1.5">
            <span className="text-[10px] text-gray-500">Representations Mix:</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                SPATIAL RUN: {plan.representationCounts.SPATIAL_RUN}
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-bold">
                REPETITION: {plan.representationCounts.REPETITION}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-bold">
                CLUSTER: {plan.representationCounts.CLUSTER}
              </span>
              <span className="px-2 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-800 text-[10px] font-bold">
                SHAPE: {plan.representationCounts.REPEATED_SHAPE}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                PATH: {plan.representationCounts.SEQUENCE_PATH}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-bold">
                RAW: {plan.representationCounts.RAW}
              </span>
            </div>
          </div>
        </div>

        {/* Real Serialized Byte Results & Comparison */}
        <div className="p-3 rounded-lg bg-[#14141A] border border-[#24242F] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
              Real Serialized Byte Measurements
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Binary CP3D vs 3DMEMORY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-gray-500 text-[10px] block">Original .3dmemory:</span>
              <strong className="text-white font-mono text-base block mt-0.5">
                {measurement.original3dBytes} B
              </strong>
              <span className="text-[9px] text-gray-500">Canonical JSON Format</span>
            </div>

            <div className="p-2.5 rounded bg-[#0F0F14] border border-[#1E1E28]">
              <span className="text-gray-500 text-[10px] block">Compact .compact3d:</span>
              <strong className="text-cyan-400 font-mono text-base block mt-0.5">
                {measurement.compact3dBytes} B
              </strong>
              <span className="text-[9px] text-gray-500">Binary Serialization</span>
            </div>
          </div>

          {/* Byte Sub-Component Breakdown */}
          <div className="p-2 rounded bg-[#0F0F14] border border-[#1E1E28] space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Metadata (Headers + Tables):</span>
              <span className="text-white font-mono">{measurement.metadataBytes} B</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Rule Records Payload:</span>
              <span className="text-cyan-300 font-mono">{measurement.ruleBytes} B</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">RAW Fallback Payload:</span>
              <span className="text-amber-300 font-mono">{measurement.rawFallbackBytes} B</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1E1E28] font-bold">
              <span className="text-gray-300">Total Encoded Bytes:</span>
              <span className="text-white font-mono">{measurement.totalEncodedBytes} B</span>
            </div>
          </div>

          {/* Savings Verdict */}
          <div className="p-2.5 rounded bg-[#101017] border border-[#242432] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block">Net Footprint Delta:</span>
              <span
                className={`text-sm font-bold font-mono ${
                  measurement.isActualCompressionAchieved ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                {measurement.sizeDifference > 0
                  ? `-${measurement.sizeDifference} B`
                  : `+${Math.abs(measurement.sizeDifference)} B`}{' '}
                <span className="text-[10px] font-normal">
                  (Ratio: {measurement.sizeRatio}x)
                </span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Actual Savings:</span>
              <span
                className={`text-sm font-bold font-mono ${
                  measurement.actualSavingsBytes > 0 ? 'text-emerald-400' : 'text-gray-400'
                }`}
              >
                {measurement.actualSavingsBytes} B ({measurement.actualSavingsPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Plan Segments List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
              Encoding Plan Segments ({filteredSegments.length})
            </span>

            <div className="flex items-center gap-1.5">
              {/* Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="bg-[#121217] border border-[#24242F] text-gray-300 text-[10px] rounded px-2 py-0.5 outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="SPATIAL_RUN">Spatial Runs</option>
                <option value="REPETITION">Repetitions</option>
                <option value="CLUSTER">Clusters</option>
                <option value="REPEATED_SHAPE">Shapes</option>
                <option value="SEQUENCE_PATH">Paths</option>
                <option value="RAW">RAW Segments</option>
              </select>

              {/* Block Filter */}
              {plan.totalBlocks > 1 && (
                <select
                  value={selectedBlockFilter}
                  onChange={(e) =>
                    setSelectedBlockFilter(
                      e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10)
                    )
                  }
                  className="bg-[#121217] border border-[#24242F] text-gray-300 text-[10px] rounded px-2 py-0.5 outline-none cursor-pointer"
                >
                  <option value="ALL">All Blocks</option>
                  {plan.blocks.map((b) => (
                    <option key={b.blockId} value={b.blockId}>
                      Block {b.blockId}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {filteredSegments.map((seg) => {
              const isSelected = selectedSegment?.segmentId === seg.segmentId;
              const typeColor =
                seg.type === 'SPATIAL_RUN'
                  ? 'border-cyan-500/60 bg-cyan-950/20 text-cyan-300'
                  : seg.type === 'REPETITION'
                  ? 'border-purple-500/60 bg-purple-950/20 text-purple-300'
                  : seg.type === 'CLUSTER'
                  ? 'border-amber-500/60 bg-amber-950/20 text-amber-300'
                  : seg.type === 'REPEATED_SHAPE'
                  ? 'border-pink-500/60 bg-pink-950/20 text-pink-300'
                  : seg.type === 'SEQUENCE_PATH'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/40 text-slate-300';

              return (
                <div
                  key={seg.segmentId}
                  onClick={() => onSelectSegment(isSelected ? null : seg)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 bg-[#161622] border-cyan-400'
                      : `${typeColor} hover:border-gray-500 bg-[#101015]`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          seg.isRule
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {seg.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        Block {seg.blockId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-white font-bold">{seg.serializedBytes} B</span>
                      {seg.netSavingsBytes > 0 && (
                        <span className="text-emerald-400 font-bold">
                          (-{seg.netSavingsBytes} B)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-300 break-all">
                    {seg.ruleSyntax}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 pt-1 border-t border-[#1C1C24]">
                    <span>
                      Covered: <strong className="text-gray-300">{seg.cells.length} cells</strong> (
                      #{seg.cells[0]}..#{seg.cells[seg.cells.length - 1]})
                    </span>
                    <span>
                      RAW Equivalent: <strong className="text-gray-400">{seg.rawEquivalentBytes} B</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspect Compact Artifact Modal / Drawer */}
      {showArtifactModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-cyan-500/40 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#222228] bg-[#121217] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Compact 3D Artifact (.compact3d / Binary CP3D)
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Deterministic research representation output
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCompactArtifact}
                  className="px-2.5 py-1 rounded bg-[#1C1C24] hover:bg-[#252532] text-gray-300 hover:text-white border border-[#2D2D3A] transition-all flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download .compact3d</span>
                </button>
                <button
                  onClick={handleDownloadBinaryFile}
                  className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-black" />
                  <span>Download .cp3d Binary</span>
                </button>
                <button
                  onClick={() => setShowArtifactModal(false)}
                  className="px-2 py-1 rounded text-gray-400 hover:text-white bg-[#1A1A22] hover:bg-[#252532] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-[#222228] bg-[#14141A] px-4 py-1.5 gap-2 text-xs">
              <button
                onClick={() => setActiveArtifactTab('JSON')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeArtifactTab === 'JSON'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                JSON Artifact (.compact3d)
              </button>
              <button
                onClick={() => setActiveArtifactTab('HEX')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeArtifactTab === 'HEX'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Binary Hex Dump ({binaryBuffer.length} B)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-gray-300 bg-[#09090C] custom-scrollbar">
              {activeArtifactTab === 'JSON' && (
                <pre className="text-[11px] text-gray-200 select-all leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(artifact, null, 2)}
                </pre>
              )}

              {activeArtifactTab === 'HEX' && (
                <div className="space-y-3">
                  <div className="p-3 rounded bg-[#101016] border border-[#20202C] text-[11px] space-y-1">
                    <div className="text-cyan-400 font-bold">
                      Binary Header [Magic=CP3D (4B), Ver=1 (1B), Flags (1B), Blocks={plan.totalBlocks} (2B), Records={plan.totalSegmentsCount} (2B), Checksum={measurement.logicalChecksum}]
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      Total Binary Size: <strong className="text-white">{binaryBuffer.length} Bytes</strong>
                    </div>
                  </div>

                  <pre className="text-[11px] text-purple-300 select-all leading-relaxed whitespace-pre-wrap font-mono p-3 rounded bg-[#101016] border border-[#20202C]">
                    {hexDump}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
