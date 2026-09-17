/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Multi-Observer Workspace & Reality Reconstruction — Research Dashboard
 */

import React, { useMemo, useReducer, useCallback } from 'react';
import { MultiObserverWorkspace } from '../multiObserverWorkspace';
import { P63WorkspaceCanvas } from './P63WorkspaceCanvas';
import { P63ObserverPanel } from './P63ObserverPanel';
import { P63ReconstructionPanel } from './P63ReconstructionPanel';
import { P62InteractionPanel } from '../../p62/ui/P62InteractionPanel';
import { Boxes, Eye, RotateCcw } from 'lucide-react';

export const P63ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // Master P6.3 Workspace
  const workspace = useMemo(() => new MultiObserverWorkspace(), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const frames = workspace.getObservableFrames();
  const activeObserver = workspace.observers[workspace.activeViewObserverKey];
  const activeFrame = frames[workspace.activeViewObserverKey === 'O0' ? 'F0' : workspace.activeViewObserverKey === 'O1' ? 'F1' : 'F2'];

  const handleOrbit = useCallback((dy: number, dp: number) => {
    workspace.orbitActiveObserver(dy, dp);
    forceUpdate();
  }, [workspace]);

  const handlePan = useCallback((dx: number, dy: number) => {
    workspace.panActiveObserver(dx, dy);
    forceUpdate();
  }, [workspace]);

  const handleZoom = useCallback((delta: number) => {
    workspace.zoomActiveObserver(delta);
    forceUpdate();
  }, [workspace]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.3 — MULTI-OBSERVER WORKSPACE & REALITY RECONSTRUCTION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Multi-Observer Triangulation</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Reality X: <strong className="text-cyan-400">{workspace.reality.realityChecksum}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Combination: <strong className="text-purple-400">{workspace.selectedCombination}</strong>
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

      {/* ── SUB-TOOLBAR: CAMERA VIEWPORT CONTROLS ── */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-black/50 border-b border-zinc-800 text-xs">
        <span className="text-[10px] text-zinc-500 uppercase">Camera Viewport ({workspace.activeViewObserverKey}):</span>
        <button onClick={() => handleOrbit(15, 0)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">◀ Orbit</button>
        <button onClick={() => handleOrbit(-15, 0)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">Orbit ▶</button>
        <button onClick={() => handleOrbit(0, 10)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">▲</button>
        <button onClick={() => handleOrbit(0, -10)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">▼</button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button onClick={() => handlePan(-10, 0)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">Pan ◀</button>
        <button onClick={() => handlePan(10, 0)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">Pan ▶</button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button onClick={() => handleZoom(-20)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">Zoom +</button>
        <button onClick={() => handleZoom(20)} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer">Zoom -</button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button
          onClick={() => {
            workspace.resetActiveObserver();
            forceUpdate();
          }}
          className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Reset View
        </button>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: REALITY BUILDER */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P62InteractionPanel
            engine={{
              reality: workspace.reality,
              getSelectedObject: () => workspace.getSelectedObject(),
              createObject: (p) => {
                const id = workspace.createObject(p);
                forceUpdate();
                return id;
              },
              moveSelectedObject: (pos) => {
                workspace.moveSelectedObject(pos);
                forceUpdate();
              },
              translateSelectedObject: (delta) => {
                workspace.translateSelectedObject(delta);
                forceUpdate();
              },
              duplicateSelectedObject: () => {
                const id = workspace.duplicateSelectedObject();
                forceUpdate();
                return id;
              },
              deleteSelectedObject: () => {
                workspace.deleteSelectedObject();
                forceUpdate();
              },
              resetReality: () => {
                workspace.resetReality();
                forceUpdate();
              },
              loadCanonicalP5Reality: () => {
                workspace.loadCanonicalP5Reality();
                forceUpdate();
              },
              undo: () => {
                const res = workspace.undo();
                forceUpdate();
                return res;
              },
              redo: () => {
                const res = workspace.redo();
                forceUpdate();
                return res;
              },
              history: workspace.history,
            } as any}
            onRefresh={forceUpdate}
          />
        </div>

        {/* CENTER: MULTI-OBSERVER CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <div className="flex items-center justify-between w-full max-w-[540px] text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {activeObserver.label}
            </span>
            <span className="text-[10px] text-zinc-500">
              Pos: [{activeObserver.position.map((v) => v.toFixed(0)).join(',')}]
            </span>
          </div>

          <P63WorkspaceCanvas
            reality={workspace.reality}
            observer={activeObserver}
            observableFrame={activeFrame}
            selectedObjectId={workspace.selection.getState().selectedObjectId}
            onSelectObject={(id) => {
              workspace.selectObject(id);
              forceUpdate();
            }}
            width={540}
            height={360}
          />
        </div>

        {/* RIGHT: THREE OBSERVERS & COMBINATIONS */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P63ObserverPanel workspace={workspace} onRefresh={forceUpdate} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: RECONSTRUCTION & CAUSALITY ── */}
      <P63ReconstructionPanel workspace={workspace} />
    </div>
  );
};
