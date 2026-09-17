/**
 * 3D Memory Studio — Funnel 89
 * Component: F89ResearchHarness
 *
 * Dedicated Interactive Browser Research Harness for
 * Observer-Dependent Reality Reconstruction.
 */

import React, { useState, useMemo } from 'react';
import {
  F89CertaintyState,
  F89ExperimentType,
  F89ObserverState,
  F89ProjectionType,
  F89SpatialState,
} from '../types';
import { createSpatialState } from '../core/spatialState';
import { synthesizeObservationDisplay } from '../projection/observationPipeline';
import { buildReconstructedReality } from '../core/reconstructionModel';
import { accumulateObservationHistory } from '../core/observationHistory';
import { fuseMultiObserverReconstructions } from '../analysis/multiObserverFusion';
import { analyzeReversibilityState } from '../analysis/reversibilityAnalysis';
import { F89ReconstructionCanvas } from './F89ReconstructionCanvas';
import {
  Compass,
  Layers,
  Activity,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Move,
  History,
  Eye,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Users,
} from 'lucide-react';

export const F89ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [experimentType, setExperimentType] = useState<F89ExperimentType>('OCCLUDED_OBJECT');
  const [variation, setVariation] = useState<number>(0);
  const [projectionType, setProjectionType] = useState<F89ProjectionType>('PERSPECTIVE_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');
  const [historyStepIndex, setHistoryStepIndex] = useState<number>(0);

  const initialObserverA: F89ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_A',
      name: 'Frontal Perspective Observer',
      position: [0, 0, 40],
      orientation: [0, 0],
      zoom: 1.0,
      fovDegrees: 60,
      nearPlane: 1.0,
      farPlane: 200.0,
      focalLength: 300,
    }),
    []
  );

  const observerB: F89ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_B',
      name: 'Lateral Right Observer (+20, 0, 40)',
      position: [20, 0, 40],
      orientation: [0, 0],
      zoom: 1.0,
      fovDegrees: 60,
      nearPlane: 1.0,
      farPlane: 200.0,
      focalLength: 300,
    }),
    []
  );

  const observerC: F89ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_C',
      name: 'Lateral Left Observer (-20, 0, 40)',
      position: [-20, 0, 40],
      orientation: [0, 0],
      zoom: 1.0,
      fovDegrees: 60,
      nearPlane: 1.0,
      farPlane: 200.0,
      focalLength: 300,
    }),
    []
  );

  const [activeObserver, setActiveObserver] = useState<F89ObserverState>(initialObserverA);

  const state: F89SpatialState = useMemo(() => {
    return createSpatialState(experimentType, variation);
  }, [experimentType, variation]);

  const display = useMemo(() => {
    return synthesizeObservationDisplay(state, activeObserver, projectionType, 800, 500);
  }, [state, activeObserver, projectionType]);

  const reconstruction = useMemo(() => {
    return buildReconstructedReality(display, activeObserver, state);
  }, [display, activeObserver, state]);

  // Multi-observer fusion
  const multiFusion = useMemo(() => {
    const dA = synthesizeObservationDisplay(state, initialObserverA, projectionType);
    const dB = synthesizeObservationDisplay(state, observerB, projectionType);
    const dC = synthesizeObservationDisplay(state, observerC, projectionType);

    const rA = buildReconstructedReality(dA, initialObserverA, state);
    const rB = buildReconstructedReality(dB, observerB, state);
    const rC = buildReconstructedReality(dC, observerC, state);

    return fuseMultiObserverReconstructions([rA, rB, rC], state);
  }, [state, initialObserverA, observerB, observerC, projectionType]);

  // Observation history sequence
  const history = useMemo(() => {
    const o0: F89ObserverState = { ...initialObserverA, observerId: 'O0_START' };
    const o1: F89ObserverState = { ...initialObserverA, position: [20, 0, 40], observerId: 'O1_MOVE_RIGHT' };
    const o2: F89ObserverState = { ...initialObserverA, position: [20, 20, 35], orientation: [10, 20], observerId: 'O2_OBLIQUE' };
    const o3: F89ObserverState = { ...initialObserverA, position: [0, 50, 10], orientation: [-80, 0], observerId: 'O3_ELEVATED' };

    const steps = [o0, o1, o2, o3].map((obs) => ({
      observer: obs,
      display: synthesizeObservationDisplay(state, obs, projectionType),
    }));

    return accumulateObservationHistory(steps, state);
  }, [state, initialObserverA, projectionType]);

  const activeReconstruction = useMemo(() => {
    if (experimentType === 'MULTI_OBSERVER') return multiFusion.combinedReconstruction;
    if (experimentType === 'OBSERVATION_HISTORY') {
      return history.steps[historyStepIndex]?.cumulativeReconstruction || history.finalReconstruction;
    }
    return reconstruction;
  }, [experimentType, multiFusion, history, historyStepIndex, reconstruction]);

  const reversibility = useMemo(() => {
    return analyzeReversibilityState(activeReconstruction, experimentType === 'DEPTH_AMBIGUITY' ? 3 : 1);
  }, [activeReconstruction, experimentType]);

  const selectedObject = useMemo(() => {
    return (
      activeReconstruction.objects.find((o) => o.id === selectedObjectId) ||
      activeReconstruction.objects[0]
    );
  }, [activeReconstruction, selectedObjectId]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-300 font-mono overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F89: OBSERVER-DEPENDENT REALITY RECONSTRUCTION
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT [5,3,6]
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Pipeline: X → S → O → V → P → D → E → R (Observer Model)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">Reality X:</span>
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
          {/* 1. EXPERIMENT SELECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              1. RESEARCH SCENE
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'OCCLUDED_OBJECT', label: '1. Occluded Object' },
                { id: 'DEPTH_AMBIGUITY', label: '2. Depth Ambiguity' },
                { id: 'OUTSIDE_FOV_OBJECT', label: '3. Outside FOV' },
                { id: 'COMPLETE_OBSERVATION', label: '4. Complete Recon' },
                { id: 'MULTI_OBSERVER', label: '5. Multi-Observer' },
                { id: 'OBSERVATION_HISTORY', label: '6. History Sequence' },
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

            {/* Observation History Step Tracker if active */}
            {experimentType === 'OBSERVATION_HISTORY' && (
              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  TEMPORAL STEP (0 → 3):
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {[0, 1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => setHistoryStepIndex(step)}
                      className={`py-1 rounded border font-bold transition cursor-pointer ${
                        historyStepIndex === step
                          ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      Step {step}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. OBSERVER & PROJECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
              2. OBSERVER & PROJECTION
            </div>

            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {[
                { obs: initialObserverA, label: 'Observer A' },
                { obs: observerB, label: 'Observer B' },
                { obs: observerC, label: 'Observer C' },
              ].map((item) => (
                <button
                  key={item.obs.observerId}
                  onClick={() => setActiveObserver(item.obs)}
                  className={`py-1 rounded border text-center font-bold transition cursor-pointer ${
                    activeObserver.observerId === item.obs.observerId
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              {[
                { id: 'PERSPECTIVE_3D', label: 'Perspective 3D' },
                { id: 'ORTHOGRAPHIC_3D', label: 'Orthographic 3D' },
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

          {/* 3. SELECTED OBJECT EPISTEMIC AUDIT */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1 flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              OBJECT RECONSTRUCTION AUDIT
            </div>
            {selectedObject && (
              <div className="p-2.5 bg-zinc-950/80 rounded border border-zinc-800 text-[10.5px] space-y-1">
                <div className="text-white font-bold">{selectedObject.label}</div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">True Reality X:</span>
                  <span className="text-emerald-400 font-bold">[{selectedObject.trueWorldPosition.join(',')}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reconstructed R:</span>
                  <span className="text-cyan-400 font-bold">
                    [{selectedObject.reconstructedPosition.map((v) => (v !== null ? v : '?')).join(',')}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status & Certainty:</span>
                  <span className="text-amber-400 font-bold">
                    {selectedObject.status} [{selectedObject.certainty}]
                  </span>
                </div>
                {selectedObject.ambiguityReason && (
                  <div className="text-[9.5px] text-rose-400 pt-0.5 border-t border-zinc-800">
                    Reason: {selectedObject.ambiguityReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visualization & Bottom Telemetry */}
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {/* Main Visual Information Canvas */}
          <F89ReconstructionCanvas
            state={state}
            display={display}
            reconstruction={activeReconstruction}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />

          {/* Bottom Telemetry Panels */}
          <div className="grid grid-cols-4 gap-3.5">
            {/* 1. Knowledge State */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-cyan-400 border-b border-zinc-800 pb-1">
                1. KNOWLEDGE STATE
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-emerald-400">Known / Exact: {activeReconstruction.knownObjectsCount} / {state.objects.length}</div>
                <div className="text-amber-400">Ambiguous: {activeReconstruction.ambiguousObjectsCount}</div>
                <div className="text-rose-400">Hidden / FOV: {activeReconstruction.hiddenObjectsCount + activeReconstruction.outsideFovObjectsCount}</div>
              </div>
            </div>

            {/* 2. Certainty & Checksum */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-purple-400 border-b border-zinc-800 pb-1">
                2. MODEL CHECKSUM
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-white">Certainty: {Math.round(activeReconstruction.overallCertaintyScore * 100)}%</div>
                <div className="text-purple-300 font-mono">Hash: {activeReconstruction.reconstructionChecksum}</div>
                <div className="text-zinc-500">{activeReconstruction.isCompleteReconstruction ? 'Complete Model' : 'Partial Model'}</div>
              </div>
            </div>

            {/* 3. Multi-Observer / History */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-emerald-400 border-b border-zinc-800 pb-1">
                3. MULTI-VANTAGE FUSION
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-white">Fused Observers: 3</div>
                <div className="text-emerald-400">Fused Score: {Math.round(multiFusion.combinedCertainty * 100)}%</div>
                <div className="text-zinc-500">Unresolved: {multiFusion.unresolvedCount} objects</div>
              </div>
            </div>

            {/* 4. Epistemic Verdict */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-amber-400 border-b border-zinc-800 pb-1">
                4. REVERSIBILITY BOUNDARY
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className={reversibility.isInvertible ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {reversibility.isInvertible ? '1:1 BIJECTION R ≡ X' : `1-TO-MANY [X] (Mult: ${reversibility.reconstructionMultiplicity})`}
                </div>
                <div className="text-emerald-400 font-bold">X Invariant: [5, 3, 6]</div>
                <div className="text-zinc-500">No invented coordinates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
