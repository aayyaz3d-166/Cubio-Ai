/**
 * 3D Memory Studio — Funnel 86
 * Component: F86ResearchHarness
 *
 * Dedicated Interactive Browser Research Harness for
 * Observer Field of View, Line of Sight & Occlusion.
 */

import React, { useState, useMemo } from 'react';
import {
  F86SceneType,
  F86ProjectionType,
  F86ObserverState,
  F86SpatialScene,
} from '../types';
import { createSpatialScene } from '../core/visibilityState';
import {
  createStandardF86Observers,
  translateF86Observer,
  rotateF86Observer,
  adjustFov,
} from '../observer/observerVisibility';
import { synthesizeVisibilityDisplay } from '../projection/visibilityProjection';
import { executeObserverRotationSequence } from '../observer/observerRotation';
import { testObserverVisibilityTraversal } from '../observer/observerTraversal';
import { evaluateDepthOrdering } from '../analysis/depthOrdering';
import { F86VisibilityCanvas } from './F86VisibilityCanvas';
import {
  Eye,
  Layers,
  Activity,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Compass,
  Database,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Sliders,
} from 'lucide-react';

export const F86ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [sceneType, setSceneType] = useState<F86SceneType>('OCCLUSION');
  const standardObservers = useMemo(() => createStandardF86Observers(), []);
  const [observerKey, setObserverKey] = useState<'observerA' | 'observerB' | 'observerC'>('observerA');
  const [projectionType, setProjectionType] = useState<F86ProjectionType>('PERSPECTIVE_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');

  const [activeObserver, setActiveObserver] = useState<F86ObserverState>(standardObservers.observerA);

  const handleSelectObserver = (k: 'observerA' | 'observerB' | 'observerC') => {
    setObserverKey(k);
    setActiveObserver(standardObservers[k]);
  };

  const scene: F86SpatialScene = useMemo(() => {
    return createSpatialScene(sceneType);
  }, [sceneType]);

  const display = useMemo(() => {
    return synthesizeVisibilityDisplay(scene, activeObserver, projectionType, 800, 500);
  }, [scene, activeObserver, projectionType]);

  const depthOrderingReport = useMemo(() => {
    return evaluateDepthOrdering(display);
  }, [display]);

  const rotationReport = useMemo(() => {
    return executeObserverRotationSequence(scene, standardObservers.observerA, projectionType);
  }, [scene, standardObservers, projectionType]);

  const traversalReport = useMemo(() => {
    return testObserverVisibilityTraversal(scene, standardObservers.observerA, projectionType);
  }, [scene, standardObservers, projectionType]);

  const selectedRecord = useMemo(() => {
    return display.objectRecords.find((r) => r.id === selectedObjectId) || display.objectRecords[0];
  }, [display, selectedObjectId]);

  const handleApplyPreset = (preset: 'TOP' | 'FRONT' | 'SIDE' | 'ISOMETRIC' | 'RESET') => {
    switch (preset) {
      case 'TOP':
        setActiveObserver({
          ...activeObserver,
          position: [0, 60, 0],
          orientation: [-90, 0],
        });
        setProjectionType('ORTHOGRAPHIC_3D');
        break;
      case 'FRONT':
        setActiveObserver({
          ...activeObserver,
          position: [0, 0, 40],
          orientation: [0, 0],
        });
        setProjectionType('PERSPECTIVE_3D');
        break;
      case 'SIDE':
        setActiveObserver({
          ...activeObserver,
          position: [50, 0, 0],
          orientation: [90, 0],
        });
        setProjectionType('PERSPECTIVE_3D');
        break;
      case 'ISOMETRIC':
        setActiveObserver({
          ...activeObserver,
          position: [30, 30, 30],
          orientation: [45, 30],
        });
        setProjectionType('ISOMETRIC_3D');
        break;
      case 'RESET':
        setActiveObserver(standardObservers[observerKey]);
        setProjectionType('PERSPECTIVE_3D');
        break;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-300 font-mono overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F86: FIELD OF VIEW, OCCLUSION & LINE-OF-SIGHT
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT [5,3,6]
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Pipeline: Reality X → Spatial Scene S → Observer O → View V → Projection P → Visibility & Occlusion Test → Display D
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">Canonical Reality X:</span>
            <span className="font-bold text-emerald-400">[5, 3, 6]</span>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition cursor-pointer"
            >
              Exit Harness
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column Controls */}
        <div className="w-[380px] flex flex-col gap-3.5 overflow-y-auto shrink-0">
          {/* 1. SCENE SELECTOR */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              1. EXPERIMENTAL SCENE (S)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'DIRECT', label: '1. Direct Visibility' },
                { id: 'OCCLUSION', label: '2. Occlusion Ray' },
                { id: 'PARTIAL_OCCLUSION', label: '3. Partial Occlude' },
                { id: 'OUTSIDE_FOV', label: '4. Outside FOV' },
                { id: 'BEHIND_OBSERVER', label: '5. Behind Observer' },
                { id: 'DIMENSIONAL_Z4', label: '6. Z4 4D Space' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSceneType(s.id as any)}
                  className={`p-2 text-left rounded-lg border transition cursor-pointer ${
                    sceneType === s.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. OBSERVER SELECTOR & FOV */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Eye className="w-3.5 h-3.5" />
                2. OBSERVER STATE (O)
              </span>
              <button
                onClick={() => handleApplyPreset('RESET')}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
                title="Reset Observer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['observerA', 'observerB', 'observerC'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => handleSelectObserver(k)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    observerKey === k
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {k === 'observerA' ? 'Observer A' : k === 'observerB' ? 'Observer B' : 'Observer C'}
                </button>
              ))}
            </div>

            {/* Position Telemetry */}
            <div className="p-2 bg-zinc-950/60 rounded-lg border border-zinc-800 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Pos:</span>
                <span className="text-white font-bold">[{activeObserver.position.map((c) => c.toFixed(0)).join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Orient:</span>
                <span className="text-white font-bold">[{activeObserver.orientation.map((c) => c.toFixed(0)).join(', ')}]°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">FOV:</span>
                <span className="text-amber-400 font-bold">{activeObserver.horizontalFov}° H × {activeObserver.verticalFov}° V</span>
              </div>
            </div>

            {/* FOV Controls */}
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setActiveObserver(adjustFov(activeObserver, -10))}
                className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] font-bold"
              >
                FOV − (Narrow)
              </button>
              <button
                onClick={() => setActiveObserver(adjustFov(activeObserver, 10))}
                className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] font-bold"
              >
                FOV + (Wide)
              </button>
            </div>

            {/* Camera Navigation */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-zinc-500">CAMERA NAVIGATION:</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button onClick={() => setActiveObserver(translateF86Observer(activeObserver, 0, 5, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▲ Up</button>
                <button onClick={() => setActiveObserver(translateF86Observer(activeObserver, 0, -5, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▼ Down</button>
                <button onClick={() => setActiveObserver(translateF86Observer(activeObserver, -5, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">◄ Left</button>
                <button onClick={() => setActiveObserver(translateF86Observer(activeObserver, 5, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">► Right</button>
                <button onClick={() => setActiveObserver(rotateF86Observer(activeObserver, -15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↶ Yaw-</button>
                <button onClick={() => setActiveObserver(rotateF86Observer(activeObserver, 15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↷ Yaw+</button>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1 pt-1 text-[10px]">
              {(['TOP', 'FRONT', 'SIDE', 'ISOMETRIC', 'RESET'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handleApplyPreset(p)}
                  className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-center text-zinc-400 hover:text-white font-bold cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 3. PROJECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
              3. PROJECTION (P)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'PERSPECTIVE_3D', label: 'Perspective 3D' },
                { id: 'ORTHOGRAPHIC_3D', label: 'Orthographic 3D' },
                { id: 'ISOMETRIC_3D', label: 'Isometric 3D' },
                { id: 'DIMENSIONAL_SLICE_Z4_Z3', label: 'Z4→Z3 Slice' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProjectionType(p.id as any)}
                  className={`p-1.5 text-left rounded-lg border transition cursor-pointer ${
                    projectionType === p.id
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Canvas & Telemetry */}
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {/* Main Visual Visibility Canvas */}
          <F86VisibilityCanvas
            display={display}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />

          {/* Telemetry & Analysis Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            {/* Selected Node Telemetry */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-purple-400 border-b border-zinc-800 pb-1">
                <Database className="w-3.5 h-3.5" />
                SELECTED OBJECT TELEMETRY
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ID:</span>
                  <span className="text-white font-bold">{selectedRecord.id.replace('STATE49:', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className={selectedRecord.visible ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedRecord.visibilityReason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Depth Distance:</span>
                  <span className="text-cyan-300 font-bold">{selectedRecord.depthZ.toFixed(2)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Line of Sight:</span>
                  <span className={selectedRecord.lineOfSight === 'CLEAR' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedRecord.lineOfSight}
                  </span>
                </div>
                {selectedRecord.occludedBy && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Occluded By:</span>
                    <span className="text-amber-400 font-bold">{selectedRecord.occludedBy.replace('STATE49:', '')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Occlusion Breakdown */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-amber-400 border-b border-zinc-800 pb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                OCCLUSION SUMMARY
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Fully Visible:</span>
                  <span className="text-emerald-400 font-bold">{display.occlusionReport.totalVisible} / 7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Occluded Nodes:</span>
                  <span className="text-amber-400 font-bold">{display.occlusionReport.totalOccluded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Outside Frustum:</span>
                  <span className="text-rose-400 font-bold">{display.occlusionReport.totalOutsideFov}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Behind Observer:</span>
                  <span className="text-purple-400 font-bold">{display.occlusionReport.totalBehindObserver}</span>
                </div>
              </div>
            </div>

            {/* Depth Range & Invariance */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-cyan-400 border-b border-zinc-800 pb-1">
                <Activity className="w-3.5 h-3.5" />
                DEPTH ORDERING & DETERMINISM
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Depth Range:</span>
                  <span className="text-white font-bold">{depthOrderingReport.depthRange[0].toFixed(1)} → {depthOrderingReport.depthRange[1].toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rotation 360° Reversible:</span>
                  <span className="text-emerald-400 font-bold">{rotationReport.is360ExactRestoration ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Traversal Reversible:</span>
                  <span className="text-emerald-400 font-bold">{traversalReport.isFullyReversible ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reality X Invariant:</span>
                  <span className="text-emerald-400 font-bold">TRUE [5, 3, 6]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
