/**
 * CUBiO AI — Phase 25: Coverage & Expansion Telemetry Widget
 * Live mathematical indicators for spatial lattice, memory density, graph connectivity, and epistemic confidence.
 */

import React from 'react';
import { ShieldCheck, Activity, BarChart2, Layers, Cpu } from 'lucide-react';
import { DynamicCoverageMetrics } from '../types';

interface CoverageExpansionWidgetProps {
  readonly metrics: DynamicCoverageMetrics | null;
}

export const CoverageExpansionWidget: React.FC<CoverageExpansionWidgetProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500 flex items-center justify-center">
        Awaiting telemetry synchronization...
      </div>
    );
  }

  const items = [
    {
      label: '343-Cell Spatial Lattice Coverage',
      pct: metrics.cellCoveragePct,
      detail: `${metrics.activeCellCount} / ${metrics.cellCount} cells`,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      icon: Layers,
    },
    {
      label: 'Address 369 Modular Spanning',
      pct: metrics.addressCoveragePct,
      detail: `${metrics.mappedAddressCount} / ${metrics.addressSpaceTotal} addresses`,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      icon: Activity,
    },
    {
      label: 'Memory Density Matrix',
      pct: metrics.memoryCoveragePct,
      detail: 'State-T & 369 registers',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      icon: Cpu,
    },
    {
      label: 'Knowledge Graph Connectivity',
      pct: metrics.knowledgeCoveragePct,
      detail: 'Relational 4-pillar topology',
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      icon: BarChart2,
    },
    {
      label: 'Epistemic Reasoning Substrate',
      pct: metrics.activeReasoningPct,
      detail: 'Non-fact lockout enforced',
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-xs font-bold font-mono text-white tracking-wider">
            DYNAMIC MATHEMATICAL COVERAGE TELEMETRY
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Calculated: <strong className="text-emerald-400 font-bold">{new Date(metrics.calculatedAt).toLocaleTimeString()}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Icon className={'w-3.5 h-3.5 ' + item.textColor} />
                  <span className="truncate">{item.label}</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-slate-500">{item.detail}</span>
                <span className={'text-sm font-bold ' + item.textColor}>{item.pct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={'h-full rounded-full transition-all duration-500 ' + item.color}
                  style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};