/**
 * 3D Memory Studio — Funnel 87
 * Component: F87ResearchHarness
 *
 * Dedicated Interactive Browser Research Harness for
 * Observer Parallax, Depth Cues & Motion.
 */

import React, { useState, useMemo } from 'react';
import {
  F87ExperimentType,
  F87ProjectionType,
  F87ObserverState,
  F87SpatialState,
} from '../types';
import { createSpatialState } from '../core/spatialState';
import {
  createStandardF87Observers,
  translateF87Observer,
  rotateF87Observer,
  zoomF87Observer,
} from '../observer/observerState';
import { synthesizeParallaxDisplay } from '../projection/parallaxProjection';
import { executeMotionSequence } from '../observer/observerMotion';
import { executeOrbitSequence } from '../observer/observerOrbit';
import { F87ParallaxCanvas } from './F87ParallaxCanvas';
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
  Sliders,
  Move,
} from 'lucide-react';

export const F87ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [experimentType, setExperimentType] = useState<F87ExperimentType>('PARALLAX_X');
  const standardObservers = useMemo(() => createStandardF87Observers(), []);
  const [observerKey, setObserverKey] = useState<'observerA' | 'observerB' | 'observerC'>('observerA');
  const [projectionType, setProjectionType] = useState<F87ProjectionType>('PERSPECTIVE_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');

  const [activeObserver, setActiveObserver] = useState<F87ObserverState>(standardObservers.observerA);

  const handleSelectObserver = (k: 'observerA' | 'observerB' | 'observerC') => {
    setObserverKey(k);
    setActiveObserver(standardObservers[k]);
  };

  const state: F87SpatialState = useMemo(() => {
    return createSpatialState(experimentType);
  }, [experimentType]);

  const baselineDisplay = useMemo(() => {
    return synthesizeParallaxDisplay(state, standardObservers.observerA, projectionType, null, 800, 500);
  }, [state, standardObservers, projectionType]);

  const currentDisplay = useMemo(() => {
    return synthesizeParallaxDisplay(state, activeObserver, projectionType, baselineDisplay, 800, 500);
  }, [state, activeObserver, projectionType, baselineDisplay]);

  const motionReport = useMemo(() => {
    return executeMotionSequence(state, standardObservers.observerA, projectionType);
  }, [state, standardObservers, projectionType]);

  const orbitReport = useMemo(() => {
    return executeOrbitSequence(state, 40, 0, projectionType);
  }, [state, projectionType]);

  const selectedRecord = useMemo(() => {
    return (
      currentDisplay.objectRecords.find((r) => r.id === selectedObjectId) ||
      currentDisplay.objectRecords[0]
    );
  }, [currentDisplay, selectedObjectId]);

  const handleReset = () => {
    setActiveObserver(standardObservers[observerKey]);
    setProjectionType('PERSPECTIVE_3D');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-300 font-mono overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Move className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F87: OBSERVER PARALLAX, DEPTH CUES & MOTION
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT [5,3,6]
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Pipeline: Reality X → Spatial State S → Observer O → Relative Geometry V → Projection P → Parallax D → Experience E
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
        {/* Left Panel: Configuration & Camera */}
        <div className="w-[380px] flex flex-col gap-3.5 overflow-y-auto shrink-0">
          {/* 1. EXPERIMENT SELECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              1. PARALLAX EXPERIMENT (S)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'DEPTH_STACK', label: '1. Depth Stack' },
                { id: 'PARALLAX_X', label: '2. Parallax X Shift' },
                { id: 'PARALLAX_Y', label: '3. Parallax Y Shift' },
                { id: 'ORBIT_PARALLAX', label: '4. Orbit Parallax' },
                { id: 'DEPTH_ORDER', label: '5. Depth Ordering' },
                { id: 'DIMENSIONAL_PARALLAX', label: '6. Z4 4D Space' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setExperimentType(exp.id as any)}
                  className={`p-2 text-left rounded-lg border transition cursor-pointer ${
                    experimentType === exp.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. OBSERVER & MOTION CONTROLS */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Eye className="w-3.5 h-3.5" />
                2. OBSERVER MOTION (O)
              </span>
              <button
                onClick={handleReset}
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
                <span className="text-zinc-500">Position (O):</span>
                <span className="text-white font-bold">[{activeObserver.position.map((c) => c.toFixed(0)).join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Orientation:</span>
                <span className="text-white font-bold">[{activeObserver.orientation.map((c) => c.toFixed(0)).join(', ')}]°</span>
              </div>
            </div>

            {/* Motion Buttons */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-zinc-500">TRANSLATION & PARALLAX:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button onClick={() => setActiveObserver(translateF87Observer(activeObserver, -10, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">◄ Move Left</button>
                <button onClick={() => setActiveObserver(translateF87Observer(activeObserver, 10, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">► Move Right</button>
                <button onClick={() => setActiveObserver(translateF87Observer(activeObserver, 0, 10, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▲ Move Up</button>
                <button onClick={() => setActiveObserver(translateF87Observer(activeObserver, 0, -10, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▼ Move Down</button>
                <button onClick={() => setActiveObserver(rotateF87Observer(activeObserver, -15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↶ Orbit Left</button>
                <button onClick={() => setActiveObserver(rotateF87Observer(activeObserver, 15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↷ Orbit Right</button>
              </div>

              <div className="flex gap-1.5 pt-1">
                <button onClick={() => setActiveObserver(zoomF87Observer(activeObserver, 1.2))} className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] flex items-center justify-center gap-1">
                  <ZoomIn className="w-3 h-3" /> Zoom In
                </button>
                <button onClick={() => setActiveObserver(zoomF87Observer(activeObserver, 0.8))} className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] flex items-center justify-center gap-1">
                  <ZoomOut className="w-3 h-3" /> Zoom Out
                </button>
              </div>
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

        {/* Right Column: Visualization & Bottom Telemetry */}
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {/* Main Visual Parallax Canvas */}
          <F87ParallaxCanvas
            display={currentDisplay}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />

          {/* Telemetry Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            {/* Parallax Differential Metrics */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-emerald-400 border-b border-zinc-800 pb-1">
                <Activity className="w-3.5 h-3.5" />
                PARALLAX DIFFERENTIAL
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ΔNear Shift:</span>
                  <span className="text-emerald-400 font-bold">
                    [{currentDisplay.parallaxMeasurement?.deltaScreenNear.join(', ') || '0, 0'}] px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ΔFar Shift:</span>
                  <span className="text-blue-400 font-bold">
                    [{currentDisplay.parallaxMeasurement?.deltaScreenFar.join(', ') || '0, 0'}] px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Parallax Difference:</span>
                  <span className="text-amber-400 font-bold">
                    {currentDisplay.parallaxMeasurement?.totalParallaxDifference.toFixed(2) || '0.00'} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Parallax Detected:</span>
                  <span className={currentDisplay.parallaxMeasurement?.isParallaxDetected ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                    {currentDisplay.parallaxMeasurement?.isParallaxDetected ? 'TRUE (Active)' : 'NONE / ZERO'}
                  </span>
                </div>
              </div>
            </div>

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
                  <span className="text-zinc-500">Depth Distance:</span>
                  <span className="text-cyan-300 font-bold">{selectedRecord.depthZ.toFixed(2)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Screen Coord (D):</span>
                  <span className="text-purple-300 font-bold">
                    [{selectedRecord.screenPosition.map((c) => Math.round(c)).join(', ')}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Depth Rank:</span>
                  <span className="text-white font-bold">#{selectedRecord.depthRank} / 7</span>
                </div>
              </div>
            </div>

            {/* Invariants & Determinism */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-cyan-400 border-b border-zinc-800 pb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                INVARIANTS & INTEGRITY
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Motion Reversible:</span>
                  <span className="text-emerald-400 font-bold">{motionReport.isExactRestoration ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Orbit 360° Reversible:</span>
                  <span className="text-emerald-400 font-bold">{orbitReport.is360Restoration ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Display Checksum:</span>
                  <span className="text-zinc-400 font-mono text-[10px]">{currentDisplay.displayChecksum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reality X:</span>
                  <span className="text-emerald-400 font-bold">IMMUTABLE [5,3,6]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
