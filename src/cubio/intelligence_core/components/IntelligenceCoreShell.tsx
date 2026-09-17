/**
 * CUBiO AI — Phase 25: Master Intelligence Core Shell
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * The Mother Interface and Orchestration Environment of CUBiO AI.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  IntelligenceCoreView,
  DeepNodeInspectionData,
  LiveTrackingEvent,
} from '../types';
import { IntelligenceCoreEngine } from '../state/intelligenceCoreEngine';
import { ProductBranchesNav, ProductBranchKey } from './ProductBranchesNav';
import { SpatialMap3D } from './SpatialMap3D';
import { LiveTelemetryPanel } from './LiveTelemetryPanel';
import { CoverageExpansionWidget } from './CoverageExpansionWidget';
import { AutonomousBuilderPanel } from './AutonomousBuilderPanel';
import { SelfOptimizationCenter } from './SelfOptimizationCenter';
import { IntelligenceGraphPanel } from './IntelligenceGraphPanel';
import { LiveTrackingStream } from './LiveTrackingStream';
import { ProductFactoryPanel } from './ProductFactoryPanel';
import { NodeInspectorModal } from './NodeInspectorModal';
import {
  Compass,
  Activity,
  Wrench,
  Sliders,
  Share2,
  ListOrdered,
  Factory,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface IntelligenceCoreShellProps {
  readonly onNavigateToIntelligence?: () => void;
  readonly onNavigateToNetwork?: () => void;
  readonly onNavigateToStudio?: () => void;
}

export const IntelligenceCoreShell: React.FC<IntelligenceCoreShellProps> = ({
  onNavigateToIntelligence,
  onNavigateToNetwork,
  onNavigateToStudio,
}) => {
  const engine = useMemo(() => IntelligenceCoreEngine.getInstance(), []);

  // Active sub-view in Core
  const [activeView, setActiveView] = useState<IntelligenceCoreView>('VISUAL_CORTEX');

  // Node Inspector state
  const [inspectedNodeData, setInspectedNodeData] = useState<DeepNodeInspectionData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Live state tracking
  const [stateTick, setStateTick] = useState<number>(0);

  const cells = useMemo(() => engine.getLatticeCells(), [engine]);
  const activeTrajectory = useMemo(() => engine.getActiveTrajectory(), [engine, stateTick]);
  const trackingEvents = useMemo(() => engine.getTrackingEvents(), [engine, stateTick]);
  const graphData = useMemo(() => engine.getIntelligenceGraphData(), [engine]);
  const liveState = useMemo(() => engine.getLiveStateSnapshot(), [engine, stateTick]);
  const liveCoverage = useMemo(() => engine.getLiveCoverageMetrics(), [engine, stateTick]);

  // Node selection handler
  const handleSelectCell = useCallback(
    (targetId: string | number) => {
      const data = engine.inspectNode(targetId);
      setInspectedNodeData(data);
      setIsInspectorOpen(true);
    },
    [engine]
  );

  // Trajectory pulse simulator
  const handleSimulateTrajectory = useCallback(() => {
    // Pick random target cell
    const targetCellId = 'CELL_' + Math.floor(Math.random() * 7) + '_' + Math.floor(Math.random() * 7) + '_' + Math.floor(Math.random() * 7);
    engine.triggerEventWithTrajectory(
      'REASONING_CHAIN_STARTED',
      'CELL_0_0_0',
      targetCellId,
      'Multi-hop reasoning trajectory pulse across Address 369 anchors.'
    );
    setStateTick((t) => t + 1);
  }, [engine]);

  // Event click handler from stream
  const handleSelectEvent = useCallback(
    (evt: LiveTrackingEvent) => {
      handleSelectCell(evt.cellId);
    },
    [handleSelectCell]
  );

  // Branch switcher
  const handleBranchSelect = (key: ProductBranchKey) => {
    if (key === 'INTELLIGENCE') onNavigateToIntelligence?.();
    else if (key === 'NETWORK') onNavigateToNetwork?.();
    else if (key === 'STUDIO') onNavigateToStudio?.();
  };

  const navItems: { view: IntelligenceCoreView; label: string; icon: React.ElementType }[] = [
    { view: 'VISUAL_CORTEX', label: '3D Visual Cortex', icon: Compass },
    { view: 'LIVE_STATE', label: 'Live Telemetry', icon: Activity },
    { view: 'AUTONOMOUS_BUILDER', label: 'Autonomous Builder', icon: Wrench },
    { view: 'OPTIMIZATION_CENTER', label: 'Self-Optimization', icon: Sliders },
    { view: 'INTELLIGENCE_GRAPH', label: 'Intelligence Graph', icon: Share2 },
    { view: 'LIVE_TRACKING', label: 'Live Tracking', icon: ListOrdered },
    { view: 'PRODUCT_FACTORY', label: 'Product Factory', icon: Factory },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Master Product Branches Switchboard */}
      <ProductBranchesNav activeBranch="CORE" onSelectBranch={handleBranchSelect} />

      {/* 2. Intelligence Core Sub-Header & Status Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ' +
                  (isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700')
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">STAGE 1 P24</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0 EXTERNAL CALLS</span>
          </div>
          <button
            onClick={handleSimulateTrajectory}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" /> Trajectory Pulse
          </button>
        </div>
      </div>

      {/* 3. Main Operational Content Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Coverage & Expansion Metric Strip (Always visible top overview) */}
        <CoverageExpansionWidget metrics={liveCoverage} />

        {/* View Switcher Panels */}
        {activeView === 'VISUAL_CORTEX' && (
          <div className="space-y-6">
            <SpatialMap3D
              cells={cells}
              activeTrajectory={activeTrajectory}
              onSelectCell={handleSelectCell}
              onSimulateTrajectory={handleSimulateTrajectory}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveTrackingStream
                events={trackingEvents}
                onSelectEvent={handleSelectEvent}
              />
              <IntelligenceGraphPanel
                graphData={graphData}
                onSelectNode={handleSelectCell}
              />
            </div>
          </div>
        )}

        {activeView === 'LIVE_STATE' && (
          <div className="space-y-6">
            <LiveTelemetryPanel state={liveState} />
            <LiveTrackingStream
              events={trackingEvents}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        )}

        {activeView === 'AUTONOMOUS_BUILDER' && (
          <AutonomousBuilderPanel />
        )}

        {activeView === 'OPTIMIZATION_CENTER' && (
          <SelfOptimizationCenter />
        )}

        {activeView === 'INTELLIGENCE_GRAPH' && (
          <IntelligenceGraphPanel
            graphData={graphData}
            onSelectNode={handleSelectCell}
          />
        )}

        {activeView === 'LIVE_TRACKING' && (
          <div className="space-y-6">
            <SpatialMap3D
              cells={cells}
              activeTrajectory={activeTrajectory}
              onSelectCell={handleSelectCell}
              onSimulateTrajectory={handleSimulateTrajectory}
            />
            <LiveTrackingStream
              events={trackingEvents}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        )}

        {activeView === 'PRODUCT_FACTORY' && (
          <ProductFactoryPanel />
        )}
      </main>

      {/* Deep 9-Field Node Inspector Modal */}
      <NodeInspectorModal
        data={inspectedNodeData}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Sovereign Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-3 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>CUBiO AI Intelligence Core • Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001</span>
        <span>QWEN_REMOVED: eradicated • Native Model Genesis Stage 1 • Physical Actuation Locked</span>
      </footer>
    </div>
  );
};