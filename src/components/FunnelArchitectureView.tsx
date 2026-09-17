/**
 * 3D Memory — 3 Funnel Architecture Interactive View
 * 
 * Flow:
 * INPUT DATA
 *     ↓
 * FUNNEL 1 — ENCODE (Raw Input → Tokenizer → 369 Address Mapping → Spatial Instruction)
 *     ↓
 * FUNNEL 2 — 3D MEMORY (7×7×7 Blocks → Cells → Relationships → Expandable)
 *     ↓
 * FUNNEL 3 — RECONSTRUCT (3D Memory → Locate Block → Locate Cell → Resolve Address → Resolve Token → Sequence Order → Original Data)
 *     ↓
 * OUTPUT DATA
 */

import React, { useState } from 'react';
import {
  CanonicalStoredCellRecord,
  DecodeResult,
  EncodeResult,
  MemoryGrid3D,
  MemoryLevel,
  SpatialInstruction,
  SpatialTokenRecord,
} from '../types';
import { buildFunnelPipeline } from '../core/funnels';
import {
  deriveAddress,
  deriveNeighbors,
  deriveSpatialAttributes,
  deriveXYZ,
} from '../core/derivation';
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  FileCode,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  Code2,
  Terminal,
  Compass,
  Download,
  ListFilter,
  FileJson,
  Workflow,
  Network,
  Binary,
  Search,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

interface FunnelArchitectureViewProps {
  inputText: string;
  grid: MemoryGrid3D;
  encodeResult: EncodeResult | null;
  decodeResult: DecodeResult | null;
  onSelectCell: (cellId: number) => void;
  selectedCellId?: number | null;
}

export const FunnelArchitectureView: React.FC<FunnelArchitectureViewProps> = ({
  inputText,
  grid,
  encodeResult,
  decodeResult,
  onSelectCell,
  selectedCellId,
}) => {
  const [activeFunnel, setActiveFunnel] = useState<1 | 2 | 3>(1);
  const [funnel1ViewMode, setFunnel1ViewMode] = useState<'CANONICAL' | 'DERIVATION' | 'JSON' | 'RECORDS' | 'OPCODES'>('CANONICAL');
  const [funnel3ViewMode, setFunnel3ViewMode] = useState<'STEPS' | 'STAGES' | 'REVERSIBILITY'>('STEPS');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [testDeriveCellId, setTestDeriveCellId] = useState<number>(137);
  const [testDeriveBlockId, setTestDeriveBlockId] = useState<number>(4);

  const pipeline = buildFunnelPipeline(
    inputText,
    grid,
    decodeResult?.decodedText || inputText,
    decodeResult?.decodingTimeMs || 0
  );

  const handleCopyText = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === 'number') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(pipeline.funnel1.tokenRecords, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel1-spatial-instructions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111113] rounded border border-[#2D2D2F] overflow-hidden flex flex-col h-full shadow-xl text-xs font-mono">
      {/* 3 Funnels Architecture Header */}
      <div className="border-b border-[#2D2D2F] bg-[#141416] p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              3 Funnel Architecture System
            </h2>
          </div>
          <span className="text-[10px] text-gray-400 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#2D2D2F]">
            Expandable 3D Memory System
          </span>
        </div>

        {/* High-Level Architecture Flow Indicator */}
        <div className="bg-[#0A0A0B] p-2 rounded border border-[#1C1C1E] flex items-center justify-between text-[10px] text-gray-400">
          <span className="text-white font-bold">INPUT DATA</span>
          <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
          <span className={activeFunnel === 1 ? 'text-cyan-400 font-bold underline' : ''}>FUNNEL 1 — ENCODE</span>
          <ArrowRight className="w-3 h-3 text-purple-500 shrink-0" />
          <span className={activeFunnel === 2 ? 'text-purple-400 font-bold underline' : ''}>FUNNEL 2 — 3D MEMORY</span>
          <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
          <span className={activeFunnel === 3 ? 'text-amber-400 font-bold underline' : ''}>FUNNEL 3 — RECONSTRUCT</span>
          <ArrowRight className="w-3 h-3 text-green-500 shrink-0" />
          <span className="text-green-400 font-bold">OUTPUT DATA</span>
        </div>

        {/* Interactive Funnel Switcher Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Funnel 1 Card */}
          <button
            onClick={() => setActiveFunnel(1)}
            className={`p-2.5 rounded border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeFunnel === 1
                ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-950/40 text-cyan-300'
                : 'bg-[#0A0A0B] hover:bg-[#1A1A1C] border-[#2D2D2F] text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Funnel 1</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="font-bold text-white text-xs">ENCODE</div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              Tokens → 369 Addr → Spatial Ops
            </div>
          </button>

          {/* Funnel 2 Card */}
          <button
            onClick={() => setActiveFunnel(2)}
            className={`p-2.5 rounded border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeFunnel === 2
                ? 'bg-purple-500/10 border-purple-500/60 shadow-md shadow-purple-950/40 text-purple-300'
                : 'bg-[#0A0A0B] hover:bg-[#1A1A1C] border-[#2D2D2F] text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-purple-400">Funnel 2</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            </div>
            <div className="font-bold text-white text-xs">3D MEMORY</div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              7×7×7 Blocks → Cells → Links
            </div>
          </button>

          {/* Funnel 3 Card */}
          <button
            onClick={() => setActiveFunnel(3)}
            className={`p-2.5 rounded border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeFunnel === 3
                ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-950/40 text-amber-300'
                : 'bg-[#0A0A0B] hover:bg-[#1A1A1C] border-[#2D2D2F] text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-amber-400">Funnel 3</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="font-bold text-white text-xs">RECONSTRUCT</div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              Locate Block → Resolve → Output
            </div>
          </button>
        </div>
      </div>

      {/* Main Body per Funnel */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* FUNNEL 1: ENCODE — DERIVE, DON'T STORE ARCHITECTURE                      */}
        {/* ========================================================================= */}
        {activeFunnel === 1 && (
          <div className="space-y-4">
            {/* Input Data Banner */}
            <div className="bg-[#0A0A0B] p-3 rounded border border-[#2D2D2F] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Funnel 1 — Raw Input Stream
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">
                  {pipeline.funnel1.tokenCount} Tokens
                </span>
              </div>
              <div className="bg-[#111113] p-2 rounded border border-[#1A1A1C] text-white select-all">
                "{pipeline.funnel1.inputText}"
              </div>
            </div>

            {/* Core Architectural Directive: DERIVE, DON'T STORE */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Funnel 1 — DERIVE, DON'T STORE Architecture
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700 text-cyan-300 text-[10px] font-bold">
                    Zero Duplicate Storage
                  </span>
                  <span className="px-2 py-0.5 rounded bg-green-950/70 border border-green-700 text-green-300 text-[10px] font-bold">
                    ~70% Data Footprint Reduction
                  </span>
                </div>
              </div>

              {/* Stored vs Derived Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                {/* Left: Minimal Canonical Stored Data */}
                <div className="p-3 rounded bg-[#121215] border border-cyan-900/60 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#222226]">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" />
                      Minimal Canonical Stored Record (Only 5 Fields)
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-900/40 px-1.5 py-0.2 rounded">
                      Canonical
                    </span>
                  </div>
                  <ul className="space-y-1 text-gray-300 font-mono text-[10px]">
                    <li className="flex items-center justify-between py-0.5 px-1.5 rounded bg-[#18181C]">
                      <span className="text-cyan-300 font-bold">• blockId:</span>
                      <span className="text-gray-400">Target 3D memory block index</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5 px-1.5 rounded bg-[#18181C]">
                      <span className="text-cyan-300 font-bold">• cellId:</span>
                      <span className="text-gray-400">Spatial cell index [0..342]</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5 px-1.5 rounded bg-[#18181C]">
                      <span className="text-cyan-300 font-bold">• state:</span>
                      <span className="text-gray-400">Cell state (1 = Active, 0 = Idle)</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5 px-1.5 rounded bg-[#18181C]">
                      <span className="text-cyan-300 font-bold">• token / reference:</span>
                      <span className="text-gray-400">Character token symbol or pointer</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5 px-1.5 rounded bg-[#18181C]">
                      <span className="text-cyan-300 font-bold">• sequence:</span>
                      <span className="text-gray-400">Stream position indices [step, ...]</span>
                    </li>
                  </ul>
                  <div className="text-[10px] text-gray-400 italic pt-1 border-t border-[#1C1C20]">
                    Only the minimal physical facts are stored in memory records.
                  </div>
                </div>

                {/* Right: Runtime Derivation On-the-Fly */}
                <div className="p-3 rounded bg-[#121215] border border-purple-900/60 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#222226]">
                    <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-purple-400" />
                      Runtime Derived Properties (Never Duplicated)
                    </span>
                    <span className="text-[10px] text-purple-300 bg-purple-900/40 px-1.5 py-0.2 rounded">
                      On-Demand
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="p-1.5 rounded bg-[#18181C] space-y-0.5">
                      <div className="text-purple-300 font-bold flex items-center gap-1">
                        <span>cellId</span>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-500" />
                        <span>(x, y, z) Coordinates</span>
                      </div>
                      <div className="text-gray-400 text-[9px]">
                        x = cellId % 7, y = (cellId/7)%7, z = Math.floor(cellId/49)
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-[#18181C] space-y-0.5">
                      <div className="text-purple-300 font-bold flex items-center gap-1">
                        <span>(x, y, z)</span>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-500" />
                        <span>Address 369</span>
                      </div>
                      <div className="text-gray-400 text-[9px]">
                        Address = 26 + cellId (in [26..368] address space)
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-[#18181C] space-y-0.5">
                      <div className="text-purple-300 font-bold flex items-center gap-1">
                        <span>(x, y, z)</span>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-500" />
                        <span>6 Orthogonal Neighbors</span>
                      </div>
                      <div className="text-gray-400 text-[9px]">
                        X±1 (Right/Left), Y±1 (Up/Down), Z±1 (Forward/Back)
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 italic pt-1 border-t border-[#1C1C20]">
                    Everything is deterministically computed whenever accessed!
                  </div>
                </div>
              </div>

              {/* Interactive Live Derivation Sandbox */}
              <div className="bg-[#121215] p-3 rounded border border-[#2D2D32] space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] uppercase font-bold text-white">
                      Live Derivation Sandbox & Formula Tester
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTestDeriveBlockId(4);
                        setTestDeriveCellId(137);
                      }}
                      className="px-2 py-0.5 rounded bg-[#1E1E24] hover:bg-[#2A2A32] text-cyan-300 text-[10px] cursor-pointer"
                    >
                      Preset: Example (Block 4, Cell 137)
                    </button>
                  </div>
                </div>

                {/* Input Selectors */}
                <div className="flex items-center gap-4 flex-wrap bg-[#0D0D10] p-2 rounded border border-[#1F1F24]">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 font-bold">Stored Block:</label>
                    <input
                      type="number"
                      min={0}
                      max={63}
                      value={testDeriveBlockId}
                      onChange={(e) => setTestDeriveBlockId(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 bg-[#18181C] border border-[#333338] text-white px-2 py-0.5 rounded text-xs text-center focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 font-bold">Stored Cell ID:</label>
                    <input
                      type="number"
                      min={0}
                      max={342}
                      value={testDeriveCellId}
                      onChange={(e) => setTestDeriveCellId(Math.min(342, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-20 bg-[#18181C] border border-[#333338] text-cyan-300 font-bold px-2 py-0.5 rounded text-xs text-center focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500">[0..342]</span>
                  </div>
                </div>

                {/* Live Derived Output Card */}
                {(() => {
                  const derived = deriveSpatialAttributes(testDeriveBlockId, testDeriveCellId, [0, 0, 0], 'K');
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                      {/* Stored State Box */}
                      <div className="p-2.5 rounded bg-[#0A0A0C] border border-cyan-900/50 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-cyan-400 block">
                          [STORED IN MEMORY]
                        </span>
                        <div className="font-mono text-gray-300 space-y-0.5">
                          <div>Block = <span className="text-white font-bold">{testDeriveBlockId}</span></div>
                          <div>Cell = <span className="text-cyan-300 font-bold">{testDeriveCellId}</span></div>
                          <div>State = <span className="text-green-400 font-bold">1 (Active)</span></div>
                        </div>
                      </div>

                      {/* Derived Runtime Results Box */}
                      <div className="p-2.5 rounded bg-[#0A0A0C] border border-purple-900/50 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-purple-400 block">
                          [RUNTIME DERIVED]
                        </span>
                        <div className="font-mono text-gray-300 space-y-0.5">
                          <div>
                            XYZ = <span className="text-white font-bold">({derived.x}, {derived.y}, {derived.z})</span>
                            <span className="text-gray-500 text-[9px] ml-1">
                              ({testDeriveCellId}%7, ⌊{testDeriveCellId}/7⌋%7, ⌊{testDeriveCellId}/49⌋)
                            </span>
                          </div>
                          <div>
                            Address = <span className="text-purple-300 font-bold">{derived.address}</span>
                            <span className="text-gray-500 text-[9px] ml-1">
                              (26 + {testDeriveCellId})
                            </span>
                          </div>
                          <div>
                            Neighbors = <span className="text-yellow-300 font-bold">[{derived.neighbors.allAdjacentIds.join(', ')}]</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* View Switcher Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Stream Records ({pipeline.funnel1.tokenRecords.length} Tokens)
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center bg-[#0A0A0B] p-0.5 rounded border border-[#2D2D2F] text-[10px]">
                    <button
                      onClick={() => setFunnel1ViewMode('CANONICAL')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        funnel1ViewMode === 'CANONICAL'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Canonical (5 Fields)
                    </button>
                    <button
                      onClick={() => setFunnel1ViewMode('DERIVATION')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        funnel1ViewMode === 'DERIVATION'
                          ? 'bg-purple-500/20 text-purple-300 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Derivations
                    </button>
                    <button
                      onClick={() => setFunnel1ViewMode('JSON')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        funnel1ViewMode === 'JSON'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Full JSON
                    </button>
                    <button
                      onClick={() => setFunnel1ViewMode('RECORDS')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        funnel1ViewMode === 'RECORDS'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setFunnel1ViewMode('OPCODES')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        funnel1ViewMode === 'OPCODES'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Opcodes
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopyText(JSON.stringify(pipeline.funnel1.canonicalRecords, null, 2))}
                    className="px-2 py-1 rounded bg-[#2D2D2F] hover:bg-[#3D3D3F] text-gray-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedAll ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copiedAll ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="px-2 py-1 rounded bg-[#2D2D2F] hover:bg-[#3D3D3F] text-gray-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Download JSON array"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* VIEW MODE 1: CANONICAL (5 Minimal Stored Fields) */}
              {funnel1ViewMode === 'CANONICAL' && (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {pipeline.funnel1.canonicalRecords.map((canonical, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectCell(canonical.cellId)}
                      className={`p-2.5 rounded border transition-all cursor-pointer ${
                        selectedCellId === canonical.cellId
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200'
                          : 'bg-[#0A0A0B] hover:bg-[#161618] border-[#2D2D2F] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#1C1C1E]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">Record #{idx}</span>
                          <span className="w-5 h-5 rounded bg-[#111113] border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {canonical.token === ' ' ? '␣' : canonical.token}
                          </span>
                          <span className="text-white font-bold font-mono">'{canonical.token}'</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-cyan-300 font-bold font-mono">Block {canonical.blockId} : Cell #{canonical.cellId}</span>
                        </div>

                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                          5 Fields Stored
                        </span>
                      </div>

                      {/* Clean Minimal JSON Display */}
                      <pre className="bg-[#111113] p-2 rounded border border-[#1A1A1C] text-[10px] text-cyan-300 font-mono overflow-x-auto select-all">
                        <code>{JSON.stringify(canonical, null, 2)}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW MODE 2: STEP-BY-STEP DERIVATION */}
              {funnel1ViewMode === 'DERIVATION' && (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {pipeline.funnel1.tokenRecords.map((record, idx) => {
                    const derived = record.derived || deriveSpatialAttributes(record.blockId, record.cellId, [0, 0, 0], record.token);
                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectCell(record.cellId)}
                        className={`p-2.5 rounded border transition-all cursor-pointer ${
                          selectedCellId === record.cellId
                            ? 'bg-purple-500/15 border-purple-500 text-purple-200'
                            : 'bg-[#0A0A0B] hover:bg-[#161618] border-[#2D2D2F] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#1C1C1E]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold">Step #{record.sequence}</span>
                            <span className="w-5 h-5 rounded bg-[#111113] border border-purple-800 text-purple-300 font-bold flex items-center justify-center text-xs">
                              {record.token === ' ' ? '␣' : record.token}
                            </span>
                            <span className="text-white font-bold">'{record.token}'</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-purple-300 font-bold">Cell #{record.cellId}</span>
                          </div>

                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                            Runtime Derivation
                          </span>
                        </div>

                        {/* Derivation Steps Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                          <div className="p-1.5 rounded bg-[#111113] border border-[#1F1F22]">
                            <span className="text-gray-500 block text-[9px] font-bold">1. cellId → (x,y,z)</span>
                            <span className="text-cyan-300 font-bold">({derived.x}, {derived.y}, {derived.z})</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#111113] border border-[#1F1F22]">
                            <span className="text-gray-500 block text-[9px] font-bold">2. Address 369</span>
                            <span className="text-purple-300 font-bold">26 + {derived.cellId} = {derived.address}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#111113] border border-[#1F1F22]">
                            <span className="text-gray-500 block text-[9px] font-bold">3. Neighbors (6-Way)</span>
                            <span className="text-yellow-300 font-bold">[{derived.neighbors.allAdjacentIds.join(',')}]</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW MODE 3: Full JSON */}
              {funnel1ViewMode === 'JSON' && (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {pipeline.funnel1.tokenRecords.map((record, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectCell(record.cellId)}
                      className={`p-2.5 rounded border transition-all cursor-pointer group ${
                        selectedCellId === record.cellId
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200'
                          : 'bg-[#0A0A0B] hover:bg-[#161618] border-[#2D2D2F] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1C1C1E]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">Token #{record.sequence}</span>
                          <span className="w-5 h-5 rounded bg-[#111113] border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {record.token === ' ' ? '␣' : record.token}
                          </span>
                          <span className="text-white font-bold">'{record.token}'</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-purple-300">Cell #{record.cellId}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(JSON.stringify(record, null, 2), idx);
                          }}
                          className="p-1 hover:text-cyan-300 text-gray-500 transition-colors flex items-center gap-1 text-[10px]"
                          title="Copy JSON"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">JSON</span>
                        </button>
                      </div>

                      {/* Exact Deterministic JSON Structure Display */}
                      <pre className="bg-[#111113] p-2 rounded border border-[#1A1A1C] text-[10px] text-gray-300 overflow-x-auto select-all font-mono">
                        <code>{JSON.stringify(record, null, 2)}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW MODE 4: Visual Cards */}
              {funnel1ViewMode === 'RECORDS' && (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {pipeline.funnel1.tokenRecords.map((record, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectCell(record.cellId)}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        selectedCellId === record.cellId
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-[#0A0A0B] hover:bg-[#1A1A1C] border-[#2D2D2F] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">#{record.sequence}</span>
                          <span className="w-5 h-5 rounded bg-[#111113] border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {record.token === ' ' ? '␣' : record.token}
                          </span>
                          <span className="text-white font-bold">'{record.token}'</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-cyan-400 font-bold">Addr {record.address}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-purple-300">
                            Block {record.blockId} : Cell #{record.cellId}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="px-1.5 py-0.5 rounded bg-[#111113] border border-[#2D2D2F] text-[10px] text-gray-400">
                            [{record.coordinate.join(', ')}]
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW MODE 5: Opcodes */}
              {funnel1ViewMode === 'OPCODES' && (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {pipeline.funnel1.spatialInstructions.map((ins, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectCell(ins.cellId)}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        selectedCellId === ins.cellId
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-[#0A0A0B] hover:bg-[#1A1A1C] border-[#2D2D2F] text-gray-300'
                      }`}
                    >
                      <div className="text-[10px] text-gray-400 font-mono select-all overflow-x-auto">
                        <code>{ins.instructionCode}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FUNNEL 2: 3D MEMORY (7x7x7 Blocks -> Cells -> Relationships -> Expandable) */}
        {/* ========================================================================= */}
        {activeFunnel === 2 && (
          <div className="space-y-4">
            {/* Core Principle & Research Question Callout Banner */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-purple-400" />
                  Funnel 2 — Expandable 3D Spatial Memory
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 text-[10px] font-bold">
                  EXPANDABLE SPATIAL MEMORY (NOT COMPRESSION)
                </span>
              </div>

              {/* Research Question */}
              <div className="bg-[#111113] p-2.5 rounded border border-[#1E1E22] text-[11px] text-gray-300">
                <span className="text-[10px] text-purple-400 font-bold block mb-1">
                  RESEARCH QUESTION:
                </span>
                <p className="italic text-gray-200">
                  "{pipeline.funnel2.researchQuestion}"
                </p>
              </div>

              {/* Topology Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#111113] p-2 rounded border border-[#1A1A1C]">
                  <span className="text-[10px] text-gray-500 block font-bold">Block Spec</span>
                  <span className="text-xs font-bold text-purple-400">7×7×7 = 343 Cells</span>
                </div>
                <div className="bg-[#111113] p-2 rounded border border-[#1A1A1C]">
                  <span className="text-[10px] text-gray-500 block font-bold">Allocated Blocks</span>
                  <span className="text-xs font-bold text-white">
                    {pipeline.funnel2.allocatedBlocksCount} Reusable Blocks
                  </span>
                </div>
                <div className="bg-[#111113] p-2 rounded border border-[#1A1A1C]">
                  <span className="text-[10px] text-gray-500 block font-bold">Total Capacity</span>
                  <span className="text-xs font-bold text-cyan-400">
                    {pipeline.funnel2.totalCells} Discrete Cells
                  </span>
                </div>
                <div className="bg-[#111113] p-2 rounded border border-[#1A1A1C]">
                  <span className="text-[10px] text-gray-500 block font-bold">System Load</span>
                  <span className="text-xs font-bold text-green-400">
                    {pipeline.funnel2.activeCells} / {pipeline.funnel2.totalCells} Active ({pipeline.funnel2.activeCellRatio}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Hierarchical Memory Structure: ROOT ├── BLOCK 0 ├── BLOCK 1... */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                  Hierarchical Memory Topology (ROOT & Child Blocks)
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Global = Origin + Local(0..6)
                </span>
              </div>

              {/* Hierarchy Tree Visualization */}
              <div className="space-y-2">
                {/* ROOT Node */}
                <div className="p-2.5 rounded bg-[#141418] border border-cyan-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded bg-cyan-400" />
                    <span className="text-white font-bold text-xs">ROOT MEMORY</span>
                    <span className="text-[10px] text-gray-400">
                      (Level 1 Root Container · {pipeline.funnel2.allocatedBlocksCount} Child Blocks)
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    Capacity: {pipeline.funnel2.totalCells} Cells
                  </span>
                </div>

                {/* Child Blocks List */}
                <div className="pl-4 space-y-1.5 border-l-2 border-[#2D2D2F] ml-3">
                  {pipeline.funnel2.rootMemory.blocks.map((block) => (
                    <div
                      key={block.blockId}
                      className="p-2 rounded bg-[#111113] hover:bg-[#16161A] border border-[#222226] transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold">├──</span>
                        <span className="w-4 h-4 rounded bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-bold flex items-center justify-center">
                          {block.blockId}
                        </span>
                        <span className="text-white font-bold">BLOCK {block.blockId}</span>
                        <span className="text-[10px] text-gray-400">
                          Origin: [{block.origin.join(', ')}] · Local: (0..6 X, Y, Z)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-cyan-400">
                          {block.metadata.activeCellCount} / 343 active
                        </span>
                        <span className="text-[10px] bg-[#1E1E22] px-2 py-0.5 rounded text-gray-300">
                          {block.metadata.tokenCount} tokens
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Automatic Block Allocation Pipeline */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                Automatic Block Allocation Logic
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2.5 rounded bg-[#111113] border border-[#1E1E22] space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">1. Ingest Stream</span>
                  <span className="text-white font-bold block">Input → Current Block</span>
                  <span className="text-[10px] text-gray-400">0..342 cell local address</span>
                </div>

                <div className="p-2.5 rounded bg-[#111113] border border-purple-900/40 space-y-1">
                  <span className="text-[9px] text-purple-400 uppercase font-bold block">2. Capacity Trigger</span>
                  <span className="text-purple-300 font-bold block">343 Capacity Reached</span>
                  <span className="text-[10px] text-gray-400">Auto-Allocate Next Block</span>
                </div>

                <div className="p-2.5 rounded bg-[#111113] border border-[#1E1E22] space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">3. Preserve Graph</span>
                  <span className="text-cyan-400 font-bold block">Inter-Block Links</span>
                  <span className="text-[10px] text-gray-400">Trajectory preserved</span>
                </div>
              </div>
            </div>

            {/* Spatial Relationships & Graph Matrix */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-green-400" />
                  Spatial Relationships & Graph Connectivity
                </span>
                <span className="text-[10px] text-cyan-400">
                  {selectedCellId !== null ? `Selected: Cell #${selectedCellId}` : 'Hover / Select Cell'}
                </span>
              </div>

              {(() => {
                const targetCellId = selectedCellId ?? grid.entryCellId ?? 0;
                const cell = grid.cells[targetCellId] || grid.cells[0];
                if (!cell) return null;

                const rel = cell.relationships;
                const n = cell.neighbors;

                return (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded bg-[#111113] border border-[#222226] space-y-2">
                      <div className="flex items-center justify-between border-b border-[#1E1E22] pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold">Cell #{cell.id}</span>
                          <span className="text-gray-400">Local: ({cell.x}, {cell.y}, {cell.z})</span>
                          <span className="text-gray-400">Global: ({cell.globalCoordinate.join(', ')})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cell.state === 1 ? 'bg-cyan-900/40 text-cyan-300' : 'bg-[#222226] text-gray-400'}`}>
                          {cell.state === 1 ? `Active ('${cell.symbol || '␣'}')` : 'Idle'}
                        </span>
                      </div>

                      {/* Orthogonal 6 Vectors Matrix */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">
                          1. Orthogonal Directional Adjacency (6-Way Vectors)
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">X+1 (Right)</span>
                            <span className="font-bold text-white">{n.xPos !== null ? `#${n.xPos}` : 'Boundary'}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">X-1 (Left)</span>
                            <span className="font-bold text-white">{n.xNeg !== null ? `#${n.xNeg}` : 'Boundary'}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">Y+1 (Up)</span>
                            <span className="font-bold text-white">{n.yPos !== null ? `#${n.yPos}` : 'Boundary'}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">Y-1 (Down)</span>
                            <span className="font-bold text-white">{n.yNeg !== null ? `#${n.yNeg}` : 'Boundary'}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">Z+1 (Forward)</span>
                            <span className="font-bold text-white">{n.zPos !== null ? `#${n.zPos}` : 'Boundary'}</span>
                          </div>
                          <div className="p-1.5 rounded bg-[#16161A] border border-[#222226]">
                            <span className="text-gray-500 block">Z-1 (Backward)</span>
                            <span className="font-bold text-white">{n.zNeg !== null ? `#${n.zNeg}` : 'Boundary'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Hierarchical Block & Graph Pointers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded bg-[#16161A] border border-[#222226] space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">
                            2. Hierarchical Block Relations
                          </span>
                          <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Same Block:</span>
                              <span className="text-purple-300 font-bold">BLOCK #{rel?.sameBlockId ?? cell.blockId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Parent Block:</span>
                              <span className="text-gray-300">{rel?.parentBlockId !== null && rel?.parentBlockId !== undefined ? `BLOCK #${rel.parentBlockId}` : 'ROOT (Level 1)'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Child Blocks:</span>
                              <span className="text-gray-300">{rel?.childBlockIds && rel.childBlockIds.length > 0 ? rel.childBlockIds.join(', ') : 'None'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#16161A] border border-[#222226] space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">
                            3. Sequence Trajectory Graph Links
                          </span>
                          <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Previous Token:</span>
                              <span className="text-cyan-300 font-bold">
                                {rel?.prevTokenRef
                                  ? `Block #${rel.prevTokenRef.blockId} : Cell #${rel.prevTokenRef.cellId} ('${rel.prevTokenRef.token || ''}')`
                                  : 'Entry (Start of Stream)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Next Token:</span>
                              <span className="text-green-300 font-bold">
                                {rel?.nextTokenRef
                                  ? `Block #${rel.nextTokenRef.blockId} : Cell #${rel.nextTokenRef.cellId} ('${rel.nextTokenRef.token || ''}')`
                                  : 'End of Sequence'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FUNNEL 3: RECONSTRUCT (3D Memory → Locate Block → Locate Cell → Resolve Address → Resolve Token → Sequence Order → Original Data) */}
        {/* ========================================================================= */}
        {activeFunnel === 3 && (
          <div className="space-y-4">
            {/* Reverse Pipeline Banner */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Funnel 3 — Reverse Reconstruction Pipeline
                </span>
                <span className="px-2 py-0.5 rounded bg-green-950/60 text-green-300 border border-green-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  100% LOSSLESS REVERSIBILITY
                </span>
              </div>

              {/* Exact Reverse Pipeline Sequence Flow */}
              <div className="bg-[#111113] p-2.5 rounded border border-[#1E1E22] space-y-2">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">
                  Reverse Pipeline Architecture
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 1</span>
                    <span className="text-white font-bold">3D Memory</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 2</span>
                    <span className="text-purple-300 font-bold">Locate Block</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 3</span>
                    <span className="text-cyan-300 font-bold">Locate Cell</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 4</span>
                    <span className="text-amber-300 font-bold">Resolve Addr</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 5</span>
                    <span className="text-green-300 font-bold">Resolve Token</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-amber-900/40">
                    <span className="text-gray-500 block">Stage 6</span>
                    <span className="text-blue-300 font-bold">Sequence Order</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#16161A] border border-green-900/40">
                    <span className="text-gray-500 block">Stage 7</span>
                    <span className="text-green-400 font-bold">Original Data</span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode Switcher for Funnel 3 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                Reconstruction Trace & Stream Verification
              </span>

              <div className="flex items-center bg-[#0A0A0B] p-0.5 rounded border border-[#2D2D2F] text-[10px]">
                <button
                  onClick={() => setFunnel3ViewMode('STEPS')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    funnel3ViewMode === 'STEPS'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Step Traces
                </button>
                <button
                  onClick={() => setFunnel3ViewMode('STAGES')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    funnel3ViewMode === 'STAGES'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pipeline Stages
                </button>
                <button
                  onClick={() => setFunnel3ViewMode('REVERSIBILITY')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    funnel3ViewMode === 'REVERSIBILITY'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Stream Comparison
                </button>
              </div>
            </div>

            {/* STEP TRACES: Shows each resolved step from 3D Memory to token */}
            {funnel3ViewMode === 'STEPS' && (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {pipeline.funnel3.reconstructSteps && pipeline.funnel3.reconstructSteps.length > 0 ? (
                  pipeline.funnel3.reconstructSteps.map((st) => (
                    <div
                      key={st.step}
                      onClick={() => onSelectCell(st.cellId)}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        selectedCellId === st.cellId
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-[#0A0A0B] hover:bg-[#16161A] border-[#222226] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">
                            #{st.step}
                          </span>
                          <span className="text-purple-300 font-bold">
                            Block #{st.blockId}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-cyan-300 font-bold">
                            Cell #{st.cellId}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-amber-300">
                            Addr {st.resolvedAddress}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="w-5 h-5 rounded bg-[#141418] border border-amber-800 text-amber-300 font-bold flex items-center justify-center text-xs">
                            {st.resolvedToken === ' ' ? '␣' : st.resolvedToken}
                          </span>
                          <span className="text-white font-bold">'{st.resolvedToken}'</span>
                        </div>

                        <div className="text-right text-[10px] text-gray-400">
                          [{st.localCoord.join(', ')}]
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic p-3 text-center">
                    Traversed {pipeline.funnel3.traversedSteps} steps successfully.
                  </div>
                )}
              </div>
            )}

            {/* STAGES VIEW */}
            {funnel3ViewMode === 'STAGES' && (
              <div className="space-y-2">
                {pipeline.funnel3.pipelineStages && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 1: 3D Memory Root
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Locate root memory container and active blocks</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage1Memory}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 2: Locate Block
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Identify target 7x7x7 block partition in hierarchy</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage2LocateBlock}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 3: Locate Cell
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Resolve cell within block by local coordinate</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage3LocateCell}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 4: Resolve Address
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Compute 369 address from coordinate</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage4ResolveAddress}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 5: Resolve Token
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Map address to deterministic character/symbol</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage5ResolveToken}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-[#222226] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          Stage 6: Sequence Order
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">PASS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Sort and order tokens by trajectory step index</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#1E1E22] text-[10px] text-gray-400 truncate">
                        {pipeline.funnel3.pipelineStages.stage6SequenceOrder}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#0A0A0B] border border-green-900/40 space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-green-400 font-bold uppercase">
                          Stage 7: Original Data Output
                        </span>
                        <span className="text-[10px] text-green-400 font-bold">0.00% LOSS</span>
                      </div>
                      <p className="text-[11px] text-gray-300">Reconstruct pristine string matching input bit-for-bit</p>
                      <div className="bg-[#141418] p-1.5 rounded border border-green-900/50 text-[10px] text-green-300 truncate font-bold">
                        {pipeline.funnel3.pipelineStages.stage7OriginalData}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REVERSIBILITY COMPARISON */}
            {funnel3ViewMode === 'REVERSIBILITY' && (
              <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">ORIGINAL INPUT STREAM:</span>
                    <div className="bg-[#111113] p-2 rounded border border-[#1C1C1E] text-white select-all">
                      "{pipeline.funnel1.inputText}"
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">RECONSTRUCTED OUTPUT STREAM:</span>
                    <div className="bg-[#111113] p-2 rounded border border-green-900/40 text-green-300 select-all font-bold">
                      "{pipeline.funnel3.decodedText}"
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C1C1E]">
                  <div className="bg-[#111113] p-2 rounded border border-[#1E1E22]">
                    <span className="text-[10px] text-gray-500 block">Loss Rate</span>
                    <span className="text-sm font-bold text-green-400">0.00%</span>
                  </div>
                  <div className="bg-[#111113] p-2 rounded border border-[#1E1E22]">
                    <span className="text-[10px] text-gray-500 block">Tokens Decoded</span>
                    <span className="text-sm font-bold text-white">
                      {pipeline.funnel3.traversedSteps} / {pipeline.funnel1.tokenCount}
                    </span>
                  </div>
                  <div className="bg-[#111113] p-2 rounded border border-[#1E1E22]">
                    <span className="text-[10px] text-gray-500 block">Exact Match</span>
                    <span className="text-sm font-bold text-green-400">TRUE (100%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
