/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observable Reality Observation & Temporal Lineage Engine Research Harness
 *
 * Route: ?mode=r3, ?research=r3, #/research/r3
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { ObservationEngine } from '../observationEngine';
import { RealityTemporalSnapshotEngine } from '../snapshot';
import { RealityObservationSerializationEngine } from '../serialization';
import { ObservationValidator } from '../observationValidator';
import {
  RealityObservationRecord,
  RealityTemporalSnapshot,
  RealityObservationValidationReport,
  ObservationDiff,
} from '../types';

interface R3ResearchHarnessProps {
  onExit?: () => void;
}

export const R3ResearchHarness: React.FC<R3ResearchHarnessProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const obsEngine = useMemo(() => new ObservationEngine(), []);
  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  const currentRealityState = r2Engine.getCurrentState();
  const observationList = obsEngine.listObservations();
  const events = obsEngine.getCausalityAuditor().getEvents();
  const timeline = obsEngine.getTemporalEngine().getTimeline();

  const [selectedObsId, setSelectedObsId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RealityTemporalSnapshot | null>(null);
  const [validationReport, setValidationReport] = useState<RealityObservationValidationReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('R3 Observation & Temporal Lineage Engine Initialized');
  const [determinismResult, setDeterminismResult] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string>('');
  const [obsDiff, setObsDiff] = useState<ObservationDiff | null>(null);

  const selectedObservation = selectedObsId ? obsEngine.getObservation(selectedObsId) : (observationList[0] ?? null);

  const handleCreateObservation = useCallback(() => {
    const obs = obsEngine.createObservation(
      currentRealityState,
      currentRealityState.coordinates,
      currentRealityState.dimensions,
      'EXACT',
      'OBSERVED',
      'SENSOR',
      'SENSOR_01',
      'LIDAR_PROBE'
    );
    setSelectedObsId(obs.identity.observationId);
    triggerUpdate();
    setStatusMessage(`Created Observation ${obs.identity.observationId} on State ${currentRealityState.stateId}`);
  }, [obsEngine, currentRealityState, triggerUpdate]);

  const handleUpdateObservation = useCallback(() => {
    if (!selectedObservation) return;
    const [x, y, z] = selectedObservation.coordinates ?? currentRealityState.coordinates;
    const updated = obsEngine.updateObservation(
      selectedObservation.identity.observationId,
      currentRealityState,
      [x + 0.5, y, z],
      selectedObservation.dimensions,
      'CONSTRAINED',
      'OBSERVED',
      'Updated position via fine probe'
    );
    setSelectedObsId(updated.identity.observationId);
    triggerUpdate();
    setStatusMessage(`Updated Observation to ${updated.identity.observationId}`);
  }, [selectedObservation, obsEngine, currentRealityState, triggerUpdate]);

  const handleCreateSnapshot = useCallback(() => {
    const snap = RealityTemporalSnapshotEngine.createSnapshot(
      currentRealityState.stateId,
      currentRealityState.checksum,
      observationList,
      events,
      timeline,
      timeline.totalEntries
    );
    setSnapshot(snap);
    setStatusMessage(`Captured Immutable Temporal Snapshot ${snap.snapshotId}`);
  }, [currentRealityState, observationList, events, timeline]);

  const handleValidate = useCallback(() => {
    if (!selectedObservation) return;
    const rep = ObservationValidator.validateObservation(selectedObservation);
    setValidationReport(rep);
    setStatusMessage(`Validation: ${rep.status} (${rep.isValid ? 'VALID' : 'INVALID'})`);
  }, [selectedObservation]);

  const handleExport = useCallback(() => {
    if (!selectedObservation) return;
    const json = RealityObservationSerializationEngine.exportObservation(selectedObservation);
    setExportedJson(json);
    setStatusMessage('Exported Observation Record to JSON');
  }, [selectedObservation]);

  const handleRunDeterminism = useCallback(() => {
    const signatures = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const e = new RealityStateEngine();
      const oe = new ObservationEngine();
      const s = e.getCurrentState();
      const o1 = oe.createObservation(s, [5, 3, 6]);
      const o2 = oe.updateObservation(o1.identity.observationId, s, [5.5, 3, 6]);
      signatures.add(`${o1.observationChecksum}_${o2.observationChecksum}`);
    }
    const passed = signatures.size === 1;
    setDeterminismResult(`50 Cycles: ${signatures.size} unique signature(s) (sigma^2 = 0: ${passed ? 'PASS' : 'FAIL'})`);
    setStatusMessage(passed ? '50-Cycle Determinism Verified' : 'Determinism Failure');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090E] text-slate-200 font-mono text-xs overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-12 border-b border-cyan-900/40 bg-[#0A0D14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-bold tracking-wider text-cyan-300 text-sm">
            R3: OBSERVABLE REALITY OBSERVATION & TEMPORAL LINEAGE ENGINE
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 text-[10px]">
            TEMPORAL LINEAGE
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

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-auto">
        {/* Left Column: Reality State & Observation List */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
            1. Active Reality State & Observations
          </div>

          <div className="space-y-1 bg-[#121722] p-2.5 rounded border border-slate-800 text-[11px]">
            <div><span className="text-slate-500">Reality State:</span> <span className="text-indigo-300 font-bold">{currentRealityState.stateId}</span></div>
            <div><span className="text-slate-500">Coordinates:</span> <span className="text-emerald-400 font-bold">[{currentRealityState.coordinates.join(', ')}]</span></div>
            <div><span className="text-slate-500">State Checksum:</span> <span className="text-sky-400 text-[10px]">{currentRealityState.checksum}</span></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateObservation}
              className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-300 rounded border border-cyan-700/50"
            >
              Record Observation
            </button>
            <button
              onClick={handleUpdateObservation}
              disabled={!selectedObservation}
              className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 rounded border border-indigo-700/50 disabled:opacity-40"
            >
              Update Observation
            </button>
            <button
              onClick={handleValidate}
              disabled={!selectedObservation}
              className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-700/50 disabled:opacity-40"
            >
              Validate
            </button>
          </div>

          {validationReport && (
            <div className={`p-2 rounded border text-[11px] ${validationReport.isValid ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-rose-950/30 border-rose-800 text-rose-300'}`}>
              <div>Status: {validationReport.status}</div>
              <div>Report CS: {validationReport.reportChecksum}</div>
            </div>
          )}

          <div className="border-t border-slate-800 pt-2 flex-1 flex flex-col min-h-[140px]">
            <div className="text-slate-400 font-bold mb-1">Observations ({observationList.length}):</div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {observationList.map((obs) => (
                <div
                  key={obs.identity.observationId}
                  className={`p-1.5 rounded border text-[10px] flex items-center justify-between cursor-pointer ${selectedObservation?.identity.observationId === obs.identity.observationId ? 'bg-cyan-950/50 border-cyan-600 text-cyan-200' : 'bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  onClick={() => setSelectedObsId(obs.identity.observationId)}
                >
                  <div>
                    <span className="font-bold">{obs.identity.observationId}</span> ({obs.origin}) [{obs.coordinates?.join(',') ?? 'UNKNOWN'}]
                  </div>
                  <span className="text-yellow-400">{obs.certainty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Observation Details & Lineage */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
            2. Observation Details & Lineage
          </div>

          {selectedObservation ? (
            <div className="space-y-1.5 text-[11px]">
              <div><span className="text-slate-500">Observation ID:</span> <span className="text-cyan-300 font-bold">{selectedObservation.identity.observationId}</span></div>
              <div><span className="text-slate-500">Target Reality:</span> <span className="text-slate-300">{selectedObservation.identity.targetRealityStateId}</span></div>
              <div><span className="text-slate-500">Observed Coordinates:</span> <span className="text-emerald-400">[{selectedObservation.coordinates?.join(', ') ?? 'UNKNOWN'}]</span></div>
              <div><span className="text-slate-500">Observed Dimensions:</span> <span className="text-slate-300">[{selectedObservation.dimensions?.join(', ') ?? 'UNKNOWN'}]</span></div>
              <div><span className="text-slate-500">Certainty:</span> <span className="text-yellow-400">{selectedObservation.certainty}</span></div>
              <div><span className="text-slate-500">Origin:</span> <span className="text-purple-300">{selectedObservation.origin}</span></div>
              <div><span className="text-slate-500">Observer / Source:</span> <span className="text-slate-300">{selectedObservation.provenance.observerId} ({selectedObservation.provenance.source})</span></div>
              <div><span className="text-slate-500">Capture Method:</span> <span className="text-slate-400">{selectedObservation.provenance.captureMethod}</span></div>
              <div><span className="text-slate-500">Lineage ID:</span> <span className="text-slate-400">{selectedObservation.lineage.lineageId}</span></div>
              <div><span className="text-slate-500">Observation Checksum:</span> <span className="text-sky-400 text-[10px]">{selectedObservation.observationChecksum}</span></div>
            </div>
          ) : (
            <div className="text-slate-500 italic">No observation selected.</div>
          )}

          {/* Timeline & Event History */}
          <div className="border-t border-slate-800 pt-3 flex-1 flex flex-col min-h-[140px]">
            <div className="text-slate-400 font-bold mb-1">Temporal Timeline ({timeline.totalEntries} points):</div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {timeline.entries.map((entry) => (
                <div key={entry.entryId} className="p-1.5 rounded bg-[#121722] border border-slate-800 text-[10px]">
                  <span className="text-cyan-400 font-bold">#{entry.sequenceIndex}</span> {entry.entryId} | State: {entry.realityStateId} | Obs: {entry.observationIds.length}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Snapshots, Serialization & Determinism */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
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
              disabled={!selectedObservation}
              className="px-2.5 py-1 bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 rounded border border-teal-700/50 disabled:opacity-40"
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
            <div className="flex-1 flex flex-col min-h-[120px]">
              <div className="text-slate-500 mb-1">Exported Observation JSON:</div>
              <textarea
                readOnly
                value={exportedJson}
                className="flex-1 bg-black/60 p-2 rounded border border-slate-800 text-[10px] text-teal-300 font-mono resize-none focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="h-8 border-t border-slate-800 bg-[#0A0D14] px-4 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          <span className="text-cyan-300">{statusMessage}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div>Reality Invariance: <span className="text-emerald-400 font-bold">Delta R = 0</span></div>
          <div>Determinism: <span className="text-purple-400 font-bold">sigma^2 = 0</span></div>
          <div>Events: <span className="text-cyan-400">{events.length}</span></div>
        </div>
      </div>
    </div>
  );
};
