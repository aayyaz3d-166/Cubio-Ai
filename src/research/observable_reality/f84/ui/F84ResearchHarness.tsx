/**
 * 3D Memory Studio — Funnel 84
 * Component: F84ResearchHarness
 *
 * Dedicated Isolated Browser Research Visualization Harness for
 * Observer Experience & Perceptual Projection Pipeline.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  FullState,
  ObserverState,
  F84ProjectionType,
  MultiObserverComparisonReport,
  ProjectionReversibilityReport,
  RealityInvarianceReport,
} from '../types';
import { createStandardResearchObservers } from '../observer/observerState';
import { ObserverController } from '../observer/observerController';
import { createProjectionState } from '../core/projectionState';
import { synthesizeObserverExperience } from '../core/observerExperience';
import { analyzeRealityInvariance } from '../analysis/realityInvariance';
import { compareMultipleObservers } from '../analysis/multiObserverComparison';
import { testProjectionReversibility } from '../analysis/projectionReversibility';
import { ObservationTimelineManager } from '../temporal/observationTimeline';
import { F84ObserverCanvas } from './F84ObserverCanvas';
import {
  Eye,
  Layers,
  Activity,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Database,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

export const F84ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // 1. Authoritative Immutable FullState X (4D)
  const canonicalState: FullState = useMemo(() => {
    return Object.freeze({
      stateId: 'CANONICAL_REALITY_X_F84',
      dimension: 4,
      objects: Object.freeze([
        {
          id: 'STATE49:REC_W3C_LDP_CONTAINER',
          type: 'CORE_CONTAINER',
          coordinates: [5, 3, 6, 0],
          properties: { color: '#06b6d4', label: 'W3C LDP Container', category: 'STANDARDS' },
        },
        {
          id: 'STATE49:LLM_IETF_PROTOCOL_CODER_3B',
          type: 'PROTOCOL_CODER',
          coordinates: [5, 3, 6, 10],
          properties: { color: '#06b6d4', label: 'IETF Protocol Coder', category: 'AI_MODEL' },
        },
        {
          id: 'STATE49:REC_SCHEMA_ORG_CREATIVE_WORK',
          type: 'ONTOLOGY_SCHEMA',
          coordinates: [5, 3, 6, -10],
          properties: { color: '#06b6d4', label: 'Schema Creative Work', category: 'ONTOLOGY' },
        },
        {
          id: 'STATE49:REC_AI_MODEL_AUTHORIZED_EMBEDDINGS',
          type: 'EMBEDDING_CLUSTER',
          coordinates: [5, 3, 6, 20],
          properties: { color: '#06b6d4', label: 'AI Auth Embeddings', category: 'SECURITY' },
        },
        {
          id: 'STATE49:LLM_OPEN_EMBEDDING_7B',
          type: 'NEURAL_EMBEDDER',
          coordinates: [5, 3, 6, -20],
          properties: { color: '#06b6d4', label: 'Open Embedding 7B', category: 'AI_MODEL' },
        },
        {
          id: 'STATE49:LLM_W3C_ONTOLOGY_PARSER_8B',
          type: 'ONTOLOGY_REASONER',
          coordinates: [5, 3, 6, 30],
          properties: { color: '#06b6d4', label: 'W3C Ontology Parser', category: 'ONTOLOGY' },
        },
        {
          id: 'STATE49:REC_IETF_HTTP2_FRAMING',
          type: 'PROTOCOL_SPEC',
          coordinates: [5, 3, 6, -30],
          properties: { color: '#06b6d4', label: 'IETF HTTP2 Framing', category: 'PROTOCOLS' },
        },
      ]),
      stateChecksum: '5a1d1865a5e2e79a',
      metadata: Object.freeze({ authoritativeCoordinate: [5, 3, 6] }),
    });
  }, []);

  const standardObservers = useMemo(() => createStandardResearchObservers(), []);
  const [selectedObserverKey, setSelectedObserverKey] = useState<'observerA' | 'observerB' | 'observerC'>('observerA');
  const [activeProjectionType, setActiveProjectionType] = useState<F84ProjectionType>('PERSPECTIVE_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');
  const [sliceW, setSliceW] = useState(0);

  // Active controller for the selected observer
  const [obsA, setObsA] = useState<ObserverState>(standardObservers.observerA);
  const [obsB, setObsB] = useState<ObserverState>(standardObservers.observerB);
  const [obsC, setObsC] = useState<ObserverState>(standardObservers.observerC);

  const currentObserver = selectedObserverKey === 'observerA' ? obsA : selectedObserverKey === 'observerB' ? obsB : obsC;
  const setCurrentObserver = selectedObserverKey === 'observerA' ? setObsA : selectedObserverKey === 'observerB' ? setObsB : setObsC;

  // Active Projection State
  const projection = useMemo(() => {
    return createProjectionState(activeProjectionType, currentObserver.dimension, 2, { sliceW });
  }, [activeProjectionType, currentObserver.dimension, sliceW]);

  // Synthesize Experience E
  const { frame, display, experience } = useMemo(() => {
    return synthesizeObserverExperience(canonicalState, currentObserver, projection, {
      focusTargetId: selectedObjectId,
    });
  }, [canonicalState, currentObserver, projection, selectedObjectId]);

  // Invariance and Reversibility Audits
  const invarianceReport = useMemo(() => {
    return analyzeRealityInvariance(canonicalState, canonicalState);
  }, [canonicalState]);

  const multiObserverReport = useMemo(() => {
    return compareMultipleObservers(canonicalState, [obsA, obsB, obsC], projection);
  }, [canonicalState, obsA, obsB, obsC, projection]);

  const reversibilityReport = useMemo(() => {
    return testProjectionReversibility(canonicalState, standardObservers.observerA, projection);
  }, [canonicalState, standardObservers.observerA, projection]);

  // Interaction handlers
  const handleTranslate = (dx: number, dy: number, dz: number) => {
    const controller = new ObserverController(currentObserver);
    controller.translate(dx, dy, dz);
    setCurrentObserver(controller.getObserver());
  };

  const handleRotate = (dYaw: number, dPitch: number) => {
    const controller = new ObserverController(currentObserver);
    controller.rotate(dYaw, dPitch);
    setCurrentObserver(controller.getObserver());
  };

  const handleZoom = (factor: number) => {
    const controller = new ObserverController(currentObserver);
    controller.zoom(factor);
    setCurrentObserver(controller.getObserver());
  };

  const handleReset = () => {
    const baseline = standardObservers[selectedObserverKey];
    setCurrentObserver(baseline);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-300 font-mono overflow-hidden select-none">
      {/* Top Research Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F84: OBSERVER EXPERIENCE & PERCEPTUAL PROJECTION HARNESS
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Pipeline: Full Reality X → Observer Frame O → Observation Frame F → Projection P → Display D → Experience E
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">State Checksum:</span>
            <span className="font-bold text-white">{canonicalState.stateChecksum}</span>
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

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column: Reality X & Observer Controls */}
        <div className="w-[380px] flex flex-col gap-4 overflow-y-auto shrink-0">
          {/* 1. IMMUTABLE REALITY X PANEL */}
          <div className="bg-[#0f0f14] p-4 rounded-xl border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Database className="w-3.5 h-3.5" />
                1. IMMUTABLE REALITY STATE (X)
              </span>
              <span className="text-[10px] text-zinc-500">DIM: 4D (Z4)</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>State ID:</span>
                <span className="text-white font-bold">{canonicalState.stateId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Canonical Objects:</span>
                <span className="text-white font-bold">{canonicalState.objects.length} Permitted Nodes</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Authoritative Coordinate:</span>
                <span className="text-emerald-400 font-bold">[5, 3, 6] (Preserved)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Reality Checksum:</span>
                <span className="text-cyan-400 font-bold">{canonicalState.stateChecksum}</span>
              </div>
            </div>
          </div>

          {/* 2. OBSERVER SELECTOR & CONTROLS */}
          <div className="bg-[#0f0f14] p-4 rounded-xl border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Eye className="w-3.5 h-3.5" />
                2. OBSERVER SELECTION (O)
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
                  onClick={() => setSelectedObserverKey(k)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    selectedObserverKey === k
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {k === 'observerA' ? 'Observer A' : k === 'observerB' ? 'Observer B' : 'Observer C'}
                </button>
              ))}
            </div>

            {/* Position & Orientation Telemetry */}
            <div className="p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Position [X,Y,Z,W]:</span>
                <span className="text-white font-bold">[{currentObserver.position.map((c) => c.toFixed(1)).join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Orientation [Yaw,Pitch]:</span>
                <span className="text-white font-bold">[{currentObserver.orientation.slice(0, 2).map((c) => c.toFixed(1)).join(', ')}]°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Zoom Factor:</span>
                <span className="text-amber-400 font-bold">{currentObserver.zoom.toFixed(2)}x</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400">CAMERA NAVIGATION:</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button onClick={() => handleTranslate(0, 5, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▲ Up</button>
                <button onClick={() => handleTranslate(0, -5, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">▼ Down</button>
                <button onClick={() => handleTranslate(-5, 0, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">◄ Left</button>
                <button onClick={() => handleTranslate(5, 0, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">► Right</button>
                <button onClick={() => handleRotate(-15, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↶ Yaw-</button>
                <button onClick={() => handleRotate(15, 0)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded">↷ Yaw+</button>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => handleZoom(1.2)} className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs flex items-center justify-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                </button>
                <button onClick={() => handleZoom(0.8)} className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs flex items-center justify-center gap-1">
                  <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
                </button>
              </div>
            </div>
          </div>

          {/* 3. PROJECTION MODE CONTROLLER */}
          <div className="bg-[#0f0f14] p-4 rounded-xl border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Layers className="w-3.5 h-3.5" />
                3. PROJECTION TYPE (P)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'PERSPECTIVE_3D', label: 'Perspective 3D' },
                { id: 'ORTHOGRAPHIC_3D', label: 'Orthographic 3D' },
                { id: 'ISOMETRIC_3D', label: 'Isometric 3D' },
                { id: 'DIMENSIONAL_SLICE_Z4_Z3', label: 'Z4→Z3 Slicing' },
                { id: 'DIMENSIONAL_COLLAPSE_Z4_Z3', label: 'Z4→Z3 Collapse' },
                { id: 'DIMENSIONAL_PROJECT_Z3_Z2', label: 'Z3→Z2 Planar' },
                { id: 'DIMENSIONAL_PROJECT_Z2_Z1', label: 'Z2→Z1 Linear' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectionType(p.id as any)}
                  className={`p-2 text-left text-[11px] rounded-lg border transition cursor-pointer ${
                    activeProjectionType === p.id
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {activeProjectionType === 'DIMENSIONAL_SLICE_Z4_Z3' && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Slice Plane W:</span>
                  <span className="text-amber-400 font-bold">{sliceW}</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={sliceW}
                  onChange={(e) => setSliceW(Number(e.target.value))}
                  className="w-full cursor-pointer accent-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Columns: Display Output & Scientific Analysis */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* 4. DISPLAY OUTPUT CANVAS D */}
          <div className="flex-1 flex flex-col min-h-[460px]">
            <F84ObserverCanvas
              display={display}
              observer={currentObserver}
              projection={projection}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
            />
          </div>

          {/* 5. MULTI-OBSERVER COMPARISON & INVARIANCE MATRIX */}
          <div className="grid grid-cols-3 gap-4">
            {/* Multi-Observer Summary */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
                SIMULTANEOUS OBSERVERS
              </div>
              <div className="space-y-1.5 text-[11px]">
                {multiObserverReport.observerViews.map((v) => (
                  <div key={v.observerId} className="flex justify-between items-center p-1.5 bg-zinc-950/60 rounded border border-zinc-800/80">
                    <span className="font-bold text-zinc-300">{v.observerId}:</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{v.displayChecksum}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[10px] pt-1 text-emerald-400">
                  <span>Displays Distinct:</span>
                  <span className="font-bold">{multiObserverReport.allDisplaysDistinct ? 'TRUE' : 'FALSE'}</span>
                </div>
              </div>
            </div>

            {/* Reversibility Test */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-purple-400">
                <RotateCcw className="w-3.5 h-3.5" />
                REVERSIBILITY (O0 → O1 → O0)
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Initial Checksum:</span>
                  <span className="text-white font-mono text-[10px]">{reversibilityReport.initialDisplayChecksum}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Restored Checksum:</span>
                  <span className="text-white font-mono text-[10px]">{reversibilityReport.restoredDisplayChecksum}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Coordinate Variance σ²:</span>
                  <span className="text-emerald-400 font-bold">{reversibilityReport.coordinateVariance.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1">
                  <span>Reversibility Status:</span>
                  <span>{reversibilityReport.isReversible ? 'PASS (100%)' : 'FAIL'}</span>
                </div>
              </div>
            </div>

            {/* Experience Summary */}
            <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 text-amber-400">
                <Activity className="w-3.5 h-3.5" />
                OBSERVER EXPERIENCE (E)
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Perceived Objects:</span>
                  <span className="text-white font-bold">{experience.perceivedObjectCount} / 7</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Selected Node:</span>
                  <span className="text-purple-300 font-bold">{selectedObjectId ? selectedObjectId.replace('STATE49:', '') : 'NONE'}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 leading-snug">
                  {experience.experienceSummary}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
