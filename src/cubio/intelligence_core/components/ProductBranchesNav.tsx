/**
 * CUBiO AI — Phase 25: Product Branches Navigation Bar
 * Dedicated switchboard between Mother Interface (Intelligence Core) and sovereign Product Branches.
 */

import React from 'react';
import { Cpu, Network, Database, Sparkles } from 'lucide-react';

export type ProductBranchKey = 'CORE' | 'INTELLIGENCE' | 'NETWORK' | 'STUDIO';

interface ProductBranchesNavProps {
  readonly activeBranch: ProductBranchKey;
  readonly onSelectBranch: (branch: ProductBranchKey) => void;
}

export const ProductBranchesNav: React.FC<ProductBranchesNavProps> = ({
  activeBranch,
  onSelectBranch,
}) => {
  const branches = [
    {
      key: 'CORE' as const,
      label: 'INTELLIGENCE CORE',
      subtitle: 'Mother Interface & Orchestration',
      icon: Cpu,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-950/60 border-indigo-600 text-white',
    },
    {
      key: 'INTELLIGENCE' as const,
      label: 'CUBiO INTELLIGENCE',
      subtitle: 'Conversational Substrate',
      icon: Sparkles,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-950/60 border-cyan-600 text-white',
    },
    {
      key: 'NETWORK' as const,
      label: 'CUBiO NETWORK',
      subtitle: 'Spatial Distributed Mesh',
      icon: Network,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950/60 border-emerald-600 text-white',
    },
    {
      key: 'STUDIO' as const,
      label: '3D MEMORY STUDIO',
      subtitle: 'Deep Spatial Memory Lab',
      icon: Database,
      color: 'text-amber-400',
      activeBg: 'bg-amber-950/60 border-amber-600 text-white',
    },
  ];

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/20">
          C
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-wider">CUBiO SOVEREIGN PLATFORM</span>
          <span className="text-[10px] font-mono text-slate-500 block">P25 INTELLIGENCE CORE</span>
        </div>
      </div>

      {/* Branch Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {branches.map((b) => {
          const Icon = b.icon;
          const isActive = activeBranch === b.key;

          return (
            <button
              key={b.key}
              onClick={() => onSelectBranch(b.key)}
              className={
                'px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ' +
                (isActive
                  ? b.activeBg + ' shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700')
              }
            >
              <Icon className={'w-3.5 h-3.5 ' + (isActive ? b.color : 'text-slate-500')} />
              <div className="text-left">
                <div className="font-bold text-[11px] leading-tight">{b.label}</div>
                <div className="text-[9px] text-slate-500 hidden md:block leading-tight">{b.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};