/**
 * Text Encoding & Decoding Test Panel
 * Real-time 369 mapping trace, reversible verification, and PASS/FAIL validation.
 */

import React, { useState } from 'react';
import {
  EncodeResult,
  DecodeResult,
  MemoryGrid3D,
  MemoryLevel,
  MemorySequenceStep,
} from '../types';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Sparkles,
  Layers,
  FileCode,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface EncoderDecoderPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onEncode: (text: string, level: MemoryLevel) => void;
  onDecode: () => void;
  encodeResult: EncodeResult | null;
  decodeResult: DecodeResult | null;
  onSelectCell: (cellId: number) => void;
  currentLevel: MemoryLevel;
  setCurrentLevel: (level: MemoryLevel) => void;
}

const PRESET_TEST_CASES = [
  { label: 'TEST 1: ABC', text: 'ABC' },
  { label: 'TEST 2: HELLO', text: 'HELLO' },
  { label: 'TEST 3: HELLO WORLD', text: 'HELLO WORLD' },
  { label: 'TEST 4: Short Script', text: 'Write a script in reel reading books' },
  {
    label: 'TEST 5: MULTI-BLOCK (360 chars)',
    text:
      'EXPANDABLE SPATIAL MEMORY HIERARCHY TEST: THIS IS A LONGER MULTI-BLOCK EXPERIMENTAL DATA STREAM DESIGNED TO EXCEED THE CAPACITY OF A SINGLE 343-CELL MEMORY BLOCK. AS TOKENS FILL BLOCK 0, THE SYSTEM AUTOMATICALLY ALLOCATES BLOCK 1 AND PRESERVES CONTINUOUS GRAPH-LIKE SPATIAL RELATIONSHIPS ACROSS ADJACENT REUSABLE 3D MEMORY BLOCKS WITH ZERO LOSS.',
  },
];

export const EncoderDecoderPanel: React.FC<EncoderDecoderPanelProps> = ({
  inputText,
  setInputText,
  onEncode,
  onDecode,
  encodeResult,
  decodeResult,
  onSelectCell,
  currentLevel,
  setCurrentLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'ENCODE' | 'TRACE' | 'DECODE'>('ENCODE');

  const handleEncodeClick = () => {
    if (!inputText.trim()) return;
    onEncode(inputText, currentLevel);
    setActiveTab('TRACE');
  };

  const handleDecodeClick = () => {
    onDecode();
    setActiveTab('DECODE');
  };

  return (
    <div className="bg-[#111113] rounded border border-[#2D2D2F] overflow-hidden flex flex-col shadow-xl">
      {/* Panel Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#2D2D2F] bg-[#141416] px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ENCODE')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              activeTab === 'ENCODE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-[#E0E0E0] hover:bg-[#2D2D2F]'
            }`}
          >
            1. Input & Presets
          </button>
          <button
            onClick={() => setActiveTab('TRACE')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              activeTab === 'TRACE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-[#E0E0E0] hover:bg-[#2D2D2F]'
            }`}
          >
            2. 369 Trace ({encodeResult?.steps.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('DECODE')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              activeTab === 'DECODE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-[#E0E0E0] hover:bg-[#2D2D2F]'
            }`}
          >
            3. Verification
          </button>
        </div>

        {/* Target Memory Level */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-gray-500 text-[10px] uppercase font-bold">Level:</span>
          <select
            value={currentLevel}
            onChange={(e) => setCurrentLevel(Number(e.target.value) as MemoryLevel)}
            className="bg-[#0A0A0B] border border-[#2D2D2F] text-cyan-400 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value={1} className="bg-[#141416]">Level 1 (Token/Char)</option>
            <option value={2} className="bg-[#141416]">Level 2 (Cluster)</option>
            <option value={3} className="bg-[#141416]">Level 3 (Context)</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Text Input & Presets */}
      {activeTab === 'ENCODE' && (
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                Input Stream
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                {inputText.length} characters • {new TextEncoder().encode(inputText).length} bytes
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to encode into the 7×7×7 3D memory..."
              rows={3}
              className="w-full bg-[#0A0A0B] border border-[#2D2D2F] rounded p-3 text-xs text-[#E0E0E0] font-mono placeholder:text-gray-600 focus:border-cyan-500 outline-none resize-none transition-all shadow-inner"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2 font-mono">
              Dataset Test Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEST_CASES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(preset.text);
                    onEncode(preset.text, currentLevel);
                  }}
                  className="px-3 py-2 rounded bg-[#0A0A0B] hover:bg-[#1A1A1C] border border-[#2D2D2F] hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                    {preset.label.split(':')[0]}
                  </span>
                  <span className="text-xs text-gray-300 truncate font-mono mt-0.5">
                    "{preset.text}"
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleEncodeClick}
              disabled={!inputText.trim()}
              className="py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs tracking-widest uppercase rounded shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              Encode
            </button>

            <button
              onClick={handleDecodeClick}
              disabled={!encodeResult}
              className="py-3 bg-[#0A0A0B] hover:bg-[#1A1A1C] border border-cyan-900/40 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs tracking-widest uppercase rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Decode
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Funnel 1: Spatial Trace & Instructions */}
      {activeTab === 'TRACE' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold font-mono">
                Funnel 1 — ENCODE Output Stream
              </h2>
              <span className="text-[11px] text-gray-500 font-mono">
                Token → Address → Spatial Instruction
              </span>
            </div>
            <span className="text-[10px] text-gray-400 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#2D2D2F]">
              {encodeResult?.steps.length || 0} Steps Ordered
            </span>
          </div>

          {encodeResult && encodeResult.steps.length > 0 ? (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
              {encodeResult.steps.map((step, idx) => {
                const instruction = encodeResult.spatialInstructions?.[idx];
                return (
                  <div
                    key={step.step}
                    onClick={() => onSelectCell(step.cellId)}
                    className="p-2 rounded bg-[#0A0A0B] hover:bg-[#1A1A1C] border border-[#2D2D2F] hover:border-cyan-500/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-cyan-400">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px] w-5">#{step.step}</span>
                        <span className="w-5 h-5 rounded bg-[#111113] border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                          {step.char === ' ' ? '␣' : step.char}
                        </span>
                        <span className="font-bold text-white">
                          Token: '{step.char === ' ' ? '␣' : step.char}'
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-cyan-400 font-bold">
                          Addr {step.address369}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-purple-300">
                          ({step.coordinate.x}, {step.coordinate.y}, {step.coordinate.z})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-gray-500 hidden sm:inline">
                          Cell #{step.cellId}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#111113] border border-[#2D2D2F] text-[10px] text-gray-400">
                          {step.binary}
                        </span>
                      </div>
                    </div>

                    {instruction && (
                      <div className="bg-[#111113] p-1.5 rounded border border-[#1A1A1C] text-[10px] text-gray-400 font-mono overflow-x-auto select-all">
                        <code>{instruction.instructionCode}</code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs font-mono">
              No active encoding trace yet. Enter text and click Encode to populate.
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono">
              Input data serialized into 3D instructions
            </span>
            <button
              onClick={handleDecodeClick}
              disabled={!encodeResult}
              className="py-2 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-900/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Verify Reversibility
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Decode Test & Reversibility */}
      {activeTab === 'DECODE' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold font-mono">
              Encoding Verification
            </h2>
            {decodeResult && (
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] py-0.5 px-2.5 font-bold uppercase rounded font-mono ${
                    decodeResult.isExactMatch
                      ? 'bg-green-900/20 text-green-400 border border-green-900/50'
                      : 'bg-red-900/20 text-red-400 border border-red-900/50'
                  }`}
                >
                  Status: {decodeResult.isExactMatch ? 'Pass' : 'Fail'}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  Loss: {decodeResult.lossPercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Architecture Pipeline Verification Card */}
          <div className="bg-[#0A0A0B] rounded border border-[#2D2D2F] p-4 font-mono text-xs space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[#2D2D2F]">
              <span className="text-gray-500">Original</span>
              <span className="text-[#E0E0E0] font-mono">'{inputText || ''}'</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Decoded</span>
              <span className="font-mono text-cyan-400 underline decoration-cyan-900 underline-offset-4">
                '{decodeResult ? decodeResult.decodedText : '<run decode>'}'
              </span>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
              <span className="text-[10px] text-gray-500 block font-mono">Information Loss</span>
              <span
                className={`text-sm font-bold font-mono ${
                  decodeResult?.isExactMatch ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {decodeResult ? `${decodeResult.lossPercentage}%` : '0.00%'}
              </span>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
              <span className="text-[10px] text-gray-500 block font-mono">Decoded Steps</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {decodeResult?.stepsDecoded || 0} / {encodeResult?.steps.length || 0}
              </span>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
              <span className="text-[10px] text-gray-500 block font-mono">Latency</span>
              <span className="text-sm font-bold text-gray-300 font-mono">
                {decodeResult?.decodingTimeMs || 0} ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDecodeClick}
              className="flex-1 py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-run Decode Cycle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
