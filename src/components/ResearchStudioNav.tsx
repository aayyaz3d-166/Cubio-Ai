/**
 * 3D Memory Studio - Research Studio Pipeline Navigator
 * 
 * Provides an ultra-clean, high-density ribbon for navigating between
 * Funnel 1 through Funnel 10, plus Studio Analysis & Inspector tools.
 */

import React from 'react';
import {
  Boxes,
  Compass,
  FileCode,
  FileCheck,
  Layers,
  BarChart3,
  Crosshair,
  Sparkles,
  Workflow,
  Network,
  Database,
  SlidersHorizontal,
  Cpu,
  Scale,
  BookOpen,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';

import { ENABLE_EULER_MEMORY_EXPERIMENT } from '../config/eulerConfig';

export type StudioTab =
  | 'COMPACT_DECODER'   // Funnel 12
  | 'PROFITABILITY'     // Funnel 11
  | 'HIERARCHY'          // Funnel 6
  | 'SPATIAL_DICT'       // Funnel 5
  | 'COMPRESSION_PROOF'  // Funnel 7
  | 'SPATIAL_DECODER'    // Funnel 3
  | 'SPATIAL_ENCODER'    // Funnel 8
  | 'OPTIMIZER'          // Funnel 4
  | 'CANONICAL'          // Funnel 9
  | 'DISCOVERY'          // Funnel 10
  | 'FUNNELS'            // Funnel 1..3 Architecture View
  | 'ENCODER'            // Funnel 1 Raw Encoder
  | 'TREE'               // Memory Block Tree
  | 'PATTERNS'           // Spatial Patterns
  | 'INSPECTOR'          // Unified Inspector
  | 'RESEARCH'           // Spatial Probe / Trajectory
  | 'METRICS'            // Overhead & Benchmark Metrics
  | 'EULER_MEMORY'      // Experimental Euler Phase Rotation (EXP-007)
  | 'FRACTAL_VSSD';      // Experimental Fractal-VSSD 3D Studio (EXP-008C-F2)

export type FunnelStatus = 'COMPLETED' | 'ACTIVE' | 'AVAILABLE' | 'NOT_IMPLEMENTED';

interface FunnelItem {
  id: StudioTab;
  number: string;
  label: string;
  status: FunnelStatus;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  desc: string;
}

interface ResearchStudioNavProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
}

export const ResearchStudioNav: React.FC<ResearchStudioNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const funnels: FunnelItem[] = [
    {
      id: 'ENCODER',
      number: 'F1',
      label: 'Tokenizer & 369',
      status: 'COMPLETED',
      icon: FileCode,
      color: 'text-cyan-400',
      desc: 'Funnel 1: Raw Input → Tokenizer → 369 Address Mapping',
    },
    {
      id: 'FUNNELS',
      number: 'F2',
      label: '3D Memory System',
      status: 'COMPLETED',
      icon: Workflow,
      color: 'text-purple-400',
      desc: 'Funnel 2: 7×7×7 Memory Block Layout & Cell Adjacency',
    },
    {
      id: 'SPATIAL_DECODER',
      number: 'F3',
      label: 'Exact Decoder',
      status: 'COMPLETED',
      icon: Cpu,
      color: 'text-emerald-400',
      desc: 'Funnel 3: Reversible Decoding & Binary Deserialization',
    },
    {
      id: 'OPTIMIZER',
      number: 'F4',
      label: 'Primitive Optimizer',
      status: 'COMPLETED',
      icon: SlidersHorizontal,
      color: 'text-purple-400',
      desc: 'Funnel 4: Spatial Runs, Directional Deltas & Primitive Rules',
    },
    {
      id: 'SPATIAL_DICT',
      number: 'F5',
      label: 'Spatial Dictionary',
      status: 'COMPLETED',
      icon: BookOpen,
      color: 'text-cyan-400',
      desc: 'Funnel 5: Spatial Dictionary Patterns & Frequency Indexing',
    },
    {
      id: 'HIERARCHY',
      number: 'F6',
      label: 'Spatial Hierarchy',
      status: 'COMPLETED',
      icon: Network,
      color: 'text-emerald-400',
      desc: 'Funnel 6: Hierarchical Spatial Composition & Bounded DAG (Depth ≤ 3)',
    },
    {
      id: 'COMPRESSION_PROOF',
      number: 'F7',
      label: 'Compression Proof',
      status: 'COMPLETED',
      icon: Scale,
      color: 'text-emerald-400',
      desc: 'Funnel 7: Multi-Level Benchmark Across 12 Standard Datasets',
    },
    {
      id: 'SPATIAL_ENCODER',
      number: 'F8',
      label: 'Hierarchical Codec',
      status: 'COMPLETED',
      icon: FileCheck,
      color: 'text-cyan-400',
      desc: 'Funnel 8: Hierarchical Binary Codec & Byte Serialization',
    },
    {
      id: 'CANONICAL',
      number: 'F9',
      label: 'Canonical Identity',
      status: 'COMPLETED',
      icon: Fingerprint,
      color: 'text-emerald-400',
      desc: 'Funnel 9: Origin-Invariant Structural Signatures & Collision-Safe Identifiers',
    },
    {
      id: 'DISCOVERY',
      number: 'F10',
      label: 'Composite Discovery',
      status: 'COMPLETED',
      icon: Sparkles,
      color: 'text-cyan-400',
      desc: 'Funnel 10: Deterministic Level 3 Candidate Discovery & Grouping',
    },
    {
      id: 'PROFITABILITY',
      number: 'F11',
      label: 'Profitability & Selection',
      status: 'COMPLETED',
      icon: Scale,
      color: 'text-emerald-400',
      desc: 'Funnel 11: Exact Serialized Byte Measurement, Profitability Scoring & Conflict Resolution',
    },
    {
      id: 'COMPACT_DECODER',
      number: 'F12',
      label: 'Compact Codec & Decoder',
      status: 'COMPLETED',
      icon: Cpu,
      color: 'text-cyan-400',
      desc: 'Funnel 12: Hierarchical Binary Encoding (compact3d-v4) & Independent Stateless Decoder',
    },
  ];

  if (ENABLE_EULER_MEMORY_EXPERIMENT) {
    funnels.push({
      id: 'EULER_MEMORY',
      number: 'EXP',
      label: 'Euler Phase',
      status: 'AVAILABLE',
      icon: Compass,
      color: 'text-indigo-400',
      desc: 'Experimental Euler Phase Rotation & 7×7×7 3D Projection (EXP-007 Prototype)',
    });
  }

  funnels.push({
    id: 'FRACTAL_VSSD',
    number: 'F2-VSSD',
    label: 'Fractal-VSSD',
    status: 'COMPLETED',
    icon: Boxes,
    color: 'text-amber-400',
    desc: 'EXP-008C-F2: 4-Layer Fractal-VSSD 3D Studio & Exact Deterministic Regeneration',
  });

  const tools: { id: StudioTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'INSPECTOR', label: 'Inspector', icon: Compass },
    { id: 'TREE', label: 'Tree', icon: Database },
    { id: 'RESEARCH', label: 'Probe', icon: Crosshair },
    { id: 'METRICS', label: 'Metrics', icon: BarChart3 },
  ];

  return (
    <nav aria-label="Pipeline Navigation" className="flex flex-col border-b border-[#252528] bg-[#0E0E10] select-none text-xs font-mono shrink-0">
      {/* Top Funnel Pipeline Strip */}
      <div className="flex items-center gap-1 px-2.5 py-1 overflow-x-auto custom-scrollbar">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1.5 shrink-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
          <span>Funnels:</span>
        </div>

        <div className="flex items-center gap-1">
          {funnels.map((f) => {
            const Icon = f.icon;
            const isActive = activeTab === f.id;
            return (
              <button
                key={f.id}
                id={`nav-btn-${f.id.toLowerCase()}`}
                onClick={() => onSelectTab(f.id)}
                title={f.desc}
                className={`py-1 px-2 rounded flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/70 shadow-xs font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#18181C] border border-transparent'
                }`}
              >
                <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                  isActive ? 'bg-cyan-800/80 text-cyan-100' : 'bg-[#1A1A1E] text-gray-400'
                }`}>
                  {f.number}
                </span>
                <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-cyan-300' : f.color}`} />
                <span className="truncate">{f.label}</span>
                {f.status === 'COMPLETED' && (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 opacity-80 ml-0.5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[#25252A] mx-1.5 shrink-0" />

        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1 shrink-0">
          Tools:
        </div>

        <div className="flex items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`nav-btn-tool-${t.id.toLowerCase()}`}
                onClick={() => onSelectTab(t.id)}
                className={`py-1 px-2 rounded flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  isActive
                    ? 'bg-purple-950/80 text-purple-200 border border-purple-500/70 shadow-xs font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#18181C] border border-transparent'
                }`}
              >
                <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-purple-300' : 'text-gray-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
