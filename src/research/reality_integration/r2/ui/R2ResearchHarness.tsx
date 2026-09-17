/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Observable Reality State Engine Research Harness
 *
 * Route: ?mode=r2, ?research=r2, #/research/r2
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RealityStateEngine } from '../realityStateEngine';
import { RealityStateSnapshotEngine } from '../snapshot';
import { RealityStateSerializationEngine } from '../serialization';
import { RealityStateValidator } from '../realityStateValidator';
import { RealityPropagationAdapters } from '../propagationAdapters';
import {
  RealityState,
  RealityStateSnapshot,
  RealityStateValidationReport,
  RealityStateDiff,
  R2ModelRepresentation,
  R2GeometryRepresentation,
  R2WorkspaceState,
} from '../types';

interface R2ResearchHarnessProps {
  onExit?: () => void;
}

export const R2ResearchHarness: React.FC<R2ResearchHarnessProps> = ({ onExit }) => {
  const engine = useMemo(() => new RealityStateEngine(), []);
  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  const currentState = engine.getCurrentState();
  const allStates = engine.getAllStates();
  const transitions = engine.getTransitions();

  const [snapshot, setSnapshot] = useState<RealityStateSnapshot | null>(null);
  const [validationReport, setValidationReport] = useState<RealityStateValidationReport | null>(null);
  const [stateDiff, setStateDiff] = useState<RealityStateDiff | null>(null);
  const [selectedStateAId, setSelectedStateAId] = useState<string>(currentState.stateId);
  const [selectedStateBId, setSelectedStateBId] = useState<string>(currentState.stateId);
  const [exportedJson, setExportedJson] = useState<string>('');
  const [importJsonInput, setImportJsonInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('R2 Observable Reality State Engine Ready');
  const [determinismResult, setDeterminismResult] = useState<string | null>(null);

  // Derived representations
  const model: R2ModelRepresentation = useMemo(
    () => RealityPropagationAdapters.adaptRealityToModel(currentState),
    [currentState]
  );

  const geometry: R2GeometryRepresentation = useMemo(
    () => RealityPropagationAdapters.adaptModelToGeometry(model, 'OBSERVED'),
    [model]
  );

  const workspace: R2WorkspaceState = useMemo(
    () => RealityPropagationAdapters.adaptGeometryToWorkspace(geometry),
    [geometry]
  );

  const handleApplyMutation = useCallback(() => {
    const [x, y, z] = currentState.coordinates;
    const res = engine.applyAuthorizedMutation([x + 1, y, z], currentState.dimensions, 'MANUAL_UI_MUTATION');
    triggerUpdate();
    setStatusMessage(`Applied Mutation to [${x + 1}, ${y}, ${z}] -> New State ${res.state.stateId}`);
  }, [currentState, engine, triggerUpdate]);

  const handleBranch = useCallback(() => {
    const branchName = `branch_${allStates.length}`;
    const [x, y, z] = currentState.coordinates;
    const res = engine.branchState(branchName, [x, y + 1, z]);
    triggerUpdate();
    setStatusMessage(`Created Branch '${branchName}' -> State ${res.state.stateId}`);
  }, [currentState, engine, allStates.length, triggerUpdate]);

  const handleRestore = useCallback((stateId: string) => {
    const res = engine.restoreState(stateId);
    triggerUpdate();
    setStatusMessage(`Restored Active State to ${res.state.stateId}`);
  }, [engine, triggerUpdate]);

  const handleReset = useCallback(() => {
    const res = engine.resetState();
    triggerUpdate();
    setStatusMessage(`Reset Active State to Root Canonical State ${res.state.stateId}`);
  }, [engine, triggerUpdate]);

  const handleValidate = useCallback(() => {
    const rep = RealityStateValidator.validateState(currentState);
    setValidationReport(rep);
    setStatusMessage(`Validation: ${rep.status} (${rep.isValid ? 'VALID' : 'INVALID'})`);
  }, [currentState]);

  const handleCompare = useCallback(() => {
    try {
      const diff = engine.compareStates(selectedStateAId, selectedStateBId);
      setStateDiff(diff);
      setStatusMessage(`Compared State ${selectedStateAId} vs ${selectedStateBId}`);
    } catch (e: any) {
      setStatusMessage(`Compare Error: ${e.message}`);
    }
  }, [engine, selectedStateAId, selectedStateBId]);

  const handleCreateSnapshot = useCallback(() => {
    const snap = RealityStateSnapshotEngine.createSnapshot(currentState, transitions);
    setSnapshot(snap);
    setStatusMessage(`Created Snapshot ${snap.snapshotId}`);
  }, [currentState, transitions]);

  const handleExport = useCallback(() => {
    const json = RealityStateSerializationEngine.exportRealityState(currentState);
    setExportedJson(json);
    setStatusMessage('Exported Reality State to JSON');
  }, [currentState]);

  const handleImport = useCallback(() => {
    const imported = RealityStateSerializationEngine.importRealityState(importJsonInput);
    if (imported) {
      setStatusMessage(`Imported State ${imported.stateId} successfully (Coordinates: [${imported.coordinates.join(',')}])`);
    } else {
      setStatusMessage('Failed to import JSON: Invalid Schema or Corrupt State');
    }
  }, [importJsonInput]);

  const handleRunDeterminism = useCallback(() => {
    const signatures = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const e = new RealityStateEngine();
      e.applyAuthorizedMutation([6, 3, 6]);
      e.branchState('det_branch', [6, 4, 6]);
      e.applyAuthorizedMutation([7, 4, 6]);
      e.resetState();
      signatures.add(e.getExecutionSignature().executionHash);
    }
    const passed = signatures.size === 1;
    setDeterminismResult(`50 Cycles: ${signatures.size} unique signature(s) (sigma^2 = 0: ${passed ? 'PASS' : 'FAIL'})`);
    setStatusMessage(passed ? '50-Cycle Determinism Verified' : 'Determinism Failure');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090E] text-slate-200 font-mono text-xs overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-12 border-b border-indigo-900/40 bg-[#0A0D14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
          <span className="font-bold tracking-wider text-indigo-300 text-sm">
            R2: OBSERVABLE REALITY STATE ENGINE
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-700/50 text-[10px]">
            MULTI-STATE LINEAGE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition"
            >
              Exit Harness
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-auto">
        {/* Left Column: Active Reality State & Transitions */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-indigo-400 font-bold text-sm border-b border-slate-800 pb-2 flex justify-between">
            <span>1. Current Reality State</span>
            <span className="text-slate-500 font-normal">v{currentState.version}</span>
          </div>

          <div className="space-y-1.5">
            <div><span className="text-slate-500">State ID:</span> <span className="text-indigo-300 font-bold">{currentState.stateId}</span></div>
            <div><span className="text-slate-500">Parent State:</span> <span className="text-slate-400">{currentState.lineage.parentStateId ?? 'None (ROOT)'}</span></div>
            <div><span className="text-slate-500">Root State:</span> <span className="text-slate-400">{currentState.lineage.rootStateId}</span></div>
            <div><span className="text-slate-500">Coordinates:</span> <span className="text-emerald-400 font-bold">[{currentState.coordinates.join(', ')}]</span></div>
            <div><span className="text-slate-500">Dimensions:</span> <span className="text-slate-300">[{currentState.dimensions.join(', ')}]</span></div>
            <div><span className="text-slate-500">Certainty:</span> <span className="text-yellow-400">{currentState.certainty}</span></div>
            <div><span className="text-slate-500">Origin:</span> <span className="text-purple-300">{currentState.origin}</span></div>
            <div><span className="text-slate-500">Checksum:</span> <span className="text-sky-400 text-[11px]">{currentState.checksum}</span></div>
            <div><span className="text-slate-500">Transition:</span> <span className="text-teal-300">{currentState.lineage.transitionType}</span></div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-800 pt-3 flex flex-wrap gap-2">
            <button
              onClick={handleApplyMutation}
              className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/50 text-amber-300 rounded border border-amber-700/50"
            >
              Mutate (+X)
            </button>
            <button
              onClick={handleBranch}
              className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 rounded border border-indigo-700/50"
            >
              Branch State
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-800/50 text-rose-300 rounded border border-rose-700/50"
            >
              Reset to Root
            </button>
            <button
              onClick={handleValidate}
              className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-700/50"
            >
              Validate
            </button>
          </div>

          {validationReport && (
            <div className={`p-2 rounded border text-[11px] ${validationReport.isValid ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-rose-950/30 border-rose-800 text-rose-300'}`}>
              <div>Status: {validationReport.status}</div>
              <div>Checksum: {validationReport.reportChecksum}</div>
            </div>
          )}

          {/* State History List */}
          <div className="border-t border-slate-800 pt-3 flex-1 flex flex-col min-h-[140px]">
            <div className="text-slate-400 font-bold mb-1">State Registry ({allStates.length} states):</div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {allStates.map((s) => (
                <div
                  key={s.stateId}
                  className={`p-1.5 rounded border text-[10px] flex items-center justify-between cursor-pointer ${s.stateId === currentState.stateId ? 'bg-indigo-950/50 border-indigo-600 text-indigo-200' : 'bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  onClick={() => handleRestore(s.stateId)}
                >
                  <div>
                    <span className="font-bold">{s.stateId}</span> (v{s.version}) [{s.coordinates.join(',')}]
                  </div>
                  <button className="text-indigo-400 hover:underline">Restore</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Downstream Propagation & State Comparison */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-indigo-400 font-bold text-sm border-b border-slate-800 pb-2">
            2. Downstream Propagation & Diff
          </div>

          {/* Model / Geometry / Workspace Status */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded bg-[#121722] border border-slate-800">
              <div className="font-bold text-indigo-400">Model Layer</div>
              <div className="text-slate-400">{model.modelId}</div>
              <div className="text-slate-500">[{model.coordinates.join(',')}]</div>
            </div>
            <div className="p-2 rounded bg-[#121722] border border-slate-800">
              <div className="font-bold text-purple-400">Geometry Layer</div>
              <div className="text-slate-400">{geometry.geometryId}</div>
              <div className="text-slate-500">[{geometry.coordinates.join(',')}]</div>
            </div>
            <div className="p-2 rounded bg-[#121722] border border-slate-800">
              <div className="font-bold text-teal-400">Workspace Layer</div>
              <div className="text-slate-400">{workspace.spaceId}</div>
              <div className="text-slate-500">[{workspace.coordinates.join(',')}]</div>
            </div>
          </div>

          {/* State Comparison Controls */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <div className="text-slate-400 font-bold">Deterministic State Diff:</div>
            <div className="flex gap-2 items-center">
              <select
                value={selectedStateAId}
                onChange={(e) => setSelectedStateAId(e.target.value)}
                className="bg-[#121722] border border-slate-800 rounded px-2 py-1 text-slate-300 text-[10px]"
              >
                {allStates.map((s) => (
                  <option key={s.stateId} value={s.stateId}>State A: {s.stateId}</option>
                ))}
              </select>
              <span className="text-slate-500">vs</span>
              <select
                value={selectedStateBId}
                onChange={(e) => setSelectedStateBId(e.target.value)}
                className="bg-[#121722] border border-slate-800 rounded px-2 py-1 text-slate-300 text-[10px]"
              >
                {allStates.map((s) => (
                  <option key={s.stateId} value={s.stateId}>State B: {s.stateId}</option>
                ))}
              </select>
              <button
                onClick={handleCompare}
                className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-300 rounded border border-cyan-700/50 text-[10px]"
              >
                Compare
              </button>
            </div>

            {stateDiff && (
              <div className="p-2.5 rounded bg-[#121722] border border-slate-800 text-[11px] space-y-1">
                <div className="font-bold text-cyan-400">Diff Result: {stateDiff.isIdentical ? 'IDENTICAL' : 'CHANGES DETECTED'}</div>
                <div>X: {stateDiff.coordinates.x.changed ? <span className="text-amber-400">{stateDiff.coordinates.x.before} -&gt; {stateDiff.coordinates.x.after}</span> : <span className="text-slate-500">UNCHANGED ({stateDiff.coordinates.x.before})</span>}</div>
                <div>Y: {stateDiff.coordinates.y.changed ? <span className="text-amber-400">{stateDiff.coordinates.y.before} -&gt; {stateDiff.coordinates.y.after}</span> : <span className="text-slate-500">UNCHANGED ({stateDiff.coordinates.y.before})</span>}</div>
                <div>Z: {stateDiff.coordinates.z.changed ? <span className="text-amber-400">{stateDiff.coordinates.z.before} -&gt; {stateDiff.coordinates.z.after}</span> : <span className="text-slate-500">UNCHANGED ({stateDiff.coordinates.z.before})</span>}</div>
                <div>Checksum Changed: <span className={stateDiff.checksumChanged ? 'text-amber-400' : 'text-slate-500'}>{stateDiff.checksumChanged ? 'YES' : 'NO'}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Snapshots, Serialization & Determinism */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-indigo-400 font-bold text-sm border-b border-slate-800 pb-2">
            3. Snapshots, Serialization & Determinism
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateSnapshot}
              className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 rounded border border-indigo-700/50"
            >
              Create Snapshot
            </button>
            <button
              onClick={handleExport}
              className="px-2.5 py-1 bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 rounded border border-teal-700/50"
            >
              Export JSON
            </button>
            <button
              onClick={handleRunDeterminism}
              className="px-2.5 py-1 bg-fuchsia-900/40 hover:bg-fuchsia-800/50 text-fuchsia-300 rounded border border-fuchsia-700/50"
            >
              50-Cycle Determinism
            </button>
          </div>

          {snapshot && (
            <div className="p-2 rounded bg-indigo-950/30 border border-indigo-800 text-[11px] space-y-1">
              <div><span className="text-slate-500">Snapshot ID:</span> {snapshot.snapshotId}</div>
              <div><span className="text-slate-500">Checksum:</span> {snapshot.snapshotChecksum}</div>
              <div><span className="text-slate-500">Frozen:</span> {Object.isFrozen(snapshot) ? 'YES' : 'NO'}</div>
            </div>
          )}

          {determinismResult && (
            <div className="p-2 rounded bg-fuchsia-950/30 border border-fuchsia-800 text-[11px] text-fuchsia-300">
              {determinismResult}
            </div>
          )}

          {exportedJson && (
            <div className="flex flex-col min-h-[100px]">
              <div className="text-slate-500 mb-1">Exported JSON:</div>
              <textarea
                readOnly
                value={exportedJson}
                className="flex-1 bg-black/60 p-2 rounded border border-slate-800 text-[10px] text-teal-300 font-mono resize-none focus:outline-none"
              />
            </div>
          )}

          <div className="border-t border-slate-800 pt-2 flex flex-col gap-1">
            <div className="text-slate-400 font-bold">Import JSON:</div>
            <textarea
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              placeholder="Paste RealityState JSON here..."
              className="h-16 bg-black/60 p-2 rounded border border-slate-800 text-[10px] text-slate-300 font-mono resize-none focus:outline-none"
            />
            <button
              onClick={handleImport}
              className="self-start px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-700/50"
            >
              Validate & Import
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="h-8 border-t border-slate-800 bg-[#0A0D14] px-4 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          <span className="text-indigo-300">{statusMessage}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div>Causality: <span className="text-emerald-400 font-bold">UNIDIRECTIONAL</span></div>
          <div>Determinism: <span className="text-purple-400 font-bold">sigma^2 = 0</span></div>
          <div>Transitions: <span className="text-cyan-400">{transitions.length}</span></div>
        </div>
      </div>
    </div>
  );
};
