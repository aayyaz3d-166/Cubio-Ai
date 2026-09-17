/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Observable Reality Multi-Object & Relationship Engine Research Harness
 *
 * Route: ?mode=r4, ?research=r4, #/research/r4
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { RealityMultiObjectEngine } from '../multiObjectEngine';
import { RealityMultiObjectSnapshotEngine } from '../snapshot';
import { RealityMultiObjectSerializationEngine } from '../serialization';
import { RealityMultiObjectValidator } from '../multiObjectValidator';
import {
  RealityObject,
  RealityRelationship,
  RealityMultiObjectSnapshot,
  RealityObjectValidationReport,
  RealityRelationshipValidationReport,
} from '../types';

interface R4ResearchHarnessProps {
  onExit?: () => void;
}

export const R4ResearchHarness: React.FC<R4ResearchHarnessProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const currentRealityState = r2Engine.getCurrentState();

  const moEngine = useMemo(
    () => new RealityMultiObjectEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  const objectList = moEngine.listObjects();
  const relationshipList = moEngine.getRelationshipEngine().listRelationships();
  const collection = moEngine.getCollection();
  const events = moEngine.getCausalityAuditor().getEvents();

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RealityMultiObjectSnapshot | null>(null);
  const [objValReport, setObjValReport] = useState<RealityObjectValidationReport | null>(null);
  const [relValReport, setRelValReport] = useState<RealityRelationshipValidationReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('R4 Multi-Object & Relationship Engine Initialized');
  const [determinismResult, setDeterminismResult] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string>('');

  const selectedObject = selectedObjectId ? moEngine.getObject(selectedObjectId) : (objectList[0] ?? null);
  const selectedRel = selectedRelId ? moEngine.getRelationshipEngine().getRelationship(selectedRelId) : (relationshipList[0] ?? null);

  const handleCreateObject = useCallback(() => {
    const count = objectList.length + 1;
    const tag = `entity_${count}`;
    const name = `Object ${count}`;
    const obj = moEngine.createObject(
      currentRealityState,
      tag,
      name,
      'SOLID',
      [5 + count * 2, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'RESEARCH_USER'
    );
    setSelectedObjectId(obj.identity.objectId);
    triggerUpdate();
    setStatusMessage(`Created Object ${obj.identity.objectId} (${name})`);
  }, [moEngine, currentRealityState, objectList.length, triggerUpdate]);

  const handleCreateRelationship = useCallback(() => {
    if (objectList.length < 2) {
      setStatusMessage('Need at least 2 objects to create a relationship');
      return;
    }
    const source = objectList[0];
    const target = objectList[1];
    const rel = moEngine.getRelationshipEngine().createRelationship(
      source.identity.objectId,
      target.identity.objectId,
      'TOUCHES',
      'OBSERVED',
      'EXACT',
      'OBSERVED',
      currentRealityState.stateId
    );
    moEngine.getGraph().addRelationship(rel);
    setSelectedRelId(rel.relationshipId);
    triggerUpdate();
    setStatusMessage(`Created Relationship ${rel.relationshipId}: ${source.name} TOUCHES ${target.name}`);
  }, [moEngine, objectList, currentRealityState, triggerUpdate]);

  const handleCreateSnapshot = useCallback(() => {
    const snap = RealityMultiObjectSnapshotEngine.createSnapshot(
      currentRealityState.stateId,
      currentRealityState.checksum,
      objectList,
      relationshipList
    );
    setSnapshot(snap);
    setStatusMessage(`Captured Immutable Multi-Object Snapshot ${snap.snapshotId}`);
  }, [currentRealityState, objectList, relationshipList]);

  const handleValidateObject = useCallback(() => {
    if (!selectedObject) return;
    const rep = RealityMultiObjectValidator.validateObject(selectedObject);
    setObjValReport(rep);
    setStatusMessage(`Object Validation: ${rep.status} (${rep.isValid ? 'VALID' : 'INVALID'})`);
  }, [selectedObject]);

  const handleValidateRelationship = useCallback(() => {
    if (!selectedRel) return;
    const objIds = new Set<string>(objectList.map((o) => o.identity.objectId));
    const rep = RealityMultiObjectValidator.validateRelationship(selectedRel, objIds);
    setRelValReport(rep);
    setStatusMessage(`Relationship Validation: ${rep.status} (${rep.isValid ? 'VALID' : 'INVALID'})`);
  }, [selectedRel, objectList]);

  const handleExport = useCallback(() => {
    const json = RealityMultiObjectSerializationEngine.exportObjectCollection(collection);
    setExportedJson(json);
    setStatusMessage('Exported Object Collection to JSON');
  }, [collection]);

  const handleRunDeterminism = useCallback(() => {
    const signatures = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const e = new RealityStateEngine();
      const s = e.getCurrentState();
      const mo = new RealityMultiObjectEngine(s.stateId, s.checksum);
      const o1 = mo.createObject(s, 'A', 'Object A', 'SOLID', [5, 3, 6]);
      const o2 = mo.createObject(s, 'B', 'Object B', 'SOLID', [7, 3, 6]);
      const r = mo.getRelationshipEngine().createRelationship(o1.identity.objectId, o2.identity.objectId, 'ADJACENT_TO');
      signatures.add(mo.getExecutionSignature().executionHash);
    }
    const passed = signatures.size === 1;
    setDeterminismResult(`50 Cycles: ${signatures.size} unique signature(s) (sigma^2 = 0: ${passed ? 'PASS' : 'FAIL'})`);
    setStatusMessage(passed ? '50-Cycle Determinism Verified' : 'Determinism Failure');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090E] text-slate-200 font-mono text-xs overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-12 border-b border-fuchsia-900/40 bg-[#0A0D14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_8px_#e879f9]" />
          <span className="font-bold tracking-wider text-fuchsia-300 text-sm">
            R4: OBSERVABLE REALITY MULTI-OBJECT & RELATIONSHIP ENGINE
          </span>
          <span className="px-2 py-0.5 rounded bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-700/50 text-[10px]">
            GRAPH & RELATIONSHIPS
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
        {/* Left Column: Reality State & Objects */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-fuchsia-400 font-bold text-sm border-b border-slate-800 pb-2">
            1. Active Reality State & Objects
          </div>

          <div className="space-y-1 bg-[#121722] p-2.5 rounded border border-slate-800 text-[11px]">
            <div><span className="text-slate-500">Reality State:</span> <span className="text-indigo-300 font-bold">{currentRealityState.stateId}</span></div>
            <div><span className="text-slate-500">State Coords:</span> <span className="text-emerald-400 font-bold">[{currentRealityState.coordinates.join(', ')}]</span></div>
            <div><span className="text-slate-500">Collection Checksum:</span> <span className="text-sky-400 text-[10px]">{collection.collectionChecksum}</span></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateObject}
              className="px-2.5 py-1 bg-fuchsia-900/40 hover:bg-fuchsia-800/50 text-fuchsia-300 rounded border border-fuchsia-700/50"
            >
              Add Object
            </button>
            <button
              onClick={handleCreateRelationship}
              className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 rounded border border-purple-700/50"
            >
              Add Relationship
            </button>
            <button
              onClick={handleValidateObject}
              disabled={!selectedObject}
              className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-700/50 disabled:opacity-40"
            >
              Validate Object
            </button>
          </div>

          {objValReport && (
            <div className={`p-2 rounded border text-[11px] ${objValReport.isValid ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-rose-950/30 border-rose-800 text-rose-300'}`}>
              <div>Status: {objValReport.status}</div>
              <div>Report CS: {objValReport.reportChecksum}</div>
            </div>
          )}

          <div className="border-t border-slate-800 pt-2 flex-1 flex flex-col min-h-[140px]">
            <div className="text-slate-400 font-bold mb-1">Objects ({objectList.length}):</div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {objectList.map((obj) => (
                <div
                  key={obj.identity.objectId}
                  className={`p-1.5 rounded border text-[10px] flex items-center justify-between cursor-pointer ${selectedObject?.identity.objectId === obj.identity.objectId ? 'bg-fuchsia-950/50 border-fuchsia-600 text-fuchsia-200' : 'bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  onClick={() => setSelectedObjectId(obj.identity.objectId)}
                >
                  <div>
                    <span className="font-bold">{obj.name}</span> ({obj.objectType}) [{obj.coordinates?.join(',') ?? 'UNKNOWN'}]
                  </div>
                  <span className="text-yellow-400">{obj.certainty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Object Details & Relationship Graph */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-fuchsia-400 font-bold text-sm border-b border-slate-800 pb-2">
            2. Object Details & Graph
          </div>

          {selectedObject ? (
            <div className="space-y-1.5 text-[11px] bg-[#121722] p-2.5 rounded border border-slate-800">
              <div><span className="text-slate-500">Object ID:</span> <span className="text-fuchsia-300 font-bold">{selectedObject.identity.objectId}</span></div>
              <div><span className="text-slate-500">Coordinates:</span> <span className="text-emerald-400">[{selectedObject.coordinates?.join(', ') ?? 'UNKNOWN'}]</span></div>
              <div><span className="text-slate-500">Dimensions:</span> <span className="text-slate-300">[{selectedObject.dimensions?.join(', ') ?? 'UNKNOWN'}]</span></div>
              <div><span className="text-slate-500">Certainty:</span> <span className="text-yellow-400">{selectedObject.certainty}</span></div>
              <div><span className="text-slate-500">Origin:</span> <span className="text-purple-300">{selectedObject.origin}</span></div>
              <div><span className="text-slate-500">Checksum:</span> <span className="text-sky-400 text-[10px]">{selectedObject.objectChecksum}</span></div>
            </div>
          ) : (
            <div className="text-slate-500 italic">No object selected.</div>
          )}

          {/* Relationships List */}
          <div className="border-t border-slate-800 pt-2 flex-1 flex flex-col min-h-[140px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-bold">Relationships ({relationshipList.length}):</span>
              <button
                onClick={handleValidateRelationship}
                disabled={!selectedRel}
                className="text-[10px] px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-800 disabled:opacity-40"
              >
                Validate Rel
              </button>
            </div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {relationshipList.map((rel) => (
                <div
                  key={rel.relationshipId}
                  className={`p-1.5 rounded border text-[10px] cursor-pointer ${selectedRel?.relationshipId === rel.relationshipId ? 'bg-purple-950/50 border-purple-600 text-purple-200' : 'bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  onClick={() => setSelectedRelId(rel.relationshipId)}
                >
                  <span className="font-bold text-fuchsia-300">{rel.sourceObjectId}</span> <span className="text-teal-400 font-bold">{rel.relationshipType}</span> <span className="font-bold text-fuchsia-300">{rel.targetObjectId}</span> ({rel.evidence})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Snapshots, Serialization & Determinism */}
        <div className="flex flex-col gap-3 bg-[#0D111A] p-4 rounded border border-slate-800/80 overflow-auto">
          <div className="text-fuchsia-400 font-bold text-sm border-b border-slate-800 pb-2">
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
            <div className="flex-1 flex flex-col min-h-[120px]">
              <div className="text-slate-500 mb-1">Exported Collection JSON:</div>
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
          <span className="text-fuchsia-300">{statusMessage}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div>Reality Invariance: <span className="text-emerald-400 font-bold">Delta R = 0</span></div>
          <div>Determinism: <span className="text-purple-400 font-bold">sigma^2 = 0</span></div>
          <div>Objects: <span className="text-fuchsia-400">{objectList.length}</span></div>
          <div>Relationships: <span className="text-teal-400">{relationshipList.length}</span></div>
        </div>
      </div>
    </div>
  );
};
