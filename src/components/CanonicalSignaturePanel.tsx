/**
 * 3D Memory Studio - Funnel 9: Canonicalization & Structural Signature UI Panel
 * 
 * Interactive inspection of:
 * - Level 3 Composite Canonicalization
 * - Origin-Invariant Structural Signatures
 * - Collision-Safe Identifier Generation
 * - Relative Geometry Transformation & Deterministic Child Sorting
 */

import React, { useState, useMemo } from 'react';
import { RootMemory } from '../types/memory';
import {
  canonicalizeComposite,
  areCanonicalCompositesEqual,
  compareCanonicalComposites,
  CanonicalComposite,
  RawCompositeInput,
} from '../funnel9';
import { runFunnel9Tests } from '../funnel9/tests';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Scale,
  Binary,
  Code2,
  Hash,
  Share2,
  Layers,
  ArrowRight,
  Fingerprint,
  Box,
  Copy,
  Check,
} from 'lucide-react';

interface CanonicalSignaturePanelProps {
  rootMemory: RootMemory;
  onSelectCell?: (cellId: number) => void;
}

export const CanonicalSignaturePanel: React.FC<CanonicalSignaturePanelProps> = ({
  rootMemory,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INTERACTIVE_SANDBOX' | 'TEST_SUITE'>('OVERVIEW');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive Test State: Two composites with different global origins
  const [originA, setOriginA] = useState<[number, number, number]>([0, 0, 0]);
  const [originB, setOriginB] = useState<[number, number, number]>([14, 21, 7]);
  const [childRelOffsets, setChildRelOffsets] = useState<[number, number, number][]>([
    [0, 0, 0],
    [2, 1, 0],
    [4, 2, 1],
  ]);

  // Construct Raw Composite Input A
  const rawInputA: RawCompositeInput = useMemo(() => {
    return {
      compositeId: 'COMPOSITE_ALPHA',
      origin: { x: originA[0], y: originA[1], z: originA[2] },
      children: [
        {
          dictId: 1,
          position: {
            x: originA[0] + childRelOffsets[0][0],
            y: originA[1] + childRelOffsets[0][1],
            z: originA[2] + childRelOffsets[0][2],
          },
          order: 0,
        },
        {
          dictId: 2,
          position: {
            x: originA[0] + childRelOffsets[1][0],
            y: originA[1] + childRelOffsets[1][1],
            z: originA[2] + childRelOffsets[1][2],
          },
          order: 1,
        },
        {
          dictId: 3,
          position: {
            x: originA[0] + childRelOffsets[2][0],
            y: originA[1] + childRelOffsets[2][1],
            z: originA[2] + childRelOffsets[2][2],
          },
          order: 2,
        },
      ],
    };
  }, [originA, childRelOffsets]);

  // Construct Raw Composite Input B
  const rawInputB: RawCompositeInput = useMemo(() => {
    return {
      compositeId: 'COMPOSITE_BETA',
      origin: { x: originB[0], y: originB[1], z: originB[2] },
      children: [
        {
          dictId: 1,
          position: {
            x: originB[0] + childRelOffsets[0][0],
            y: originB[1] + childRelOffsets[0][1],
            z: originB[2] + childRelOffsets[0][2],
          },
          order: 0,
        },
        {
          dictId: 2,
          position: {
            x: originB[0] + childRelOffsets[1][0],
            y: originB[1] + childRelOffsets[1][1],
            z: originB[2] + childRelOffsets[1][2],
          },
          order: 1,
        },
        {
          dictId: 3,
          position: {
            x: originB[0] + childRelOffsets[2][0],
            y: originB[1] + childRelOffsets[2][1],
            z: originB[2] + childRelOffsets[2][2],
          },
          order: 2,
        },
      ],
    };
  }, [originB, childRelOffsets]);

  // Canonicalize both
  const canonResultA = useMemo(() => canonicalizeComposite(rawInputA), [rawInputA]);
  const canonResultB = useMemo(() => canonicalizeComposite(rawInputB), [rawInputB]);

  const canonA = canonResultA.canonical;
  const canonB = canonResultB.canonical;

  const sigA = canonA?.signature ?? 'N/A';
  const sigB = canonB?.signature ?? 'N/A';

  const hashA = canonA?.fingerprint ?? 'N/A';
  const hashB = canonB?.fingerprint ?? 'N/A';

  const isIdentical = useMemo(() => {
    if (!canonA || !canonB) return false;
    return areCanonicalCompositesEqual(canonA, canonB);
  }, [canonA, canonB]);

  // Funnel 9 Test Suite Runner
  const [testResults, setTestResults] = useState<Array<{ id: string; name: string; passed: boolean; details: string }> | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const res = runFunnel9Tests();
      setTestResults(res);
      setIsRunningTests(false);
    }, 40);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="bg-[#111113] rounded border border-[#2D2D2F] overflow-hidden flex flex-col h-full shadow-xl font-mono text-xs">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-[#141416] border-b border-[#2D2D2F] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Fingerprint className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
              Funnel 9: Composite Canonicalization & Identity
            </h3>
            <p className="text-[10px] text-gray-400">
              Origin-Invariant Signatures & Collision-Safe Identifiers for Level 3 Structures
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          LOCKED RESEARCH SPEC
        </span>
      </div>

      {/* Subtabs */}
      <div className="flex items-center border-b border-[#2D2D2F] bg-[#141416] px-3 py-1.5 gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1 rounded cursor-pointer transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Specification & Architecture
        </button>
        <button
          onClick={() => setActiveTab('INTERACTIVE_SANDBOX')}
          className={`px-3 py-1 rounded cursor-pointer transition-colors ${
            activeTab === 'INTERACTIVE_SANDBOX'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Origin-Invariance Sandbox
        </button>
        <button
          onClick={() => setActiveTab('TEST_SUITE')}
          className={`px-3 py-1 rounded cursor-pointer transition-colors ${
            activeTab === 'TEST_SUITE'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Unit Verification Suite
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Core Mathematical Law */}
            <div className="bg-[#0A0A0B] border border-emerald-500/30 p-3.5 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Canonical Identity Theorem
                </span>
                <span className="text-[10px] text-gray-500">Invariance Constraint</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Two Level 3 composite structures represent the <span className="text-white font-bold">SAME spatial composition</span> if and only if their relative child geometry, child identifiers, and relative offsets are identical, regardless of their global origin translations.
              </p>
              <div className="bg-[#141416] p-2.5 rounded border border-[#222226] text-[11px] text-gray-400 space-y-1">
                <div><span className="text-emerald-400 font-bold">1. Coordinate Normalization:</span> <code className="text-gray-300">rel(x,y,z) = global(x,y,z) - origin(x,y,z)</code></div>
                <div><span className="text-cyan-400 font-bold">2. Deterministic Ordering:</span> Sort by <code className="text-gray-300">rel.x ASC → rel.y ASC → rel.z ASC → childId ASC</code></div>
                <div><span className="text-purple-400 font-bold">3. Exact Signature Format:</span> <code className="text-gray-300">COMPOSITE[CHILD_ID@(x,y,z);...]</code></div>
                <div><span className="text-amber-400 font-bold">4. Collision-Safe Identifier:</span> <code className="text-gray-300">CSID_v1_&lt;FNV1a_32HEX&gt;_&lt;LEN&gt;</code></div>
              </div>
            </div>

            {/* Invariance Architecture Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-1.5">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Supported Hierarchy Level</span>
                <div className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Level 3 (Funnel 6 Composites)
                </div>
                <p className="text-gray-500 text-[11px]">Aggregates Level 2 dictionary patterns & Level 1 primitives</p>
              </div>

              <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-1.5">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Complexity & Guarantee</span>
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  O(N log N) Deterministic
                </div>
                <p className="text-gray-500 text-[11px]">Strict mathematical uniqueness with 0 collision risk</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INTERACTIVE_SANDBOX' && (
          <div className="space-y-4">
            {/* Real-time Comparator Banner */}
            <div className={`p-3 rounded border flex items-center justify-between ${
              isIdentical
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {isIdentical ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {isIdentical ? 'EXACT STRUCTURAL IDENTITY VERIFIED' : 'STRUCTURAL DIVERGENCE DETECTED'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {isIdentical
                      ? 'Global origins differ, but normalized canonical relative geometry matches 100%.'
                      : 'Relative geometries or child sequences differ.'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold border border-white/10">
                {isIdentical ? 'STATUS: PASS' : 'STATUS: DIVERGENT'}
              </span>
            </div>

            {/* Composite Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Composite A */}
              <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-[#1E1E22] pb-1.5">
                  <span className="text-cyan-400 font-bold">Composite Alpha</span>
                  <span className="text-[10px] text-gray-500">Instance 1</span>
                </div>
                <div className="text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Global Origin:</span>
                    <span className="text-white font-mono">[{originA.join(', ')}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Child Count:</span>
                    <span className="text-white">{rawInputA.children.length}</span>
                  </div>
                </div>

                <div className="bg-[#141416] p-2 rounded border border-[#1E1E22] space-y-1 text-[10px]">
                  <span className="text-gray-400 font-bold block">Canonical Signature:</span>
                  <div className="text-emerald-300 break-all font-mono select-all bg-black/40 p-1.5 rounded border border-[#222226]">
                    {sigA}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500">Lookup Fingerprint:</span>
                    <span className="text-amber-400 font-bold">{hashA}</span>
                  </div>
                </div>
              </div>

              {/* Composite B */}
              <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-[#1E1E22] pb-1.5">
                  <span className="text-purple-400 font-bold">Composite Beta</span>
                  <span className="text-[10px] text-gray-500">Instance 2 (Shifted Origin)</span>
                </div>
                <div className="text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Global Origin:</span>
                    <span className="text-white font-mono">[{originB.join(', ')}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Child Count:</span>
                    <span className="text-white">{rawInputB.children.length}</span>
                  </div>
                </div>

                <div className="bg-[#141416] p-2 rounded border border-[#1E1E22] space-y-1 text-[10px]">
                  <span className="text-gray-400 font-bold block">Canonical Signature:</span>
                  <div className="text-emerald-300 break-all font-mono select-all bg-black/40 p-1.5 rounded border border-[#222226]">
                    {sigB}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500">Lookup Fingerprint:</span>
                    <span className="text-amber-400 font-bold">{hashB}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Origin Shift Controls */}
            <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
              <span className="text-gray-400 text-[10px] font-bold uppercase block">
                Translate Global Origin (Proves Invariance)
              </span>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <button
                  onClick={() => setOriginB([0, 0, 0])}
                  className="px-2.5 py-1 bg-[#1C1C1E] hover:bg-[#2D2D2F] rounded border border-[#2D2D2F] cursor-pointer text-gray-300"
                >
                  Origin B = [0, 0, 0]
                </button>
                <button
                  onClick={() => setOriginB([7, 14, 21])}
                  className="px-2.5 py-1 bg-[#1C1C1E] hover:bg-[#2D2D2F] rounded border border-[#2D2D2F] cursor-pointer text-gray-300"
                >
                  Origin B = [7, 14, 21]
                </button>
                <button
                  onClick={() => setOriginB([100, 200, 300])}
                  className="px-2.5 py-1 bg-[#1C1C1E] hover:bg-[#2D2D2F] rounded border border-[#2D2D2F] cursor-pointer text-gray-300"
                >
                  Origin B = [100, 200, 300]
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TEST_SUITE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0A0A0B] p-3 rounded border border-[#222226]">
              <div>
                <div className="font-bold text-white text-xs">Funnel 9 Unit Verification Tests</div>
                <div className="text-[10px] text-gray-500">6 Specialized Mathematical Invariance Cases</div>
              </div>
              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-emerald-900/20"
              >
                <Play className="w-3.5 h-3.5" />
                {isRunningTests ? 'Executing...' : 'Run Funnel 9 Suite'}
              </button>
            </div>

            {testResults && (
              <div className="space-y-2">
                {testResults.map((r) => (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded border flex items-start justify-between gap-2 ${
                      r.passed
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                        : 'bg-rose-950/20 border-rose-800/40 text-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono font-bold">[{r.id}]</span>
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
      </div>
    </div>
  );
};
