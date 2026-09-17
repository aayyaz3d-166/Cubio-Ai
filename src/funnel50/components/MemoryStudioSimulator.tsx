/**
 * 3D Memory Studio — Funnel 50
 * Component: MemoryStudioSimulator
 *
 * The Main 3D Simulation Laboratory Dashboard integrating the central 3D scene,
 * spatial nodes, HUD overlays, Dimension Controller, 369 Core, LLM Cluster,
 * Knowledge Graph, Projection analysis, and Provenance pipeline.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { InformationUniverseIndex, DimensionalInformationState } from '../../funnel49/types';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import {
  createSimulationSceneSnapshot,
  buildSimulationStateSummary,
} from '../simulationScene';
import {
  createInitialCameraState,
  focusCameraOnNode,
  orbitCamera,
  panCamera,
  zoomCamera,
} from '../simulationControls';
import { SimulationViewMode, SimulationCameraState, SimulationNode } from '../types';
import { MemoryUniverseScene } from './MemoryUniverseScene';
import { UniverseHUD } from './UniverseHUD';
import { StateHUD } from './StateHUD';
import { DimensionController } from './DimensionController';
import { SimulationControls } from './SimulationControls';
import { ThreeSixNineCore } from './ThreeSixNineCore';
import { LLMModelCluster } from './LLMModelCluster';
import { KnowledgeGraphLayer } from './KnowledgeGraphLayer';
import { ProjectionLayer } from './ProjectionLayer';
import { ProvenanceLayer } from './ProvenanceLayer';
import {
  Search,
  Bot,
  Binary,
  Layers,
  GitBranch,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface MemoryStudioSimulatorProps {
  initialIndex?: InformationUniverseIndex;
  onExitSimulation?: () => void;
}

export const MemoryStudioSimulator: React.FC<MemoryStudioSimulatorProps> = ({
  initialIndex,
  onExitSimulation,
}) => {
  const index = useMemo(() => initialIndex || getStandardInformationUniverseFixture(), [initialIndex]);

  const [activeDimension, setActiveDimension] = useState<number>(3);
  const [viewMode, setViewMode] = useState<SimulationViewMode>('UNIVERSE_3D');
  const [camera, setCamera] = useState<SimulationCameraState>(createInitialCameraState);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals
  const [is369Open, setIs369Open] = useState<boolean>(false);
  const [isLLMClusterOpen, setIsLLMClusterOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [isProjectionOpen, setIsProjectionOpen] = useState<boolean>(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);

  // Derive scene snapshot
  const scene = useMemo(() => {
    return createSimulationSceneSnapshot(index, activeDimension, viewMode, camera, selectedNodeId);
  }, [index, activeDimension, viewMode, camera, selectedNodeId]);

  // Handle node selection & camera focus
  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      const targetNode = scene.nodes.find((n) => n.nodeId === nodeId || n.stateId === nodeId || n.recordId === nodeId);
      if (targetNode) {
        setCamera((prev) => focusCameraOnNode(prev, targetNode));
      }
    },
    [scene.nodes]
  );

  // Filter nodes for search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return scene.nodes;
    const q = searchQuery.toLowerCase().trim();
    return scene.nodes.filter(
      (n) =>
        n.recordId.toLowerCase().includes(q) ||
        n.entityName.toLowerCase().includes(q) ||
        n.rawState.sourceDomain.toLowerCase().includes(q) ||
        n.rawState.category.toLowerCase().includes(q) ||
        (n.rawState.modelMetadata?.provider && n.rawState.modelMetadata.provider.toLowerCase().includes(q)) ||
        (n.sequence369Snippet && n.sequence369Snippet.includes(q))
    );
  }, [scene.nodes, searchQuery]);

  // LLM nodes for LLM modal
  const llmNodes = useMemo(() => scene.nodes.filter((n) => n.isLLMModel), [scene.nodes]);

  // Selected State object
  const selectedNode = useMemo(
    () => scene.nodes.find((n) => n.nodeId === selectedNodeId || n.stateId === selectedNodeId || n.recordId === selectedNodeId) || scene.nodes[0],
    [scene.nodes, selectedNodeId]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setCamera(createInitialCameraState());
      } else if (e.key === 'Escape') {
        setIs369Open(false);
        setIsLLMClusterOpen(false);
        setIsGraphOpen(false);
        setIsProjectionOpen(false);
        setIsProvenanceOpen(false);
      } else if (e.key === 'w' || e.key === 'W') {
        setCamera((prev) => orbitCamera(prev, 0.05, 0));
      } else if (e.key === 's' || e.key === 'S') {
        setCamera((prev) => orbitCamera(prev, -0.05, 0));
      } else if (e.key === 'a' || e.key === 'A') {
        setCamera((prev) => orbitCamera(prev, 0, -0.05));
      } else if (e.key === 'd' || e.key === 'D') {
        setCamera((prev) => orbitCamera(prev, 0, 0.05));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#08080a] text-zinc-200 font-mono select-none overflow-hidden flex flex-col">
      {/* Top Header Toolbar */}
      <header className="bg-[#111113]/90 backdrop-blur-md border-b border-[#27272a] px-4 py-2 flex items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center font-bold text-black text-xs shadow-xs shadow-cyan-500/50">
            369
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-wider">3D MEMORY STUDIO SIMULATOR</span>
              <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Simulation Prototype</span>
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">Interactive High-Tech Visual Memory Laboratory</div>
          </div>
        </div>

        {/* View Mode & Sector Shortcuts */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsLLMClusterOpen(true)}
            className="px-3 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600 text-sky-300 rounded font-bold text-[11px] transition flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>LLM Space ({llmNodes.length})</span>
          </button>

          <button
            onClick={() => setIsGraphOpen(true)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-[11px] transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Graph Layers</span>
          </button>

          <button
            onClick={() => setIsProjectionOpen(true)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-[11px] transition flex items-center gap-1.5"
          >
            <span>Projections</span>
          </button>

          <button
            onClick={() => setIsProvenanceOpen(true)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-[11px] transition flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Provenance</span>
          </button>

          {/* Exit Simulation Button */}
          {onExitSimulation && (
            <button
              onClick={onExitSimulation}
              className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded text-[11px] font-bold transition flex items-center gap-1.5 ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Simulation</span>
            </button>
          )}
        </div>
      </header>

      {/* Main 3D Space Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* HUD Elements */}
        <UniverseHUD telemetry={scene.telemetry} activeViewMode={viewMode} />

        <DimensionController
          activeDimension={activeDimension}
          onSelectDimension={setActiveDimension}
          activeCoordinate={selectedNode?.rawState.coordinatesByDimension[activeDimension]?.formattedCoordinate}
          stateId={selectedNode?.recordId}
        />

        <StateHUD
          stateSummary={scene.selectedStateSummary}
          onOpen369={() => setIs369Open(true)}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenProvenance={() => setIsProvenanceOpen(true)}
          onClose={() => setSelectedNodeId(undefined)}
        />

        <SimulationControls
          onResetView={() => setCamera(createInitialCameraState())}
          onCenterUniverse={() => setCamera((prev) => ({ ...prev, target: { x: 0, y: 0, z: 0 }, zoom: 1.0 }))}
          onFocusState={() => selectedNode && handleSelectNode(selectedNode.nodeId)}
          onZoomIn={() => setCamera((prev) => zoomCamera(prev, 0.2))}
          onZoomOut={() => setCamera((prev) => zoomCamera(prev, -0.2))}
          hasSelectedState={Boolean(selectedNode)}
        />

        {/* 3D Scene Viewport */}
        <MemoryUniverseScene
          nodes={filteredNodes}
          edges={scene.edges}
          camera={camera}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onOrbit={(dp, dy) => setCamera((prev) => orbitCamera(prev, dp, dy))}
          onPan={(dx, dy) => setCamera((prev) => panCamera(prev, dx, dy))}
          onZoom={(dz) => setCamera((prev) => zoomCamera(prev, dz))}
        />
      </div>

      {/* Modals & Overlays */}
      {is369Open && selectedNode && (
        <ThreeSixNineCore
          sequence369={selectedNode.rawState.sequence369}
          numericState={selectedNode.rawState.numericStateBigIntString}
          stateId={selectedNode.recordId}
          onClose={() => setIs369Open(false)}
        />
      )}

      {isLLMClusterOpen && (
        <LLMModelCluster
          llmNodes={llmNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(nodeId) => {
            handleSelectNode(nodeId);
            setIsLLMClusterOpen(false);
          }}
          onClose={() => setIsLLMClusterOpen(false)}
        />
      )}

      {isGraphOpen && (
        <KnowledgeGraphLayer
          edges={scene.edges}
          nodes={scene.nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(nodeId) => {
            handleSelectNode(nodeId);
            setIsGraphOpen(false);
          }}
          onClose={() => setIsGraphOpen(false)}
        />
      )}

      {isProjectionOpen && selectedNode && (
        <ProjectionLayer
          state={selectedNode.rawState}
          activeDimension={activeDimension}
          onClose={() => setIsProjectionOpen(false)}
        />
      )}

      {isProvenanceOpen && selectedNode && (
        <ProvenanceLayer
          lineage={selectedNode.rawState.provenanceLineage}
          stateId={selectedNode.recordId}
          onClose={() => setIsProvenanceOpen(false)}
        />
      )}
    </div>
  );
};
