/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Construction & Topology — Research Dashboard
 */

import React, { useMemo, useState, useReducer } from 'react';
import { WorkspaceReality } from '../../p61/types';
import { createDefaultExperimentalReality } from '../../p61/realityBuilder';
import { ModelRepresentationEngine } from '../../p65/modelRepresentation';
import { P65BridgeAdapter } from '../p65Bridge';
import { AdvancedGeometryScene } from '../types';
import { ConstructionHistoryManager } from '../constructionHistory';
import { P66GeometryViewport } from './P66GeometryViewport';
import { P66ConstructionPanel } from './P66ConstructionPanel';
import { P66TopologyPanel } from './P66TopologyPanel';
import { P66GeometryInspector } from './P66GeometryInspector';
import { P66ValidationPanel } from './P66ValidationPanel';
import { Boxes } from 'lucide-react';

export const P66ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [reality] = useState<WorkspaceReality>(() => createDefaultExperimentalReality());
  const [modelScene] = useState(() => ModelRepresentationEngine.buildSceneFromReality(reality));
  const [geometryScene, setGeometryScene] = useState<AdvancedGeometryScene>(() =>
    P65BridgeAdapter.adaptScene(modelScene)
  );

  const [selectedId, setSelectedId] = useState<string | null>(geometryScene.objects[0]?.id || null);
  const history = useMemo(() => new ConstructionHistoryManager(geometryScene), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const selectedObject = geometryScene.objects.find((o) => o.id === selectedId) || null;

  const handleUpdateScene = (nextScene: AdvancedGeometryScene, desc: string) => {
    setGeometryScene(nextScene);
    history.recordScene(nextScene, desc);
    forceUpdate();
  };

  const handleUndo = () => {
    const item = history.undo();
    if (item) {
      setGeometryScene(item.scene);
      forceUpdate();
    }
  };

  const handleRedo = () => {
    const item = history.redo();
    if (item) {
      setGeometryScene(item.scene);
      forceUpdate();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-bold text-purple-400">
            P6.6 — ADVANCED GEOMETRY CONSTRUCTION & TOPOLOGY
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Advanced Topology</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Reality X: <strong className="text-cyan-400">{reality.realityChecksum}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Scene CS: <strong className="text-purple-400">{geometryScene.sceneChecksum}</strong>
          </span>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: ADVANCED GEOMETRY BUILDER */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P66ConstructionPanel
            scene={geometryScene}
            selectedObject={selectedObject}
            onUpdateScene={handleUpdateScene}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.canUndo()}
            canRedo={history.canRedo()}
          />
        </div>

        {/* CENTER: GEOMETRY VIEWPORT & TOPOLOGY PANEL */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P66GeometryViewport
            scene={geometryScene}
            selectedObjectId={selectedId}
            onSelectObject={(id) => {
              setSelectedId(id);
              forceUpdate();
            }}
            width={540}
            height={260}
          />
          <div className="w-full max-w-[540px]">
            <P66TopologyPanel selectedObject={selectedObject} />
          </div>
        </div>

        {/* RIGHT: GEOMETRY INSPECTOR */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P66GeometryInspector scene={geometryScene} selectedObject={selectedObject} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: VALIDATION & EXPORT ── */}
      <P66ValidationPanel scene={geometryScene} />
    </div>
  );
};
