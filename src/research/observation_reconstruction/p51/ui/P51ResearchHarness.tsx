/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Research Harness — Browser UI
 *
 * LEFT:   Underlying Reality X (immutable state table)
 * CENTER: Observer Frame (active observer + canvas)
 * RIGHT:  Observable Projection (projected output canvas)
 * BELOW:  Frame Difference | Reconstruction | Information Loss | Trace
 *
 * Scientific boundary: This is a computational model only.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  P51Dimension,
  P51ObserverFrame,
  P51ObservableFrame,
  P51FrameDifference,
  P51ReconstructionReport,
  P51AmbiguityCase,
} from '../types';
import { createCanonicalUnderlyingState, computeStateChecksum, createVariantUnderlyingState } from '../underlyingState';
import { createObserverO0, createObserverO1, createObserverO2, createCustomObserver } from '../observerFrame';
import { projectState } from '../projection';
import { compareFrames } from '../frameDifference';
import { reconstructFromFrame } from '../reconstruction';
import { testAmbiguity, testDimensionalAmbiguity } from '../ambiguity';
import { P51ObserverCanvas } from './P51ObserverCanvas';
import {
  Eye,
  Layers,
  RotateCcw,
  Database,
  Activity,
  ShieldCheck,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';

export const P51ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // ── Immutable Underlying Reality X ──
  const underlyingState = useMemo(() => createCanonicalUnderlyingState(), []);

  // ── Observer Selection ──
  const [activeObserverId, setActiveObserverId] = useState<'O0' | 'O1' | 'O2'>('O0');
  const [dimension, setDimension] = useState<P51Dimension>(3);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // ── Camera interaction offsets (applied on top of base observer) ──
  const [orbitYaw, setOrbitYaw] = useState(0);
  const [orbitPitch, setOrbitPitch] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomDelta, setZoomDelta] = useState(0);

  const VP_W = 520;
  const VP_H = 380;

  // ── Base observers ──
  const baseO0 = useMemo(() => createObserverO0(dimension, VP_W, VP_H), [dimension]);
  const baseO1 = useMemo(() => createObserverO1(dimension, VP_W, VP_H), [dimension]);
  const baseO2 = useMemo(() => createObserverO2(dimension, VP_W, VP_H), [dimension]);

  // ── Active observer with interaction offsets ──
  const activeObserver: P51ObserverFrame = useMemo(() => {
    const base = activeObserverId === 'O0' ? baseO0 : activeObserverId === 'O1' ? baseO1 : baseO2;
    return createCustomObserver(
      base.observerId,
      base.label,
      [
        base.position[0] + panX,
        base.position[1] + panY,
        base.position[2],
      ],
      base.target,
      base.yaw + orbitYaw,
      base.pitch + orbitPitch,
      base.distance + zoomDelta,
      dimension,
      base.fov,
      VP_W,
      VP_H
    );
  }, [activeObserverId, baseO0, baseO1, baseO2, orbitYaw, orbitPitch, panX, panY, zoomDelta, dimension]);

  // ── Projection Pipeline (read-only on X) ──
  const frameF0 = useMemo(() => projectState(underlyingState, baseO0), [underlyingState, baseO0]);
  const frameF1 = useMemo(() => projectState(underlyingState, baseO1), [underlyingState, baseO1]);
  const frameF2 = useMemo(() => projectState(underlyingState, baseO2), [underlyingState, baseO2]);
  const activeFrame = useMemo(() => projectState(underlyingState, activeObserver), [underlyingState, activeObserver]);

  // ── Frame Differences ──
  const diffF0F1 = useMemo(() => compareFrames(frameF0, frameF1), [frameF0, frameF1]);
  const diffF0F2 = useMemo(() => compareFrames(frameF0, frameF2), [frameF0, frameF2]);

  // ── Reconstruction ──
  const reconstruction = useMemo(
    () => reconstructFromFrame(activeFrame, activeObserver, underlyingState),
    [activeFrame, activeObserver, underlyingState]
  );

  // ── Ambiguity Tests ──
  const variantState = useMemo(() => createVariantUnderlyingState('VARIANT_A'), []);
  const ambiguityResult = useMemo(
    () => testAmbiguity(underlyingState, variantState, activeObserver),
    [underlyingState, variantState, activeObserver]
  );
  const dimAmbiguity = useMemo(
    () => {
      const z2Observer = createObserverO0(2, VP_W, VP_H);
      return testDimensionalAmbiguity(z2Observer);
    },
    []
  );

  // ── State Invariance ──
  const stateChecksumNow = useMemo(() => computeStateChecksum(underlyingState), [underlyingState]);
  const stateInvariant = stateChecksumNow === underlyingState.checksum;

  // ── Determinism Check ──
  const determinismResult = useMemo(() => {
    const checksums = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const f = projectState(underlyingState, activeObserver);
      checksums.add(f.frameChecksum);
    }
    return { unique: checksums.size, isDeterministic: checksums.size === 1 };
  }, [underlyingState, activeObserver]);

  // ── Interaction Handlers ──
  const handleOrbit = useCallback((dy: number, dp: number) => {
    setOrbitYaw((y) => y + dy);
    setOrbitPitch((p) => Math.max(-89, Math.min(89, p + dp)));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setPanX((x) => x + dx);
    setPanY((y) => y + dy);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoomDelta((z) => Math.max(-200, Math.min(600, z + delta)));
  }, []);

  const handleReset = useCallback(() => {
    setOrbitYaw(0);
    setOrbitPitch(0);
    setPanX(0);
    setPanY(0);
    setZoomDelta(0);
    setSelectedObjectId(null);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P5.1 — OBSERVER PROJECTION & OBSERVABLE FRAME
          </span>
          <span className="text-xs text-zinc-500">Phase 5: Observation & Reconstruction</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded ${stateInvariant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            REALITY X: {stateInvariant ? 'INVARIANT ✓' : 'MUTATED ✗'}
          </span>
          <span className="text-xs text-zinc-500">Checksum: {underlyingState.checksum}</span>
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

      {/* ── Controls ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-zinc-800">
        {/* Observer Selection */}
        {(['O0', 'O1', 'O2'] as const).map((oid) => (
          <button
            key={oid}
            onClick={() => { setActiveObserverId(oid); handleReset(); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeObserverId === oid
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            }`}
          >
            {oid}
          </button>
        ))}

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Orbit */}
        <button onClick={() => handleOrbit(15, 0)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer" title="Orbit Left">◀ Orbit</button>
        <button onClick={() => handleOrbit(-15, 0)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer" title="Orbit Right">Orbit ▶</button>
        <button onClick={() => handleOrbit(0, 10)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer" title="Orbit Up">▲</button>
        <button onClick={() => handleOrbit(0, -10)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer" title="Orbit Down">▼</button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Pan */}
        <button onClick={() => handlePan(-15, 0)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">Pan ◀</button>
        <button onClick={() => handlePan(15, 0)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">Pan ▶</button>
        <button onClick={() => handlePan(0, 15)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">Pan ▲</button>
        <button onClick={() => handlePan(0, -15)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer">Pan ▼</button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Zoom */}
        <button onClick={() => handleZoom(-20)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer"><ZoomIn className="w-3 h-3 inline" /> Zoom In</button>
        <button onClick={() => handleZoom(20)} className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 rounded cursor-pointer"><ZoomOut className="w-3 h-3 inline" /> Zoom Out</button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Dimension */}
        {([3, 2, 1] as P51Dimension[]).map((d) => (
          <button
            key={d}
            onClick={() => { setDimension(d); handleReset(); }}
            className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${
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

      {/* ── Main Content: Three Columns ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Underlying Reality X */}
        <div className="w-[280px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto p-3">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">UNDERLYING REALITY X</span>
          </div>
          <div className="text-[10px] text-zinc-500 mb-2">
            State ID: {underlyingState.stateId}<br />
            Checksum: {underlyingState.checksum}<br />
            Records: {underlyingState.records.length}<br />
            <span className={stateInvariant ? 'text-emerald-400' : 'text-red-400'}>
              Invariant: {stateInvariant ? 'YES' : 'NO'}
            </span>
          </div>

          {underlyingState.records.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedObjectId(r.id === selectedObjectId ? null : r.id)}
              className={`mb-1.5 p-2 rounded-lg border cursor-pointer transition ${
                r.id === selectedObjectId
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50'
              }`}
            >
              <div className="text-[10px] font-bold text-cyan-400 truncate">{r.entityName}</div>
              <div className="text-[9px] text-zinc-500 truncate">{r.id}</div>
              <div className="text-[9px] text-zinc-400">
                pos: [{r.canonicalPosition.join(', ')}] | {r.category}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER: Observer Frame + Active Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-3 overflow-hidden">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">
              ACTIVE OBSERVER: {activeObserver.label}
            </span>
          </div>
          <P51ObserverCanvas
            frame={activeFrame}
            observer={activeObserver}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            width={VP_W}
            height={VP_H}
          />
          <div className="text-[9px] text-zinc-500 text-center">
            Yaw: {activeObserver.yaw.toFixed(0)}° | Pitch: {activeObserver.pitch.toFixed(0)}° |
            Dist: {activeObserver.distance.toFixed(0)} | Visible: {activeFrame.visibleCount}/{activeFrame.objects.length} |
            Frame: {activeFrame.frameChecksum}
          </div>
        </div>

        {/* RIGHT: Observable Projection + Comparison */}
        <div className="w-[280px] flex-shrink-0 border-l border-zinc-800 overflow-y-auto p-3">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400">OBSERVABLE FRAMES</span>
          </div>

          {/* Frame difference summary */}
          <FrameCard label="F0 (O0 Baseline)" frame={frameF0} />
          <FrameCard label="F1 (O1 Shifted)" frame={frameF1} />
          <FrameCard label="F2 (O2 Orbiting)" frame={frameF2} />

          <div className="mt-3 border-t border-zinc-800 pt-3">
            <div className="text-[10px] font-bold text-amber-400 mb-1">FRAME DIFFERENCES</div>
            <DiffCard diff={diffF0F1} />
            <DiffCard diff={diffF0F2} />
          </div>

          <div className="mt-3 border-t border-zinc-800 pt-3">
            <div className="text-[10px] font-bold text-emerald-400 mb-1">DETERMINISM</div>
            <div className={`text-[9px] ${determinismResult.isDeterministic ? 'text-emerald-400' : 'text-red-400'}`}>
              {determinismResult.isDeterministic ? '✓' : '✗'} {determinismResult.unique} unique / 10 runs
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Panel: Reconstruction, Ambiguity, Trace ── */}
      <div className="flex border-t border-zinc-800 h-[200px] overflow-hidden">
        {/* Reconstruction */}
        <div className="flex-1 border-r border-zinc-800 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400">RECONSTRUCTION RESULT</span>
          </div>
          <div className="text-[9px] text-zinc-400 mb-1">
            Observer: {reconstruction.observerId} | Observed: {reconstruction.totalObserved} |
            Exact: {reconstruction.exactMatchCount} |
            Accuracy: {(reconstruction.accuracyScore * 100).toFixed(1)}% |
            Info Loss: {(reconstruction.informationLossScore * 100).toFixed(1)}%
          </div>
          <div className={`text-[9px] mb-2 ${reconstruction.isExactReconstruction ? 'text-emerald-400' : 'text-amber-400'}`}>
            {reconstruction.isExactReconstruction ? '✓ EXACT RECONSTRUCTION' : '⚠ PARTIAL RECONSTRUCTION (information lost)'}
          </div>
          <div className="space-y-1">
            {reconstruction.reconstructedObjects.map((obj) => (
              <div key={obj.id} className="text-[8px] text-zinc-500 flex gap-2">
                <span className={obj.isExactMatch ? 'text-emerald-400' : 'text-amber-400'}>
                  {obj.isExactMatch ? '✓' : '△'}
                </span>
                <span className="text-zinc-400 truncate w-40">{obj.id.split(':')[1]}</span>
                <span>recon: [{obj.reconstructedPosition.map(v => v !== null ? v.toFixed(1) : '?').join(',')}]</span>
                <span>truth: [{obj.trueWorldPosition.join(',')}]</span>
                <span>err: {obj.positionError !== null ? obj.positionError.toFixed(4) : 'N/A'}</span>
                <span className="text-zinc-600">{obj.certainty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ambiguity */}
        <div className="flex-1 border-r border-zinc-800 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">INFORMATION LOSS / AMBIGUITY</span>
          </div>

          <AmbiguityCard label="Same-Coordinate Variant" result={ambiguityResult} />
          <AmbiguityCard label="Z2 Dimensional Collapse" result={dimAmbiguity} />
        </div>

        {/* Observation Trace */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400">OBSERVATION TRACE</span>
          </div>
          <div className="text-[9px] text-zinc-400 space-y-1">
            <div>1. Underlying State X created: {underlyingState.stateId}</div>
            <div>2. Observer {activeObserver.observerId} positioned at [{activeObserver.position.map(v => v.toFixed(0)).join(', ')}]</div>
            <div>3. Projection: {activeObserver.projectionType} / Z{activeObserver.dimension}</div>
            <div>4. Observable Frame generated: {activeFrame.frameId}</div>
            <div>5. Visible objects: {activeFrame.visibleCount} / {activeFrame.objects.length}</div>
            <div>6. Frame checksum: {activeFrame.frameChecksum}</div>
            <div>7. State invariant: {stateInvariant ? 'YES ✓' : 'NO ✗'} (checksum: {stateChecksumNow})</div>
            <div>8. Reconstruction accuracy: {(reconstruction.accuracyScore * 100).toFixed(1)}%</div>
            <div>9. Deterministic: {determinismResult.isDeterministic ? 'YES ✓' : 'NO ✗'}</div>
            <div>10. F0≠F1: {!diffF0F1.isIdentical ? 'YES ✓' : 'NO (identical)'} | F0≠F2: {!diffF0F2.isIdentical ? 'YES ✓' : 'NO (identical)'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const FrameCard: React.FC<{ label: string; frame: P51ObservableFrame }> = ({ label, frame }) => (
  <div className="mb-2 p-2 rounded border border-zinc-800 bg-zinc-900/30">
    <div className="text-[10px] font-bold text-zinc-300">{label}</div>
    <div className="text-[9px] text-zinc-500">
      Visible: {frame.visibleCount}/{frame.objects.length} |
      Checksum: {frame.frameChecksum} |
      Pixel: {frame.pixelSignature}
    </div>
  </div>
);

const DiffCard: React.FC<{ diff: P51FrameDifference }> = ({ diff }) => (
  <div className="mb-1.5 text-[9px]">
    <span className="text-zinc-500">{diff.frameAId} ↔ {diff.frameBId}: </span>
    <span className={diff.isIdentical ? 'text-zinc-500' : 'text-amber-400'}>
      {diff.isIdentical ? 'IDENTICAL' : `DIFFERENT (avg: ${diff.averageDisparity.toFixed(1)}px, max: ${diff.maxDisparity.toFixed(1)}px)`}
    </span>
  </div>
);

const AmbiguityCard: React.FC<{ label: string; result: P51AmbiguityCase }> = ({ label, result }) => (
  <div className="mb-2 p-2 rounded border border-zinc-800 bg-zinc-900/30">
    <div className="text-[10px] font-bold text-zinc-300">{label}</div>
    <div className={`text-[9px] ${result.isAmbiguityDetected ? 'text-amber-400' : 'text-emerald-400'}`}>
      {result.isAmbiguityDetected ? '⚠ AMBIGUITY DETECTED' : '✓ No ambiguity'}
    </div>
    <div className="text-[8px] text-zinc-500 mt-1">
      States different: {result.statesDifferent ? 'YES' : 'NO'} |
      Frames identical: {result.framesIdentical ? 'YES' : 'NO'} |
      Collapsed: {result.collapsedDimension}
    </div>
    <div className="text-[8px] text-zinc-600 mt-0.5">{result.description}</div>
  </div>
);
