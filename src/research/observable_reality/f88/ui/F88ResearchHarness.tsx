/**
 * 3D Memory Studio — Funnel 88
 * Component: F88ResearchHarness
 *
 * Dedicated Interactive Browser Research Harness for
 * Observer Information Loss & Reconstruction.
 */

import React, { useState, useMemo } from 'react';
import {
  F88ExperimentType,
  F88ProjectionType,
  F88ObserverState,
  F88SpatialState,
} from '../types';
import { createInformationState } from '../core/informationState';
import { attemptInverseReconstruction } from '../core/reconstructionState';
import { groupObservationEquivalenceClasses } from '../core/equivalenceClass';
import { synthesizeInformationDisplay } from '../projection/informationProjection';
import { evaluateInformationLoss } from '../analysis/informationLoss';
import { evaluateMultiObserverInformationFusion } from '../analysis/multiObserverInformation';
import { analyzeReversibilityBoundary } from '../analysis/reversibilityBoundary';
import { F88InformationCanvas } from './F88InformationCanvas';
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
  FileQuestion,
} from 'lucide-react';

export const F88ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [experimentType, setExperimentType] = useState<F88ExperimentType>('DEPTH_AMBIGUITY');
  const [variation, setVariation] = useState<number>(0);
  const [projectionType, setProjectionType] = useState<F88ProjectionType>('ORTHOGRAPHIC_3D');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('STATE49:REC_W3C_LDP_CONTAINER');

  const standardObserverA: F88ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_A',
      name: 'Frontal Observer',
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

  const standardObserverB: F88ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_B',
      name: 'Oblique Observer',
      position: [25, 20, 35],
      orientation: [10, 25],
      zoom: 1.0,
      fovDegrees: 60,
      nearPlane: 1.0,
      farPlane: 200.0,
      focalLength: 300,
    }),
    []
  );

  const standardObserverC: F88ObserverState = useMemo(
    () => ({
      observerId: 'OBSERVER_C',
      name: 'Top-Down Observer',
      position: [0, 60, 0],
      orientation: [-90, 0],
      zoom: 1.0,
      fovDegrees: 60,
      nearPlane: 1.0,
      farPlane: 200.0,
      focalLength: 300,
    }),
    []
  );

  const [activeObserver, setActiveObserver] = useState<F88ObserverState>(standardObserverA);

  const state: F88SpatialState = useMemo(() => {
    return createInformationState(experimentType, variation);
  }, [experimentType, variation]);

  const display = useMemo(() => {
    return synthesizeInformationDisplay(state, activeObserver, projectionType, 800, 500);
  }, [state, activeObserver, projectionType]);

  // Equivalence class calculation for Depth Ambiguity across variations 0, 1, 2
  const equivalenceReport = useMemo(() => {
    const states = [
      createInformationState('DEPTH_AMBIGUITY', 0),
      createInformationState('DEPTH_AMBIGUITY', 1),
      createInformationState('DEPTH_AMBIGUITY', 2),
    ];
    const pairs = states.map((s) => ({
      state: s,
      display: synthesizeInformationDisplay(s, standardObserverA, 'ORTHOGRAPHIC_3D'),
    }));
    return groupObservationEquivalenceClasses(pairs);
  }, [standardObserverA]);

  const reconResult = useMemo(() => {
    return attemptInverseReconstruction(display, state);
  }, [display, state]);

  const infoLoss = useMemo(() => {
    return evaluateInformationLoss(state, display);
  }, [state, display]);

  const multiFusion = useMemo(() => {
    const dA = synthesizeInformationDisplay(state, standardObserverA, projectionType);
    const dB = synthesizeInformationDisplay(state, standardObserverB, projectionType);
    const dC = synthesizeInformationDisplay(state, standardObserverC, projectionType);
    return evaluateMultiObserverInformationFusion([dA, dB, dC]);
  }, [state, standardObserverA, standardObserverB, standardObserverC, projectionType]);

  const reversibility = useMemo(() => {
    return analyzeReversibilityBoundary(true, display.informationMetrics.isInverseUnique, equivalenceReport[0]?.classSize || 1);
  }, [display, equivalenceReport]);

  const selectedRecord = useMemo(() => {
    return (
      display.objectRecords.find((r) => r.id === selectedObjectId) ||
      display.objectRecords[0]
    );
  }, [display, selectedObjectId]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-300 font-mono overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 px-6 bg-[#0d0d12] border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              F88: INFORMATION LOSS & RECONSTRUCTION RESEARCH
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                X INVARIANT [5,3,6]
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              Research Question: "Can different underlying realities produce the same observer display?"
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
          {/* 1. EXPERIMENT SELECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              1. RESEARCH EXPERIMENT
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'DEPTH_AMBIGUITY', label: '1. Depth Ambiguity' },
                { id: 'UNIQUE_RECONSTRUCTION', label: '2. Unique Recon' },
                { id: 'PERSPECTIVE_AMBIGUITY', label: '3. Perspective Ambiguity' },
                { id: 'OCCLUSION_LOSS', label: '4. Occlusion Loss' },
                { id: 'FOV_LOSS', label: '5. FOV Loss' },
                { id: 'PROJECTION_COLLAPSE', label: '6. Projection Collapse' },
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

            {/* Variation Switcher for Equivalence Testing */}
            <div className="pt-1 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500">REALITY STATE VARIATION (X):</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {[0, 1, 2].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariation(v)}
                    className={`py-1 rounded border text-center font-bold transition cursor-pointer ${
                      variation === v
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    State X_{v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. OBSERVER & PROJECTION */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
              2. PROJECTION & OBSERVER
            </div>

            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {[
                { obs: standardObserverA, label: 'Observer A' },
                { obs: standardObserverB, label: 'Observer B' },
                { obs: standardObserverC, label: 'Observer C' },
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
                { id: 'ORTHOGRAPHIC_3D', label: 'Orthographic 3D' },
                { id: 'PERSPECTIVE_3D', label: 'Perspective 3D' },
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

          {/* 3. EQUIVALENCE CLASS STATUS */}
          <div className="bg-[#0f0f14] p-3.5 rounded-xl border border-zinc-800 space-y-1.5 shadow-md">
            <div className="text-xs font-bold text-white border-b border-zinc-800 pb-1 flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              EQUIVALENCE CLASS DIAGNOSTIC
            </div>
            <div className="p-2 bg-zinc-950/80 rounded border border-zinc-800 text-[10.5px] space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Display Hash:</span>
                <span className="text-cyan-400 font-mono font-bold">{display.displayChecksum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">State Equivalence:</span>
                <span className={display.informationMetrics.isInverseUnique ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {display.informationMetrics.isInverseUnique ? '1:1 BIJECTION' : '1-TO-MANY MULTIPLICITY'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 pt-0.5 leading-tight">
                {display.informationMetrics.isInverseUnique
                  ? 'Display uniquely identifies spatial state X.'
                  : 'Multiple distinct spatial states X generate this identical display representation.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Bottom Telemetry */}
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {/* Main Visual Information Canvas */}
          <F88InformationCanvas
            state={state}
            display={display}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />

          {/* Bottom Telemetry Panels */}
          <div className="grid grid-cols-4 gap-3.5">
            {/* 1. Information Retained vs Lost */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-cyan-400 border-b border-zinc-800 pb-1">
                1. INFORMATION BOUNDARY
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-emerald-400">Retained: {display.informationMetrics.visibleObjectsInDisplay} objects (2D)</div>
                <div className="text-rose-400">Lost: {display.informationMetrics.hiddenObjectsCount} objects / Z-depth</div>
                <div className="text-zinc-500">Ambiguity Score: {display.informationMetrics.ambiguityScore}</div>
              </div>
            </div>

            {/* 2. Reconstruction Result */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-purple-400 border-b border-zinc-800 pb-1">
                2. RECONSTRUCTION D → X'
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className={reconResult.isExactReconstruction ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {reconResult.isExactReconstruction ? 'EXACT MATCH' : 'AMBIGUOUS MATCH'}
                </div>
                <div className="text-zinc-400">Confidence: {Math.round(reconResult.confidenceScore * 100)}%</div>
                <div className="text-zinc-500">Multiplicity: {display.informationMetrics.reconstructionMultiplicity} states</div>
              </div>
            </div>

            {/* 3. Multi-Observer Fusion */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-emerald-400 border-b border-zinc-800 pb-1">
                3. MULTI-OBSERVER FUSION
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-white">Fused Observers: 3</div>
                <div className="text-emerald-400">Ambiguity: {multiFusion.combinedAmbiguityScore}</div>
                <div className="text-zinc-500">Un-occluded: {multiFusion.totalUniqueVisibleObjectsAcrossObservers}/7</div>
              </div>
            </div>

            {/* 4. Scientific Demarcation & Invariance */}
            <div className="bg-[#0f0f14] p-3 rounded-xl border border-zinc-800 space-y-1">
              <div className="text-[11px] font-bold text-amber-400 border-b border-zinc-800 pb-1">
                4. REVERSIBILITY BOUNDARY
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="text-white">Forward: Deterministic</div>
                <div className="text-amber-300">Inverse: Non-Unique (1-to-Many)</div>
                <div className="text-emerald-400 font-bold">X Invariant: [5, 3, 6]</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
