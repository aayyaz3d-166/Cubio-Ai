/**
 * 3D Memory Studio — Funnel 46
 * Component: UniverseOverviewPanel
 *
 * Panel 1: Observational statistics, universe metrics, logical vs visible states,
 * active dimensions, knowledge graph counts, and render budget status.
 */

import React from 'react';
import { UniverseOverviewViewModel } from '../../funnel45/types';
import { Globe, Layers, Database, Network, Eye, ShieldAlert, Cpu } from 'lucide-react';

interface UniverseOverviewPanelProps {
  overview: UniverseOverviewViewModel;
  selectedStateId?: string;
  onNavigateToExplorer: () => void;
}

export const UniverseOverviewPanel: React.FC<UniverseOverviewPanelProps> = ({
  overview,
  selectedStateId,
  onNavigateToExplorer,
}) => {
  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Header Stat Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Active Universe</span>
          </div>
          <div className="text-base font-bold text-white truncate">{overview.activeUniverseId}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Dimension: Z{overview.activeDimension}</div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Logical States</span>
          </div>
          <div className="text-base font-bold text-emerald-400">{overview.totalLogicalStates.toLocaleString()}</div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Visible in DOM: {overview.totalVisibleStates.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Network className="w-4 h-4 text-purple-400" />
            <span>Knowledge Graph</span>
          </div>
          <div className="text-base font-bold text-purple-400">{overview.totalGraphNodes} Nodes</div>
          <div className="text-[10px] text-zinc-500 mt-1">{overview.totalGraphRelationships} Semantic Edges</div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Projections</span>
          </div>
          <div className="text-base font-bold text-amber-400">
            {overview.totalLowerProjections + overview.totalHigherProjections} Total
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            ↓{overview.totalLowerProjections} Low / ↑{overview.totalHigherProjections} High
          </div>
        </div>
      </div>

      {/* Render Budget Notice */}
      {overview.budgetExceeded && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-md p-3 flex items-start gap-2.5 text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Render Budget Active (Max {overview.renderBudget.maxVisibleStates} States)</div>
            <div className="text-amber-200/80 text-[11px] leading-relaxed">
              {overview.noticeMessage ||
                'Additional states exist logically but are omitted from DOM rendering to maintain lightweight performance.'}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Telemetry Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="text-zinc-300 font-semibold flex items-center justify-between border-b border-[#27272a] pb-1.5">
            <span>Captured Sources & Documents</span>
            <span className="text-[10px] text-zinc-500">{overview.totalSources} Domains</span>
          </div>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between">
              <span>Total Captured Documents:</span>
              <span className="text-white font-medium">{overview.totalCapturedDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span>Allowlisted Source Domains:</span>
              <span className="text-white font-medium">{overview.totalSources}</span>
            </div>
            <div className="flex justify-between">
              <span>Selected State in Focus:</span>
              <span className="text-cyan-400 font-medium truncate max-w-[200px]">
                {selectedStateId || 'None Selected'}
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="w-full mt-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 py-1.5 rounded text-xs transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Data Explorer</span>
          </button>
        </div>

        {/* Studio Scientific Boundary Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Studio Scientific Scope</span>
          </div>
          <div className="text-zinc-400 text-[11px] space-y-1 leading-relaxed">
            <p>
              • <strong className="text-zinc-200">Observation Layer</strong>: Studio consumes research models read-only without mutation.
            </p>
            <p>
              • <strong className="text-zinc-200">Computational Dimensions</strong>: Projections represent mathematical coordinate transformations.
            </p>
            <p>
              • <strong className="text-zinc-200">Deterministic Invariants</strong>: Exact payload checksums preserved across all dimensional views.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
