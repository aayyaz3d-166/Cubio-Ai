/**
 * 3D Memory Studio — Funnel 85
 * Component: F85ResearchHarness
 *
 * Dedicated Interactive Browser Research Harness for
 * Observer Spatial Separation & Dimensional Visibility.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  F85ExperimentType,
  F85ProjectionType,
  F85ObserverState,
  F85SpatialConfiguration,
} from '../types';
import { createSpatialConfiguration } from '../core/spatialConfiguration';
import {
  createStandardObservers,
  translateObserver,
  rotateObserver,
  zoomObserver,
} from '../observer/observerSpatialView';
import { synthesizeSpatialDisplay } from '../projection/dimensionalVisibility';
import { analyzeDepthVisibility } from '../analysis/depthVisibility';
import { compareObservers } from '../observer/observerComparison';
import { F85SpatialCanvas } from './F85SpatialCanvas';
import {
  Box,
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
} from 'lucide-react';

export const F85ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // Active Experiment
  const [experimentType, setExperimentType] = useState<F85ExperimentType>('CUBE_3D');

  // Standard Observers & Selection
  const standardObservers = useMemo(() => createStandardObservers(), []);
  const [observerKey, setObserverKey] = useState<'observerA' | 'observerB' | 'observerC'>('observerA');
  const [projectionType, setProjectionType] = useState<F85ProjectionType>('PERSPECTIVE_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');

  // Dynamic Observer state
  const [activeObserver, setActiveObserver] = useState<F85ObserverState>(standardObservers.observerA);

  // Switch standard observer
  const handleSelectObserver = (k: 'observerA' | 'observerB' | 'observerC') => {
    setObserverKey(k);
    setActiveObserver(standardObservers[k]);
  };

  // Generate Spatial Configuration
  const spatialConfig: F85SpatialConfiguration = useMemo(() => {
    return createSpatialConfiguration(experimentType);
  }, [experimentType]);

  // Synthesize Display
  const display = useMemo(() => {
    return synthesizeSpatialDisplay(spatialConfig, activeObserver, projectionType, 800, 500);
  }, [spatialConfig, activeObserver, projectionType]);

  // Multi-observer comparison report
  const multiObserverReport = useMemo(() => {
    return compareObservers(spatialConfig, [
      { observer: standardObservers.observerA, projection: 'PERSPECTIVE_3D' },
      { observer: standardObservers.observerB, projection: 'PERSPECTIVE_3D' },
      { observer: standardObservers.observerC, projection: 'ORTHOGRAPHIC_3D' },
    ]);
  }, [spatialConfig, standardObservers]);

  // Depth-only comparison report
  const depthReport = useMemo(() => {
    return analyzeDepthVisibility();
  }, []);

  // Selected Object Record
  const selectedRecord = useMemo(() => {
    return display.objectRecords.find((r) => r.id === selectedObjectId) || display.objectRecords[0];
  }, [display, selectedObjectId]);

  // View presets
  const handleApplyPreset = (preset: 'TOP' | 'FRONT' | 'SIDE' | 'ISOMETRIC' | 'RESET') => {
    switch (preset) {
      case 'TOP':
        setActiveObserver({
          ...activeObserver,
          position: [0, 60, 0],
          orientation: [-90, 0],
          zoom: 1.0,
        });
        setProjectionType('ORTHOGRAPHIC_3D');
        break;
      case 'FRONT':
        setActiveObserver({
          ...activeObserver,
          position: [0, 0, 40],
          orientation: [0, 0],
          zoom: 1.0,
        });
        setProjectionType('PERSPECTIVE_3D');
        break;
      case 'SIDE':
        setActiveObserver({
          ...activeObserver,
          position: [50, 0, 0],
          orientation: [90, 0],
          zoom: 1.0,
        });
        setProjectionType('PERSPECTIVE_3D');
        break;
      case 'ISOMETRIC':
        setActiveObserver({
          ...activeObserver,
          position: [30, 30, 30],
          orientation: [45, 30],
          zoom: 1.0,
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
      {/* Top Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F85: OBSERVER SPATIAL SEPARATION & DIMENSIONAL VISIBILITY
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT [5,3,6]
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Pipeline: Reality X → Spatial Configuration S → Observer O → Projection P → Display D → Experience E
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column: Experiments & Controls */}
        <div className="w-[380px] flex flex-col gap-3.5 overflow-y-auto shrink-0">
          {/* 1. EXPERIMENT SELECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Compass className="w-3.5 h-3.5" />
                1. SPATIAL EXPERIMENT (S)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'SAME_POSITION', label: '1. Same Position' },
                { id: 'X_SEPARATION', label: '2. X Separation' },
                { id: 'Y_SEPARATION', label: '3. Y Separation' },
                { id: 'Z_DEPTH', label: '4. Z Depth Only' },
                { id: 'CUBE_3D', label: '5. 3D Cube Layout' },
                { id: 'DIMENSIONAL_Z4', label: '6. Z4 4D Space' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setExperimentType(exp.id as any)}
                  className={`p-2 text-left text-[11px] rounded-lg border transition cursor-pointer ${
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

          {/* 2. OBSERVER SELECTOR & CAMERA */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-2">
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
            </div>

            {/* Camera Controls */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500">CAMERA NAVIGATION:</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button onClick={() => setActiveObserver(translateObserver(activeObserver, 0, 5, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▲ Up</button>
                <button onClick={() => setActiveObserver(translateObserver(activeObserver, 0, -5, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▼ Down</button>
                <button onClick={() => setActiveObserver(translateObserver(activeObserver, -5, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">◄ Left</button>
                <button onClick={() => setActiveObserver(translateObserver(activeObserver, 5, 0, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">► Right</button>
                <button onClick={() => setActiveObserver(rotateObserver(activeObserver, -15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↶ Yaw-</button>
                <button onClick={() => setActiveObserver(rotateObserver(activeObserver, 15, 0))} className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↷ Yaw+</button>
              </div>

              <div className="flex gap-1.5 pt-1">
                <button onClick={() => setActiveObserver(zoomObserver(activeObserver, 1.2))} className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] flex items-center justify-center gap-1">
                  <ZoomIn className="w-3 h-3" /> Zoom In
                </button>
                <button onClick={() => setActiveObserver(zoomObserver(activeObserver, 0.8))} className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] flex items-center justify-center gap-1">
                  <ZoomOut className="w-3 h-3" /> Zoom Out
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-zinc-500">VIEW PRESETS:</span>
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
          </div>

          {/* 3. PROJECTION SELECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
              3. PROJECTION TYPE (P)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'PERSPECTIVE_3D', label: 'Perspective 3D' },
                { id: 'ORTHOGRAPHIC_3D', label: 'Orthographic 3D' },
                { id: 'ISOMETRIC_3D', label: 'Isometric 3D' },
                { id: 'DIMENSIONAL_SLICE_Z4_Z3', label: 'Z4→Z3 Slice' },
                { id: 'DIMENSIONAL_COLLAPSE_Z4_Z3', label: 'Z4→Z3 Collapse' },
                { id: 'DIMENSIONAL_PROJECT_Z3_Z2', label: 'Z3→Z2 Planar' },
                { id: 'DIMENSIONAL_PROJECT_Z2_Z1', label: 'Z2→Z1 Linear' },
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
          {/* Main Visual Spatial Canvas */}
          <F85SpatialCanvas
            display={display}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />

          {/* Telemetry & Analysis Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            {/* Selected Node Inspector */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-purple-400 border-b border-zinc-800 pb-1">
                <Database className="w-3.5 h-3.5" />
                SELECTED ENTITY TELEMETRY
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ID:</span>
                  <span className="text-white font-bold">{selectedRecord.id.replace('STATE49:', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Canonical Reality X:</span>
                  <span className="text-emerald-400 font-bold">[{selectedRecord.canonicalCoordinate.join(',')}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Exp. World Pos (S):</span>
                  <span className="text-cyan-300 font-bold">[{selectedRecord.worldPosition.join(',')}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Screen Coord (D):</span>
                  <span className="text-purple-300 font-bold">[{selectedRecord.screenPosition.map((c) => Math.round(c)).join(', ')}]</span>
                </div>
              </div>
            </div>

            {/* Screen Collision Matrix */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-amber-400 border-b border-zinc-800 pb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                SCREEN COLLISION MATRIX
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Visual Collisions:</span>
                  <span className={display.collisionReport.collisionCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {display.collisionReport.collisionCount} Pairs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Distinct Screen Pos:</span>
                  <span className="text-white font-bold">{display.collisionReport.uniqueScreenPositions} / 7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Distinguishability:</span>
                  <span className={display.collisionReport.areAllDistinct ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {display.collisionReport.areAllDistinct ? '100% DISTINGUISHABLE' : 'PARTIAL / OVERLAP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Depth Separation Analysis */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-cyan-400 border-b border-zinc-800 pb-1">
                <Activity className="w-3.5 h-3.5" />
                DEPTH SEPARATION STUDY
              </div>
              <div className="space-y-1 text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Perspective Depth:</span>
                  <span className="text-cyan-300 font-bold">{depthReport.perspectiveDistinctCount} distinct</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Orthographic Depth:</span>
                  <span className="text-amber-300 font-bold">{depthReport.orthographicDistinctCount} distinct (Collapsed)</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-0.5 leading-snug">
                  Orthographic projection along frontal ray collapses distinct Z coordinates onto identical screen pixels.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
