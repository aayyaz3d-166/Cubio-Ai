/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Multi-Observer Reconstruction & Information Recovery — Research Dashboard
 *
 * Scientific boundary: This is a computational model only.
 * No claims about physical higher-dimensional beings, consciousness, or metaphysical reality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  SimulationDimension,
  ObserverFrame,
  ReconstructionIntersection,
} from '../types';
import {
  createCanonicalUnderlyingState,
  computeStateChecksum,
} from '../experimentState';
import {
  createObserverO0,
  createObserverO1,
  createObserverO2,
  createCustomObserver,
  projectStateToObserver,
} from '../multiObserver';
import { reconstructFromMultiObservers } from '../reconstruction';
import { calculateInformationGainProgression } from '../informationGain';
import { runAmbiguityResolutionExperiment } from '../ambiguity';
import { runPayloadNonRecoverabilityExperiment } from '../payloadLoss';
import { P52ObserverCanvas } from './P52ObserverCanvas';
import {
  Eye,
  Layers,
  RotateCcw,
  Database,
  Activity,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertTriangle,
  Lock,
  GitMerge,
  BarChart3,
  Search,
} from 'lucide-react';

export const P52ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // ── Immutable Underlying State X ──
  const stateTruth = useMemo(() => createCanonicalUnderlyingState(), []);

  // ── Controls ──
  const [dimension, setDimension] = useState<SimulationDimension>(2); // Default to Z2 to demonstrate multi-observer recovery
  const [selectedCombination, setSelectedCombination] = useState<'F0' | 'F0+F1' | 'F0+F2' | 'F1+F2' | 'F0+F1+F2'>('F0+F1');
  const [activeObserverView, setActiveObserverView] = useState<'O0' | 'O1' | 'O2'>('O0');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // ── Interaction Offsets for Active Observer ──
  const [orbitYaw, setOrbitYaw] = useState(0);
  const [orbitPitch, setOrbitPitch] = useState(0);
  const [zoomDelta, setZoomDelta] = useState(0);

  const VP_W = 460;
  const VP_H = 320;

  // ── Base Observers ──
  const baseO0 = useMemo(() => createObserverO0(dimension, VP_W, VP_H), [dimension]);
  const baseO1 = useMemo(() => createObserverO1(dimension, VP_W, VP_H), [dimension]);
  const baseO2 = useMemo(() => createObserverO2(dimension, VP_W, VP_H), [dimension]);

  // ── Active Observer with Offsets ──
  const activeObserver: ObserverFrame = useMemo(() => {
    const base = activeObserverView === 'O0' ? baseO0 : activeObserverView === 'O1' ? baseO1 : baseO2;
    return createCustomObserver(
      base.observerId,
      base.label,
      null,
      base.target,
      base.yaw + orbitYaw,
      base.pitch + orbitPitch,
      base.distance + zoomDelta,
      dimension,
      base.fov,
      VP_W,
      VP_H
    );
  }, [activeObserverView, baseO0, baseO1, baseO2, orbitYaw, orbitPitch, zoomDelta, dimension]);

  // ── Observable Frames ──
  const f0 = useMemo(() => projectStateToObserver(stateTruth, activeObserverView === 'O0' ? activeObserver : baseO0), [stateTruth, activeObserverView, activeObserver, baseO0]);
  const f1 = useMemo(() => projectStateToObserver(stateTruth, activeObserverView === 'O1' ? activeObserver : baseO1), [stateTruth, activeObserverView, activeObserver, baseO1]);
  const f2 = useMemo(() => projectStateToObserver(stateTruth, activeObserverView === 'O2' ? activeObserver : baseO2), [stateTruth, activeObserverView, activeObserver, baseO2]);

  // ── Combination Frames Map ──
  const activeCombinationData = useMemo(() => {
    switch (selectedCombination) {
      case 'F0':
        return { observers: [baseO0], frames: [f0] };
      case 'F0+F1':
        return { observers: [baseO0, baseO1], frames: [f0, f1] };
      case 'F0+F2':
        return { observers: [baseO0, baseO2], frames: [f0, f2] };
      case 'F1+F2':
        return { observers: [baseO1, baseO2], frames: [f1, f2] };
      case 'F0+F1+F2':
        return { observers: [baseO0, baseO1, baseO2], frames: [f0, f1, f2] };
    }
  }, [selectedCombination, baseO0, baseO1, baseO2, f0, f1, f2]);

  // ── Multi-Observer Reconstruction ──
  const reconstruction: ReconstructionIntersection = useMemo(() => {
    return reconstructFromMultiObservers(
      stateTruth,
      activeCombinationData.observers,
      activeCombinationData.frames,
      dimension
    );
  }, [stateTruth, activeCombinationData, dimension]);

  // ── All Combinations Progression for Information Gain ──
  const rF0 = useMemo(() => reconstructFromMultiObservers(stateTruth, [baseO0], [f0], dimension), [stateTruth, baseO0, f0, dimension]);
  const rF01 = useMemo(() => reconstructFromMultiObservers(stateTruth, [baseO0, baseO1], [f0, f1], dimension), [stateTruth, baseO0, baseO1, f0, f1, dimension]);
  const rF012 = useMemo(() => reconstructFromMultiObservers(stateTruth, [baseO0, baseO1, baseO2], [f0, f1, f2], dimension), [stateTruth, baseO0, baseO1, baseO2, f0, f1, f2, dimension]);

  const gainProgression = useMemo(() => {
    return calculateInformationGainProgression([rF0, rF01, rF012]);
  }, [rF0, rF01, rF012]);

  // ── Experiments ──
  const ambiguityExp = useMemo(() => runAmbiguityResolutionExperiment(), []);
  const payloadExp = useMemo(() => runPayloadNonRecoverabilityExperiment(), []);

  // ── State Invariance Check ──
  const stateChecksumNow = useMemo(() => computeStateChecksum(stateTruth), [stateTruth]);
  const isInvariant = stateChecksumNow === stateTruth.checksum;

  // ── Reset Handler ──
  const handleReset = useCallback(() => {
    setOrbitYaw(0);
    setOrbitPitch(0);
    setZoomDelta(0);
    setSelectedObjectId(null);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <GitMerge className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P5.2 — MULTI-OBSERVER RECONSTRUCTION & INFORMATION RECOVERY
          </span>
          <span className="text-xs text-zinc-500">Phase 5: Observation & Reconstruction</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded ${isInvariant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            STATE X: {isInvariant ? 'INVARIANT ✓' : 'MUTATED ✗'}
          </span>
          <span className="text-xs text-zinc-500">Checksum: {stateTruth.checksum}</span>
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

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-zinc-800">
        {/* Active Observer View Switch */}
        <span className="text-[10px] text-zinc-500 uppercase">View Observer:</span>
        {(['O0', 'O1', 'O2'] as const).map((oid) => (
          <button
            key={oid}
            onClick={() => { setActiveObserverView(oid); handleReset(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeObserverView === oid
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            }`}
          >
            {oid}
          </button>
        ))}

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Orbit Controls */}
        <button onClick={() => setOrbitYaw((y) => y + 15)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">◀ Orbit</button>
        <button onClick={() => setOrbitYaw((y) => y - 15)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">Orbit ▶</button>
        <button onClick={() => setOrbitPitch((p) => Math.min(85, p + 10))} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">▲</button>
        <button onClick={() => setOrbitPitch((p) => Math.max(-85, p - 10))} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">▼</button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Zoom */}
        <button onClick={() => setZoomDelta((z) => Math.max(-150, z - 20))} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer"><ZoomIn className="w-3 h-3 inline" /> +</button>
        <button onClick={() => setZoomDelta((z) => Math.min(300, z + 20))} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer"><ZoomOut className="w-3 h-3 inline" /> -</button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Dimension */}
        <span className="text-[10px] text-zinc-500 uppercase">Dimension:</span>
        {([3, 2, 1] as SimulationDimension[]).map((d) => (
          <button
            key={d}
            onClick={() => { setDimension(d); handleReset(); }}
            className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
              dimension === d
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-200 bg-zinc-800/50 border border-transparent'
            }`}
          >
            Z{d}
          </button>
        ))}

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* ── Main Layout: 3 Columns ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Underlying Reality X */}
        <div className="w-[280px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto p-3 bg-[#070709]/80">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">UNDERLYING REALITY X</span>
          </div>
          <div className="text-[10px] text-zinc-500 mb-3">
            State ID: {stateTruth.stateId}<br />
            Records: {stateTruth.records.length} canonical records<br />
            Invariant Contract: <span className="text-emerald-400">[5, 3, 6]</span>
          </div>

          {stateTruth.records.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedObjectId(r.id === selectedObjectId ? null : r.id)}
              className={`mb-2 p-2 rounded-lg border cursor-pointer transition ${
                r.id === selectedObjectId
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50'
              }`}
            >
              <div className="text-[10px] font-bold text-cyan-400 truncate">{r.entityName}</div>
              <div className="text-[9px] text-zinc-500 truncate">{r.id}</div>
              <div className="text-[9px] text-zinc-300">
                pos: [{r.canonicalPosition.join(', ')}]
              </div>
              <div className="text-[8px] text-amber-500/70 truncate flex items-center gap-1 mt-0.5">
                <Lock className="w-2.5 h-2.5 inline" /> {r.internalPayload}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER COLUMN: Observer Viewport */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/20">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">
              ACTIVE VIEWPORT: {activeObserver.label}
            </span>
          </div>
          <P52ObserverCanvas
            frame={activeObserverView === 'O0' ? f0 : activeObserverView === 'O1' ? f1 : f2}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            width={VP_W}
            height={VP_H}
          />
          <div className="text-[9px] text-zinc-500 text-center">
            Yaw: {activeObserver.yaw.toFixed(0)}° | Pitch: {activeObserver.pitch.toFixed(0)}° | Distance: {activeObserver.distance.toFixed(0)} | Dimension: Z{dimension}
          </div>
        </div>

        {/* RIGHT COLUMN: Observation Sets & Information Gain */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 overflow-y-auto p-3 bg-[#070709]/80">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">OBSERVATION COMBINATIONS</span>
          </div>

          {/* Combination Selector Buttons */}
          <div className="flex flex-col gap-1.5 mb-3">
            {(['F0', 'F0+F1', 'F0+F2', 'F1+F2', 'F0+F1+F2'] as const).map((comb) => (
              <button
                key={comb}
                onClick={() => setSelectedCombination(comb)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-left transition cursor-pointer flex items-center justify-between ${
                  selectedCombination === comb
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{comb}</span>
                <span className="text-[9px] text-zinc-500">
                  {comb === 'F0' ? '1 View' : comb === 'F0+F1+F2' ? '3 Views' : '2 Views'}
                </span>
              </button>
            ))}
          </div>

          {/* Information Gain Progression */}
          <div className="border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">INFORMATION GAIN PROGRESSION</span>
            </div>
            {gainProgression.map((step, idx) => (
              <div key={idx} className="mb-2 p-2 rounded bg-zinc-900/40 border border-zinc-800 text-[9px]">
                <div className="text-zinc-300 font-bold">
                  {step.fromKey} → {step.toKey}
                </div>
                <div className="text-emerald-400">
                  Information Gain: +{step.gain.toFixed(1)}%
                </div>
                <div className="text-zinc-500">
                  Loss: {step.previousLoss.toFixed(1)}% → {step.currentLoss.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Panel: Multi-Observer Reconstruction Analysis ── */}
      <div className="flex border-t border-zinc-800 h-[210px] overflow-hidden bg-black/40">
        {/* RECONSTRUCTION SUMMARY */}
        <div className="w-[340px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400">RECONSTRUCTION INTERSECTION</span>
          </div>
          <div className="text-[9px] text-zinc-400 space-y-0.5 mb-2">
            <div>Combination: <span className="text-cyan-400 font-bold">{reconstruction.combinationKey}</span> (Z{dimension})</div>
            <div>Accuracy: <span className={reconstruction.isExact ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{(reconstruction.accuracyScore * 100).toFixed(1)}%</span></div>
            <div>Info Loss: <span className="text-zinc-300">{reconstruction.informationLoss.toFixed(1)}%</span> | Gain: <span className="text-emerald-400">{reconstruction.informationGain.toFixed(1)}%</span></div>
            <div>Candidate Vol: <span className="text-zinc-300">{reconstruction.remainingCandidateVolume.toFixed(3)}</span> / {reconstruction.initialCandidateVolume}</div>
          </div>
          <div className={`text-[9px] px-2 py-1 rounded border ${
            reconstruction.isExact
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {reconstruction.isExact ? '✓ EXACT MULTI-VIEW RECONSTRUCTION' : '⚠ PARTIAL / CONSTRAINED RECONSTRUCTION'}
          </div>
        </div>

        {/* COORDINATE TRIANGULATION TABLE */}
        <div className="flex-1 border-r border-zinc-800 p-3 overflow-y-auto">
          <div className="text-[10px] font-bold text-zinc-300 mb-1.5">STRUCTURAL RECOVERY DETAILS</div>
          <div className="space-y-1">
            {reconstruction.reconstructedCoordinates.map((coord) => (
              <div key={coord.recordId} className="text-[8.5px] text-zinc-400 flex items-center gap-2">
                <span className={coord.certainty === 'EXACT' ? 'text-emerald-400' : 'text-amber-400'}>
                  {coord.certainty === 'EXACT' ? '✓' : '△'}
                </span>
                <span className="w-32 truncate text-zinc-300">{coord.recordId.split(':')[1]}</span>
                <span>Truth: [{coord.truePosition.join(',')}]</span>
                <ArrowRight className="w-2.5 h-2.5 inline text-zinc-600" />
                <span>Recon: [{coord.reconstructedPosition.map((v) => v !== null ? v.toFixed(1) : '?').join(',')}]</span>
                <span className="text-zinc-500">err: {coord.error.toFixed(2)}</span>
                <span className="text-zinc-600 font-bold">[{coord.certainty}]</span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLLED EXPERIMENTS */}
        <div className="w-[360px] flex-shrink-0 p-3 overflow-y-auto">
          <div className="text-[10px] font-bold text-amber-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 inline" /> CONTROLLED EXPERIMENTS
          </div>

          {/* Ambiguity Resolution */}
          <div className="mb-2 p-2 rounded bg-zinc-900/50 border border-zinc-800 text-[8.5px]">
            <div className="font-bold text-zinc-300">Spatial Ambiguity Resolution</div>
            <div className="text-zinc-400">
              Single View (O0): <span className="text-amber-400 font-bold">{ambiguityExp.singleObserverAmbiguity ? 'Ambiguous' : 'Resolved'}</span><br />
              Multi View (O0+O1): <span className="text-emerald-400 font-bold">{ambiguityExp.wasAmbiguityResolved ? 'Resolved ✓' : 'Ambiguous'}</span>
            </div>
            <div className="text-zinc-500 mt-0.5">{ambiguityExp.description}</div>
          </div>

          {/* Payload Non-Recoverability */}
          <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800 text-[8.5px]">
            <div className="font-bold text-zinc-300">Internal Payload Non-Recoverability</div>
            <div className="text-zinc-400">
              Geometry Recovery: <span className="text-emerald-400 font-bold">100.0%</span><br />
              Payload Recovery: <span className="text-red-400 font-bold">0.0%</span> ({payloadExp.classification})
            </div>
            <div className="text-zinc-500 mt-0.5">{payloadExp.message}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
