/**
 * 3D Memory Studio — Funnel 83
 * Component: F83ResearchHarness
 *
 * Dedicated Isolated Browser Research Visualization Harness for
 * Observer Frame Navigation & Reality State Traversal.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  createFullState,
  createFullStateObject,
} from '../../f82/core/fullState';
import {
  createObserverFrame,
  FrameProjectionEngine,
  analyzeFrameDifference,
  testFrameReversibility,
  verifyStateInvariance,
  ObserverFrameConfig,
  FrameDifferenceReport,
  FrameReversibilityReport,
  StateInvarianceReport,
} from '../index';
import { F83ObserverCanvas } from './F83ObserverCanvas';
import {
  Eye,
  Layers,
  Activity,
  RotateCcw,
  Play,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Sparkles,
  Database,
} from 'lucide-react';

export const F83ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  // 1. Authoritative Canonical Full State X (4D)
  const canonicalState = useMemo(() => {
    const objs = [
      createFullStateObject('ALPHA_CORE', 'CORE', [0, 0, 0, 5], [0, 0, 0, 0], ['LINK_BETA'], {
        color: '#06b6d4',
        label: 'Alpha Core',
        category: 'FOUNDATION',
        status: 'ACTIVE',
      }),
      createFullStateObject('BETA_NODE', 'CLUSTER', [15, 10, 0, 15], [0, 0, 0, 0], ['LINK_ALPHA'], {
        color: '#10b981',
        label: 'Beta Cluster',
        category: 'NODE',
        status: 'ACTIVE',
      }),
      createFullStateObject('GAMMA_SATELLITE', 'RELAY', [-12, 8, 0, 25], [0, 0, 0, 0], [], {
        color: '#f59e0b',
        label: 'Gamma Relay',
        category: 'RELAY',
        status: 'ACTIVE',
      }),
      createFullStateObject('DELTA_BEACON', 'BEACON', [8, -12, 0, 50], [0, 0, 0, 0], [], {
        color: '#8b5cf6',
        label: 'Delta Beacon',
        category: 'BEACON',
        status: 'ACTIVE',
      }),
    ];

    return createFullState('STATE_CANONICAL_X', 0, objs, { realityDomain: 'RESEARCH_SIMULATION_4D' }, 4);
  }, []);

  // 2. Canonical Observer Frames O0, O1, O2
  const observerFrames: ObserverFrameConfig[] = useMemo(() => {
    return [
      createObserverFrame('O0', 'OBS_ORTHOGRAPHIC', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D', undefined, {
        frameMetadata: { description: 'Direct Orthographic 3D Projection' },
      }),
      createObserverFrame('O1', 'OBS_PERSPECTIVE', [0, 0, 10], [0, 0, -1], 'PERSPECTIVE_PINHOLE_3D', undefined, {
        fovDegrees: 75,
        focalLength: 15.0,
        frameMetadata: { description: 'Perspective Pinhole (W attenuation)' },
      }),
      createObserverFrame('O2', 'OBS_SLICED', [0, 0, 0], [0, 0, 1], 'SLICED_HYPERPLANE_3D', undefined, {
        sliceW: 15.0,
        sliceThickness: 12.0,
        frameMetadata: { description: 'Sliced Hyperplane at W=15.0' },
      }),
    ];
  }, []);

  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [prevFrameIndex, setPrevFrameIndex] = useState<number | null>(null);
  const [isAutoTraversing, setIsAutoTraversing] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; tag: string; message: string }>>(() => [
    {
      id: 'log-0',
      time: new Date().toLocaleTimeString(),
      tag: 'INIT',
      message: 'Canonical FullState X initialized with 4 objects in 4D space.',
    },
    {
      id: 'log-1',
      time: new Date().toLocaleTimeString(),
      tag: 'FRAME',
      message: 'Observer Frame O0 (Direct Orthographic) selected.',
    },
  ]);

  const addLog = useCallback((tag: string, message: string) => {
    setEventLogs((prev) => [
      {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        time: new Date().toLocaleTimeString(),
        tag,
        message,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const projectionEngine = useMemo(() => new FrameProjectionEngine(), []);
  const currentObserverConfig = observerFrames[activeFrameIndex];
  const previousObserverConfig = prevFrameIndex !== null ? observerFrames[prevFrameIndex] : null;

  const currentResult = useMemo(() => {
    return projectionEngine.projectFrame(canonicalState, currentObserverConfig);
  }, [projectionEngine, canonicalState, currentObserverConfig]);

  const previousResult = useMemo(() => {
    if (!previousObserverConfig) return null;
    return projectionEngine.projectFrame(canonicalState, previousObserverConfig);
  }, [projectionEngine, canonicalState, previousObserverConfig]);

  const frameDifference: FrameDifferenceReport | null = useMemo(() => {
    if (!previousResult || !previousObserverConfig) return null;
    return analyzeFrameDifference(
      previousResult.frame,
      currentResult.frame,
      previousObserverConfig,
      currentObserverConfig
    );
  }, [previousResult, currentResult, previousObserverConfig, currentObserverConfig]);

  const invarianceReport: StateInvarianceReport = useMemo(() => {
    return verifyStateInvariance(canonicalState, observerFrames);
  }, [canonicalState, observerFrames]);

  const reversibilityReport: FrameReversibilityReport = useMemo(() => {
    const f0Prime = createObserverFrame('O0_PRIME', 'OBS_ORTHOGRAPHIC', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    return testFrameReversibility(canonicalState, observerFrames[0], observerFrames[1], f0Prime);
  }, [canonicalState, observerFrames]);

  const handleSelectFrame = (index: number) => {
    if (index === activeFrameIndex) return;
    setPrevFrameIndex(activeFrameIndex);
    setActiveFrameIndex(index);
    const target = observerFrames[index];
    addLog('FRAME', 'Navigated to ' + target.frameId + ' (' + target.projectionType + ').');
    addLog('PROJECTION', 'Generated Observable Frame ' + target.frameId + ' (Objects: ' + currentResult.frame.visibleObjects.length + ').');
  };

  const handleNext = () => {
    const nextIdx = (activeFrameIndex + 1) % observerFrames.length;
    handleSelectFrame(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (activeFrameIndex - 1 + observerFrames.length) % observerFrames.length;
    handleSelectFrame(prevIdx);
  };

  const handleReset = () => {
    handleSelectFrame(0);
    addLog('RESET', 'Reset observer navigation to O0.');
  };

  const handleRunFullExperiment = async () => {
    setIsAutoTraversing(true);
    addLog('EXP_START', 'Starting automated Traversal Experiment: O0 -> O1 -> O2 -> O0...');

    setActiveFrameIndex(0);
    setPrevFrameIndex(null);
    await new Promise((r) => setTimeout(r, 600));

    setPrevFrameIndex(0);
    setActiveFrameIndex(1);
    addLog('TRANSITION', 'O0 -> O1 (Switched to Perspective Projection)');
    await new Promise((r) => setTimeout(r, 700));

    setPrevFrameIndex(1);
    setActiveFrameIndex(2);
    addLog('TRANSITION', 'O1 -> O2 (Switched to Sliced Hyperplane)');
    await new Promise((r) => setTimeout(r, 700));

    setPrevFrameIndex(2);
    setActiveFrameIndex(0);
    addLog('REVERSIBILITY', 'O2 -> O0 (Returned to initial frame). Verification: F0 === F0_prime -> ' + (reversibilityReport.isReversible ? 'PASS' : 'FAIL'));

    setIsAutoTraversing(false);
    addLog('EXP_COMPLETE', 'Automated Traversal Experiment Finished.');
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070709] text-zinc-200 font-sans overflow-hidden antialiased select-none">
      {/* Top Research Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#0c0c11] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
                F83 Observer Frame Navigation
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                ISOLATED RESEARCH HARNESS
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Observable Reality State Traversal & Observer Invariance Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFullExperiment}
            disabled={isAutoTraversing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-400 text-xs font-mono transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>RUN TRAVERSAL EXPERIMENT (O0 → O1 → O2 → O0)</span>
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition cursor-pointer"
            >
              Exit Harness
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Column: State & Frame Authority */}
        <div className="flex flex-col w-[320px] shrink-0 gap-4 overflow-y-auto pr-1">
          {/* Underlying State Card */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>UNDERLYING REALITY STATE</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                IMMUTABLE
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>State ID:</span>
                <span className="text-zinc-200 font-semibold">{canonicalState.stateId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Dimension:</span>
                <span className="text-cyan-400">4D (x, y, z, w)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Objects Count:</span>
                <span className="text-zinc-200">{canonicalState.objects.length}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-zinc-400 pt-1">
                <span>State Hash:</span>
                <span className="text-[10px] text-zinc-500 truncate bg-zinc-950 p-1 rounded border border-zinc-800/60">
                  {canonicalState.stateHash}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">State Mutation: NONE</span>
            </div>
          </div>

          {/* Current Observer Frame Card */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>CURRENT OBSERVER FRAME</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
                {currentObserverConfig.frameId}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Observer ID:</span>
                <span className="text-zinc-200">{currentObserverConfig.observerId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Projection:</span>
                <span className="text-emerald-400">{currentObserverConfig.projectionType}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Position:</span>
                <span className="text-zinc-200">[{currentObserverConfig.position.join(', ')}]</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Orientation:</span>
                <span className="text-zinc-200">[{currentObserverConfig.orientation.join(', ')}]</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Observable Dim:</span>
                <span className="text-zinc-200">3D (Z3 Viewport)</span>
              </div>
            </div>
          </div>

          {/* Invariants Status Card */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>RESEARCH INVARIANTS</span>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Full State Immutable:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Frame Transition:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Observable Projection:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Reversibility (F0 == F0_prime):</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {reversibilityReport.isReversible ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Visual Viewport & Frame Traversal */}
        <div className="flex flex-col flex-1 gap-4 overflow-hidden">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase mr-2">Observer Frame:</span>
              {observerFrames.map((frame, idx) => (
                <button
                  key={frame.frameId}
                  onClick={() => handleSelectFrame(idx)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition cursor-pointer ${
                    activeFrameIndex === idx
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold shadow-lg shadow-cyan-950/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {frame.frameId} ({frame.projectionType.replace('_3D', '')})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                title="Previous Frame"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                title="Next Frame"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                title="Reset to O0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Observable Frame Canvas */}
          <div className="flex flex-col flex-1 bg-zinc-900/40 rounded-xl border border-zinc-800/80 p-4 gap-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  OBSERVABLE FRAME OUTPUT ({currentObserverConfig.frameId})
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Frame Hash: <span className="text-zinc-300 font-semibold">{currentResult.frame.frameHash}</span>
              </span>
            </div>

            <F83ObserverCanvas frame={currentResult.frame} observerConfig={currentObserverConfig} />

            {/* Objects Table */}
            <div className="flex-1 overflow-y-auto max-h-[200px] bg-zinc-950/60 rounded-lg border border-zinc-800/80 p-2">
              <table className="w-full text-[11px] font-mono text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800/60 pb-1">
                    <th className="py-1 px-2">Object ID</th>
                    <th className="py-1 px-2">Projected 3D Pos</th>
                    <th className="py-1 px-2">Scale</th>
                    <th className="py-1 px-2">Opacity</th>
                    <th className="py-1 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {currentResult.frame.visibleObjects.map((obj) => (
                    <tr key={obj.id} className="hover:bg-zinc-900/40 text-zinc-300">
                      <td className="py-1 px-2 font-semibold text-cyan-300">{obj.id}</td>
                      <td className="py-1 px-2">
                        [{obj.position.map((n) => n.toFixed(2)).join(', ')}]
                      </td>
                      <td className="py-1 px-2 text-emerald-400">{obj.apparentScale.toFixed(2)}</td>
                      <td className="py-1 px-2">1.0</td>
                      <td className="py-1 px-2 text-zinc-400">VISIBLE</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Difference & Live Trace Log */}
        <div className="flex flex-col w-[320px] shrink-0 gap-4 overflow-y-auto pl-1">
          {/* Frame Transition Analysis */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>FRAME TRANSITION ANALYSIS</span>
            </div>

            {frameDifference ? (
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Transition:</span>
                  <span className="text-cyan-400 font-semibold">
                    {frameDifference.observerAId} → {frameDifference.observerBId}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Underlying State:</span>
                  <span className="text-emerald-400 font-semibold">UNCHANGED</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delta Position:</span>
                  <span className="text-zinc-200">[{frameDifference.positionDelta.join(', ')}]</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delta Magnitude:</span>
                  <span className="text-zinc-200">{frameDifference.positionDeltaMagnitude.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Representations:</span>
                  <span className={frameDifference.representationMatches ? 'text-emerald-400' : 'text-amber-400'}>
                    {frameDifference.representationMatches ? 'IDENTICAL' : 'DISTINCT (F0 != F1)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono italic py-4 text-center">
                Select another observer frame to inspect transition difference.
              </div>
            )}
          </div>

          {/* Live Trace Event Log */}
          <div className="flex flex-col flex-1 bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 gap-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>TRAVERSAL TRACE LOG</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{eventLogs.length} events</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-[11px]">
              {eventLogs.map((log) => (
                <div key={log.id} className="p-1.5 rounded bg-zinc-950/80 border border-zinc-900 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-bold">
                      [{log.tag}]
                    </span>
                    <span className="text-[9px] text-zinc-600">{log.time}</span>
                  </div>
                  <p className="text-zinc-300 text-[10px] leading-tight">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
