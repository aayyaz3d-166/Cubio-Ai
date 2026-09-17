/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Reality Model Construction & 3D Asset Generation — Research Dashboard
 */

import React, { useMemo, useState, useReducer } from 'react';
import { WorkspaceReality } from '../../p61/types';
import { createDefaultExperimentalReality } from '../../p61/realityBuilder';
import { ModelScene3D } from '../types';
import { ModelRepresentationEngine } from '../modelRepresentation';
import { ModelHistoryManager } from '../modelHistory';
import { SceneGraphController } from '../sceneGraph';
import { P65ModelViewport } from './P65ModelViewport';
import { P65ModelBuilderPanel } from './P65ModelBuilderPanel';
import { P65AssetInspector } from './P65AssetInspector';
import { P65ValidationPanel } from './P65ValidationPanel';
import { Boxes } from 'lucide-react';

export const P65ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [reality] = useState<WorkspaceReality>(() => createDefaultExperimentalReality());
  const [scene, setScene] = useState<ModelScene3D>(() =>
    ModelRepresentationEngine.buildSceneFromReality(reality, {
      P61_OBJ_A: 'SPHERE',
      P61_OBJ_B: 'CUBE',
      P61_OBJ_C: 'CYLINDER',
      P61_OBJ_D: 'SPHERE',
    })
  );

  const [selectedId, setSelectedId] = useState<string | null>('MDL_P61_OBJ_A_N000');
  const sceneGraph = useMemo(() => new SceneGraphController(), []);
  const history = useMemo(() => new ModelHistoryManager(scene), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const selectedObject = scene.objects.find((o) => o.modelObjectId === selectedId) || null;

  const handleUpdateScene = (nextScene: ModelScene3D, desc: string) => {
    setScene(nextScene);
    history.recordScene(nextScene, desc);
    forceUpdate();
  };

  const handleUndo = () => {
    const item = history.undo();
    if (item) {
      setScene(item.scene);
      forceUpdate();
    }
  };

  const handleRedo = () => {
    const item = history.redo();
    if (item) {
      setScene(item.scene);
      forceUpdate();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.5 — REALITY MODEL CONSTRUCTION & 3D ASSET GENERATION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: 3D Asset Generation</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Reality X: <strong className="text-cyan-400">{reality.realityChecksum}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Model Checksum: <strong className="text-purple-400">{scene.modelChecksum}</strong>
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
        {/* LEFT: 3D MODEL BUILDER */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P65ModelBuilderPanel
            scene={scene}
            selectedObject={selectedObject}
            onUpdateScene={handleUpdateScene}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.canUndo()}
            canRedo={history.canRedo()}
          />
        </div>

        {/* CENTER: 3D MODEL VIEWPORT */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P65ModelViewport
            scene={scene}
            selectedModelObjectId={selectedId}
            onSelectObject={(id) => {
              setSelectedId(id);
              forceUpdate();
            }}
            width={540}
            height={360}
          />
        </div>

        {/* RIGHT: ASSET INSPECTOR */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P65AssetInspector scene={scene} selectedObject={selectedObject} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: VALIDATION & ASSET EXPORTS ── */}
      <P65ValidationPanel scene={scene} />
    </div>
  );
};
