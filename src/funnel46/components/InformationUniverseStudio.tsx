/**
 * 3D Memory Studio — Funnel 46
 * Component: InformationUniverseStudio
 *
 * Main Interactive Frontend Dashboard for the Information Universe Studio.
 * Connects F45 view models and selectors into a live, responsive localhost UI.
 */

import React, { useState, useMemo } from 'react';
import { NormalizedStudioDataset } from '../../funnel45/adapters';
import { StudioPanelId, StudioNavTabItem } from './../types';
import { useStudioSelection } from '../hooks/useStudioSelection';
import { useStudioFilters } from '../hooks/useStudioFilters';
import { useStudioSession } from '../hooks/useStudioSession';
import {
  selectAvailableCategories,
  selectAvailableDimensions,
} from '../selectors';
import { getStandardResearchStudioDataset, getScaleBenchmarkStudioDataset } from '../studioData';
import { MemoryStudioSimulator } from '../../funnel50/components/MemoryStudioSimulator';
import { MemoryStudioExperience } from '../../funnel51/components/MemoryStudioExperience';
import { MemoryStudio } from '../../funnel53/components/MemoryStudio';
import { RendererViewportCanvas } from '../../funnel55';
import { SceneViewport } from '../../funnel56';
import { GeometryViewport } from '../../funnel57';
import { GraphViewport } from '../../funnel58';
import { ClusterViewport } from '../../funnel59';
import { DimensionViewport } from '../../funnel60';
import { CameraViewport } from '../../funnel61';
import { MemoryStudioApp } from '../../funnel62';
import { LandingExperience } from '../../funnel63';
import { StudioWorkspace } from '../../funnel64';
import { UniverseOverviewPanel } from './UniverseOverviewPanel';
import { DataExplorerPanel } from './DataExplorerPanel';
import { StateInspectorPanel } from './StateInspectorPanel';
import { Visualizer369Panel } from './Visualizer369Panel';
import { LowerDimensionPanel } from './LowerDimensionPanel';
import { HigherDimensionPanel } from './HigherDimensionPanel';
import { MultiDimensionPanel } from './MultiDimensionPanel';
import { KnowledgeGraphPanel } from './KnowledgeGraphPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { SearchConsolePanel } from './SearchConsolePanel';
import {
  Globe,
  Database,
  Layers,
  Binary,
  Compass,
  Network,
  GitBranch,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Play,
  Cpu,
  Box,
  Share2,
  Video,
  Rocket,
} from 'lucide-react';

const NAV_TABS: StudioNavTabItem[] = [
  { id: 'UNIVERSE_OVERVIEW', label: 'Universe Overview', shortLabel: 'Overview', iconName: 'Globe', description: 'Universe summary & telemetry' },
  { id: 'DATA_EXPLORER', label: 'Data Explorer', shortLabel: 'Explorer', iconName: 'Database', description: 'Browse and filter information states' },
  { id: 'STATE_INSPECTOR', label: 'State Inspector', shortLabel: 'Inspector', iconName: 'Layers', description: 'Inspect selected state details' },
  { id: 'VISUALIZER_369', label: '369 Visualizer', shortLabel: '369 View', iconName: 'Binary', description: 'Ternary symbol frequencies & base-3' },
  { id: 'LOWER_DIMENSION_VIEW', label: 'Lower Projection', shortLabel: 'Lower Proj', iconName: 'ArrowDownRight', description: 'Z8->Z3 coordinate reduction' },
  { id: 'HIGHER_DIMENSION_VIEW', label: 'Higher Projection', shortLabel: 'Higher Proj', iconName: 'ArrowUpRight', description: 'Z3->Z8 deterministic expansion' },
  { id: 'MULTI_DIMENSIONAL_SPACE_VIEW', label: 'Multi-Dim Space', shortLabel: 'Space View', iconName: 'Compass', description: 'Coordinate projections & pairwise slices' },
  { id: 'KNOWLEDGE_GRAPH_VIEW', label: 'Knowledge Graph', shortLabel: 'Graph View', iconName: 'Network', description: 'F41/F43 semantic graph exploration' },
  { id: 'PROVENANCE_VIEW', label: 'Provenance', shortLabel: 'Provenance', iconName: 'GitBranch', description: '8-stage research pipeline lineage' },
  { id: 'SEARCH_QUERY_CONSOLE', label: 'Search Console', shortLabel: 'Search', iconName: 'Search', description: 'Multi-criterion deterministic search' },
];

interface InformationUniverseStudioProps {
  initialDataset?: NormalizedStudioDataset;
  onExitToMemoryStudio?: () => void;
}

export const InformationUniverseStudio: React.FC<InformationUniverseStudioProps> = ({
  initialDataset,
  onExitToMemoryStudio,
}) => {
  const [activeDimension, setActiveDimension] = useState<number>(3);
  const [isBenchmarkMode, setIsBenchmarkMode] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [isExperienceMode, setIsExperienceMode] = useState<boolean>(false);
  const [isMemoryStudioMode, setIsMemoryStudioMode] = useState<boolean>(false);
  const [isRendererMode, setIsRendererMode] = useState<boolean>(false);
  const [isSceneMode, setIsSceneMode] = useState<boolean>(false);
  const [isGeometryMode, setIsGeometryMode] = useState<boolean>(false);
  const [isGraphMode, setIsGraphMode] = useState<boolean>(false);
  const [isClusterMode, setIsClusterMode] = useState<boolean>(false);
  const [isDimensionMode, setIsDimensionMode] = useState<boolean>(false);
  const [isCameraMode, setIsCameraMode] = useState<boolean>(false);
  const [isStudioExpMode, setIsStudioExpMode] = useState<boolean>(false);
  const [isLandingMode, setIsLandingMode] = useState<boolean>(false);
  const [isWorkspaceMode, setIsWorkspaceMode] = useState<boolean>(false);

  // Load dataset based on dimension and mode
  const dataset: NormalizedStudioDataset = useMemo(() => {
    if (initialDataset) return initialDataset;
    if (isBenchmarkMode) return getScaleBenchmarkStudioDataset(activeDimension, 4096);
    return getStandardResearchStudioDataset(activeDimension);
  }, [initialDataset, isBenchmarkMode, activeDimension]);

  const {
    selectedStateId,
    selectedRecord,
    selectState,
    activePanel,
    setActivePanel,
    breadcrumb,
  } = useStudioSelection(dataset);

  const { filters, updateFilters, setPageIndex } = useStudioFilters();
  const { session, renderBudget } = useStudioSession(dataset, activePanel, selectedStateId, filters);

  const availableCategories = useMemo(() => selectAvailableCategories(dataset), [dataset]);
  const availableDimensions = useMemo(() => [1, 2, 3, 4, 5, 6, 8, 12, 16], []);

  const handleSearchExecute = (query: string) => {
    updateFilters({ recordIdPattern: query });
    setActivePanel('DATA_EXPLORER');
  };

  // If 3D Workspace Orchestration Engine mode is active, render F64 StudioWorkspace
  if (isWorkspaceMode) {
    return <StudioWorkspace />;
  }

  // If 3D Landing Experience mode is active, render F63 LandingExperience
  if (isLandingMode) {
    return (
      <LandingExperience
        onStartStudio={() => {
          setIsLandingMode(false);
          setIsWorkspaceMode(true);
        }}
      />
    );
  }

  // If 3D Memory Studio Full Experience mode is active, render F62 MemoryStudioApp
  if (isStudioExpMode) {
    return (
      <MemoryStudioApp
        onExit={() => setIsStudioExpMode(false)}
      />
    );
  }

  // If 3D Camera & Navigation Engine mode is active, render F61 CameraViewport
  if (isCameraMode) {
    return (
      <CameraViewport
        onExit={() => setIsCameraMode(false)}
      />
    );
  }

  // If 3D Dimension & Projection Engine mode is active, render F60 DimensionViewport
  if (isDimensionMode) {
    return (
      <DimensionViewport
        onExit={() => setIsDimensionMode(false)}
      />
    );
  }

  // If 3D Cluster & Spatial Organization Engine mode is active, render F59 ClusterViewport
  if (isClusterMode) {
    return (
      <ClusterViewport
        onExit={() => setIsClusterMode(false)}
      />
    );
  }

  // If 3D Relationship & Graph Rendering Engine mode is active, render F58 GraphViewport
  if (isGraphMode) {
    return (
      <GraphViewport
        onExit={() => setIsGraphMode(false)}
      />
    );
  }

  // If 3D Geometry & Material Engine mode is active, render F57 GeometryViewport
  if (isGeometryMode) {
    return (
      <GeometryViewport
        onExit={() => setIsGeometryMode(false)}
      />
    );
  }

  // If 3D Scene Engine mode is active, render the F56 Actual 3D Scene Engine Viewport
  if (isSceneMode) {
    return (
      <SceneViewport
        onExit={() => setIsSceneMode(false)}
      />
    );
  }

  // If 3D Renderer mode is active, render the F55 Real 3D Renderer Foundation Viewport
  if (isRendererMode) {
    return (
      <RendererViewportCanvas
        onExit={() => setIsRendererMode(false)}
      />
    );
  }

  // If 3D Memory Studio mode is active, render the F53 Immersive 3D Memory Studio
  if (isMemoryStudioMode) {
    return (
      <MemoryStudio
        onExitToClassicStudio={() => setIsMemoryStudioMode(false)}
      />
    );
  }

  // If experience mode is active, render the F51 3D Memory Studio Experience Foundation
  if (isExperienceMode) {
    return (
      <MemoryStudioExperience
        onEnterStudio={() => setIsExperienceMode(false)}
      />
    );
  }

  // If simulation mode is active, render full-screen 3D Memory Studio Simulator
  if (isSimulationMode) {
    return (
      <MemoryStudioSimulator
        onExitSimulation={() => setIsSimulationMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0d0d0f] text-zinc-200 font-mono select-none overflow-hidden">
      {/* Top Header */}
      <header className="bg-[#141416] border-b border-[#27272a] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center font-bold text-black text-xs shadow-xs shadow-cyan-500/40">
            369
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-wide">
                INFORMATION UNIVERSE STUDIO
              </span>
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                F45 / F46 Live
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Deterministic Multi-Dimensional Observation Dashboard
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* F51 3D Experience Mode */}
          <button
            onClick={() => setIsExperienceMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-black font-bold rounded shadow-md shadow-emerald-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>3D EXPERIENCE</span>
          </button>

          {/* 3D Simulation Mode Toggle */}
          <button
            onClick={() => setIsSimulationMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-bold rounded shadow-md shadow-cyan-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D SIMULATOR</span>
          </button>

          {/* F53 3D Memory Studio Toggle */}
          <button
            onClick={() => setIsMemoryStudioMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-bold rounded shadow-md shadow-purple-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>3D MEMORY STUDIO</span>
          </button>

          {/* F55 3D Renderer Foundation Toggle */}
          <button
            onClick={() => setIsRendererMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-bold rounded shadow-md shadow-amber-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-black" />
            <span>3D RENDERER</span>
          </button>

          {/* F56 3D Scene Engine Toggle */}
          <button
            onClick={() => setIsSceneMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-black font-bold rounded shadow-md shadow-teal-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-black" />
            <span>3D SCENE</span>
          </button>

          {/* F57 3D Geometry & Material Engine Toggle */}
          <button
            onClick={() => setIsGeometryMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-black font-bold rounded shadow-md shadow-fuchsia-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-black" />
            <span>3D GEOMETRY</span>
          </button>

          {/* F58 3D Relationship & Graph Rendering Engine Toggle */}
          <button
            onClick={() => setIsGraphMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black font-bold rounded shadow-md shadow-teal-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-black" />
            <span>3D GRAPH</span>
          </button>

          {/* F59 3D Cluster & Spatial Organization Engine Toggle */}
          <button
            onClick={() => setIsClusterMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-fuchsia-400 to-rose-400 hover:from-fuchsia-300 hover:to-rose-300 text-black font-bold rounded shadow-md shadow-fuchsia-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>3D CLUSTERS</span>
          </button>

          {/* F60 3D Dimension & Projection Engine Toggle */}
          <button
            onClick={() => setIsDimensionMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold rounded shadow-md shadow-amber-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>3D PROJECTION</span>
          </button>

          {/* F61 3D Camera & Navigation Engine Toggle */}
          <button
            onClick={() => setIsCameraMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-black font-bold rounded shadow-md shadow-cyan-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-black" />
            <span>3D CAMERA</span>
          </button>

          {/* F63 3D Landing Experience Engine Toggle */}
          <button
            onClick={() => setIsLandingMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black font-extrabold rounded shadow-md shadow-teal-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-black" />
            <span>3D LANDING</span>
          </button>

          {/* F62 3D Memory Studio Full Experience Engine Toggle */}
          <button
            onClick={() => setIsStudioExpMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-extrabold rounded shadow-md shadow-purple-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Rocket className="w-3.5 h-3.5 text-white" />
            <span>3D STUDIO</span>
          </button>

          {/* F64 3D Workspace Orchestration Engine Toggle */}
          <button
            onClick={() => setIsWorkspaceMode(true)}
            className="px-3 py-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold rounded shadow-md shadow-cyan-500/30 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-black" />
            <span>3D WORKSPACE</span>
          </button>

          {/* Dimension Selector */}
          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] px-2 py-1 rounded">
            <span className="text-zinc-400 text-[11px]">Dim:</span>
            <select
              value={activeDimension}
              onChange={(e) => setActiveDimension(Number(e.target.value))}
              className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
            >
              {availableDimensions.map((d) => (
                <option key={d} value={d} className="bg-[#18181b]">
                  Z{d}
                </option>
              ))}
            </select>
          </div>

          {/* Benchmark Mode Toggle (4096 states) */}
          <button
            onClick={() => setIsBenchmarkMode(!isBenchmarkMode)}
            className={`px-2.5 py-1 rounded border transition text-[11px] font-semibold flex items-center gap-1 ${
              isBenchmarkMode
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isBenchmarkMode ? 'Benchmark (4096)' : 'Standard (4)'}</span>
          </button>

          {/* Exit / Return to 3D Memory Studio */}
          {onExitToMemoryStudio && (
            <button
              onClick={onExitToMemoryStudio}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-600 text-[11px] transition flex items-center gap-1"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>3D Memory Grid</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Ribbon */}
      <nav className="bg-[#111113] border-b border-[#27272a] px-3 py-1 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {NAV_TABS.map((tab) => {
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`px-2.5 py-1.5 rounded text-xs transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-950/70 border border-cyan-500/70 text-cyan-300 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Breadcrumb Bar */}
      <div className="bg-[#141416] border-b border-[#27272a] px-4 py-1.5 flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
        <span className="text-zinc-500">Universe:</span>
        <span className="text-white font-medium">{breadcrumb.universeId}</span>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-zinc-500">Dimension:</span>
        <span className="text-cyan-400 font-bold">Z{breadcrumb.dimension}</span>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-zinc-500">State:</span>
        <span className="text-amber-300 font-medium truncate max-w-xs">{selectedRecord?.recordId || 'None'}</span>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-zinc-300 font-semibold">{breadcrumb.panelId}</span>
      </div>

      {/* Main Panel Area */}
      <main className="flex-1 overflow-y-auto bg-[#0d0d0f]">
        {activePanel === 'UNIVERSE_OVERVIEW' && (
          <UniverseOverviewPanel
            overview={session.overview}
            selectedStateId={selectedStateId}
            onNavigateToExplorer={() => setActivePanel('DATA_EXPLORER')}
          />
        )}

        {activePanel === 'DATA_EXPLORER' && (
          <DataExplorerPanel
            explorer={session.explorer}
            selectedStateId={selectedStateId}
            onSelectState={selectState}
            onPageChange={setPageIndex}
            onSearchChange={(s) => updateFilters({ recordIdPattern: s })}
            onCategoryFilterChange={(c) => updateFilters({ category: c })}
            availableCategories={availableCategories}
          />
        )}

        {activePanel === 'STATE_INSPECTOR' && (
          <StateInspectorPanel inspector={session.inspector} />
        )}

        {activePanel === 'VISUALIZER_369' && (
          <Visualizer369Panel visualizer={session.visualizer369} />
        )}

        {activePanel === 'LOWER_DIMENSION_VIEW' && (
          <LowerDimensionPanel projection={session.lowerProjectionView} />
        )}

        {activePanel === 'HIGHER_DIMENSION_VIEW' && (
          <HigherDimensionPanel projection={session.higherProjectionView} />
        )}

        {activePanel === 'MULTI_DIMENSIONAL_SPACE_VIEW' && (
          <MultiDimensionPanel spaceView={session.spaceView} />
        )}

        {activePanel === 'KNOWLEDGE_GRAPH_VIEW' && (
          <KnowledgeGraphPanel
            graphView={session.graphView}
            selectedNodeId={selectedRecord?.recordId}
            onSelectNode={(nodeId) => {
              const cleaned = nodeId.replace('NODE:', '');
              const target = dataset.records.find((r) => r.recordId === cleaned || r.stateId === nodeId);
              if (target) selectState(target.stateId);
            }}
          />
        )}

        {activePanel === 'PROVENANCE_VIEW' && (
          <ProvenancePanel provenance={session.provenanceView} />
        )}

        {activePanel === 'SEARCH_QUERY_CONSOLE' && (
          <SearchConsolePanel
            searchConsole={session.searchConsole}
            onExecuteSearch={handleSearchExecute}
            onSelectState={(stateId) => {
              selectState(stateId);
              setActivePanel('STATE_INSPECTOR');
            }}
          />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-[#111113] border-t border-[#27272a] px-4 py-1 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Read-Only Architecture</span>
          </span>
          <span>Logical States: {dataset.records.length}</span>
          <span>Render Budget: {renderBudget.maxVisibleStates} Max Visible</span>
        </div>
        <div>
          <span>3D Memory Studio Research Framework</span>
        </div>
      </footer>
    </div>
  );
};
