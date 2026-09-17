/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Research Harness — Interactive Reality Editing & Observation Dashboard
 */

import React, { useMemo, useReducer, useCallback } from 'react';
import { InteractiveRealityEngine } from '../interactionEngine';
import { P62WorkspaceCanvas } from './P62WorkspaceCanvas';
import { P62InteractionPanel } from './P62InteractionPanel';
import { P62ObservationPanel } from './P62ObservationPanel';
import { P62ReconstructionPanel } from './P62ReconstructionPanel';
import { Boxes, Eye, RotateCcw, ShieldCheck } from 'lucide-react';

export const P62ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // Master P6.2 Interactive Engine
  const engine = useMemo(() => new InteractiveRealityEngine(), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const sync = engine.getSynchronizedPipeline();

  const handleOrbit = useCallback((dy: number, dp: number) => {
    engine.orbit(dy, dp);
    forceUpdate();
  }, [engine]);

  const handlePan = useCallback((dx: number, dy: number) => {
    engine.pan(dx, dy);
    forceUpdate();
  }, [engine]);

  const handleZoom = useCallback((delta: number) => {
    engine.zoom(delta);
    forceUpdate();
  }, [engine]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060608] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/70 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.2 — INTERACTIVE REALITY EDITING & OBSERVATION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Interactive Observation</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Reality X: <strong className="text-cyan-400">{sync.realityChecksum}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Frame F: <strong className="text-purple-400">{sync.frameChecksum}</strong>
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
      <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 border-b border-zinc-800 text-xs">
        <span className="text-[10px] text-zinc-500 uppercase">Camera Viewport:</span>
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
            engine.resetObserver();
            forceUpdate();
          }}
          className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Reset Cam
        </button>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: REALITY MUTATION CONTROLS */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P62InteractionPanel engine={engine} onRefresh={forceUpdate} />
        </div>

        {/* CENTER: INTERACTIVE WORKSPACE CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <div className="flex items-center justify-between w-full max-w-[540px] text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> INTERACTIVE VIEWPORT
            </span>
            <span className="text-[10px] text-zinc-500">
              Yaw: {engine.observer.yaw}° | Pitch: {engine.observer.pitch}° | Dist: {engine.observer.distance}
            </span>
          </div>

          <P62WorkspaceCanvas
            reality={engine.reality}
            observer={engine.observer}
            observableFrame={sync.observableFrame}
            selectedObjectId={engine.selection.getState().selectedObjectId}
            onSelectObject={(id) => {
              engine.selectObject(id);
              forceUpdate();
            }}
            width={540}
            height={360}
          />
        </div>

        {/* RIGHT: OBSERVATION CONTROLS & PIPELINE */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P62ObservationPanel engine={engine} onRefresh={forceUpdate} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: RECONSTRUCTION & CAUSALITY AUDIT ── */}
      <P62ReconstructionPanel engine={engine} />
    </div>
  );
};
