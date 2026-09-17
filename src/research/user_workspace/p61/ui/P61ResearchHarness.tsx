/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Research Harness — User Workspace Dashboard
 *
 * Full research environment providing independent inspection of:
 * 1. Underlying Reality X
 * 2. Observer O
 * 3. Observable Frame F
 * 4. Reconstruction R
 */

import React, { useState, useMemo, useReducer, useCallback } from 'react';
import { WorkspaceManager } from '../workspaceState';
import { P61WorkspaceCanvas } from './P61WorkspaceCanvas';
import { P61WorkspacePanel } from './P61WorkspacePanel';
import {
  Boxes,
  Database,
  Eye,
  Layers,
  Search,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

export const P61ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // Master Workspace Manager instance
  const manager = useMemo(() => new WorkspaceManager(), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const status = manager.getStatus();
  const observation = manager.observe();

  const handleOrbit = useCallback((dy: number, dp: number) => {
    manager.orbit(dy, dp);
    forceUpdate();
  }, [manager]);

  const handlePan = useCallback((dx: number, dy: number) => {
    manager.pan(dx, dy);
    forceUpdate();
  }, [manager]);

  const handleZoom = useCallback((delta: number) => {
    manager.zoom(delta);
    forceUpdate();
  }, [manager]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/70 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.1 — USER WORKSPACE & REALITY CONSTRUCTION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: User Controlled State</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Source Mode: <strong className="text-cyan-400">{manager.reality.sourceMode}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Dimension: <strong className="text-emerald-400">Z{manager.observer.dimension}</strong>
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

      {/* ── SUB-TOOLBAR: OBSERVER INTERACTION ── */}
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
            manager.resetObserver();
            forceUpdate();
          }}
          className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Reset Cam
        </button>
      </div>

      {/* ── MAIN 3-PANEL LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: WORKSPACE OBJECTS & REALITY BUILDER */}
        <div className="w-[310px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/80">
          <P61WorkspacePanel manager={manager} onRefresh={forceUpdate} />
        </div>

        {/* CENTER: WORKSPACE INTERACTIVE CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/20">
          <div className="flex items-center justify-between w-full max-w-[560px] text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> WORKSPACE VIEWPORT
            </span>
            <span className="text-[10px] text-zinc-500">
              Target: [{manager.observer.target.map((v) => v.toFixed(0)).join(',')}] | Pos: [{manager.observer.position.map((v) => v.toFixed(0)).join(',')}]
            </span>
          </div>

          <P61WorkspaceCanvas
            reality={manager.reality}
            observer={manager.observer}
            selectedObjectId={manager.selection.selectedObjectId}
            onSelectObject={(id) => {
              manager.selectObject(id);
              forceUpdate();
            }}
            width={560}
            height={380}
          />
        </div>

        {/* RIGHT: OBSERVATION & RECONSTRUCTION BRIDGE */}
        <div className="w-[330px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/80 text-[10px]">
          <div className="flex items-center gap-2 mb-2 font-bold text-cyan-400">
            <Layers className="w-3.5 h-3.5" /> OBSERVATION PIPELINE
          </div>

          {/* Separation Checklist Card */}
          <div className="p-2.5 mb-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="font-bold text-zinc-300 text-[11px] mb-1">Information Domain Separation</div>
            <div>
              <span className="text-zinc-500">Underlying Reality X:</span><br />
              <strong className="text-cyan-400">{status.realityChecksum}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Observable Frame F:</span><br />
              <strong className="text-purple-400">{observation.frameChecksum}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Observer Frame O:</span><br />
              <strong className="text-emerald-400">{status.observerChecksum}</strong>
            </div>
          </div>

          {/* Observable Frame Details */}
          <div className="p-2.5 mb-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <div className="font-bold text-zinc-300 text-[11px] mb-1">Observable Projection</div>
            <div>Visible Objects: <strong className="text-emerald-400">{observation.observableFrame.visibleCount} / {manager.reality.objects.length}</strong></div>
            <div>Active Mode: <strong>{observation.observableFrame.dimension}D Projection</strong></div>
            <div>Information Loss: <strong className="text-amber-400">{observation.informationLoss.toFixed(1)}%</strong></div>
          </div>

          {/* Reconstruction Status */}
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <div className="font-bold text-zinc-300 text-[11px] mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-cyan-400" /> P5 Reconstruction Result
            </div>
            <div>Certainty: <strong className={observation.isExactReconstruction ? 'text-emerald-400' : 'text-amber-400'}>{observation.isExactReconstruction ? 'EXACT ✓' : 'CONSTRAINED / PARTIAL'}</strong></div>
            <div>Accuracy: <strong>{(observation.reconstruction.accuracyScore * 100).toFixed(1)}%</strong></div>
            <div>Candidate Vol: <strong>{observation.reconstruction.remainingCandidateVolume.toFixed(3)}</strong></div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/90 border-t border-zinc-800 text-[10px] text-zinc-400">
        <div className="flex items-center gap-4">
          <span>Workspace Checksum: <strong className="text-zinc-200">{status.workspaceChecksum}</strong></span>
          <span>Objects: <strong className="text-zinc-200">{status.totalObjects}</strong></span>
          <span>Selected: <strong className="text-purple-400">{manager.selection.selectedObjectId || 'None'}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Undo Steps: {manager.history.getHistoryLength()}</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline" /> Canonical Data Isolated
          </span>
        </div>
      </div>
    </div>
  );
};
