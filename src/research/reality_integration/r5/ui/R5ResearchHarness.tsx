/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Observable Reality Spatial Relationship & Topology Engine Research Harness
 *
 * Route: ?mode=r5, ?research=r5, #/research/r5
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { RealityMultiObjectEngine } from '../../r4/multiObjectEngine';
import { RealitySpatialEngine } from '../spatialEngine';
import { SpatialRelation, SpatialSnapshot, SpatialValidationReport, SpatialDiff } from '../types';

interface R5ResearchHarnessProps {
  onExit?: () => void;
}

export const R5ResearchHarness: React.FC<R5ResearchHarnessProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const currentRealityState = r2Engine.getCurrentState();

  const moEngine = useMemo(
    () => new RealityMultiObjectEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const spatialEngine = useMemo(
    () => new RealitySpatialEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  const [statusMessage, setStatusMessage] = useState<string>('R5 Spatial Relationship & Topology Engine Initialized');
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SpatialSnapshot | null>(null);
  const [validationReport, setValidationReport] = useState<SpatialValidationReport | null>(null);
  const [diffResult, setDiffResult] = useState<SpatialDiff | null>(null);
  const [determinismResult, setDeterminismResult] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string>('');

  const objectList = moEngine.listObjects();
  const relationList = spatialEngine.listRelations();
  const topology = spatialEngine.getTopology();

  const handleCreateObjectPair = useCallback(() => {
    const count = objectList.length;
    const objA = moEngine.createObject(
      currentRealityState,
      `entity_${count + 1}`,
      `Object ${count + 1}`,
      'SOLID',
      [5, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'RESEARCH_USER'
    );
    const objB = moEngine.createObject(
      currentRealityState,
      `entity_${count + 2}`,
      `Object ${count + 2}`,
      'SOLID',
      [10, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'RESEARCH_USER'
    );
    spatialEngine.registerObject(objA);
    spatialEngine.registerObject(objB);
    triggerUpdate();
    setStatusMessage(`Created objects ${objA.identity.objectId} and ${objB.identity.objectId}`);
  }, [moEngine, currentRealityState, objectList.length, spatialEngine, triggerUpdate]);

  const handleEvaluateAllRelations = useCallback(() => {
    const objs = moEngine.listObjects();
    if (objs.length < 2) {
      setStatusMessage('Need at least 2 objects to evaluate spatial relations');
      return;
    }
    let count = 0;
    for (let i = 0; i < objs.length; i++) {
      for (let j = i + 1; j < objs.length; j++) {
        const rel = spatialEngine.evaluateRelation(objs[i], objs[j]);
        if (count === 0) setSelectedRelId(rel.relationId);
        count++;
      }
    }
    triggerUpdate();
    setStatusMessage(`Evaluated ${count} spatial relations`);
  }, [moEngine, spatialEngine, triggerUpdate]);

  const handleValidateSelected = useCallback(() => {
    if (!selectedRelId) {
      setStatusMessage('No relation selected for validation');
      return;
    }
    const rel = spatialEngine.getRelation(selectedRelId);
    if (!rel) {
      setStatusMessage('Relation not found');
      return;
    }
    const report = spatialEngine.validateRelation(rel);
    setValidationReport(report);
    setStatusMessage(`Validation: ${report.status} (valid: ${report.isValid})`);
  }, [selectedRelId, spatialEngine]);

  const handleCreateSnapshot = useCallback(() => {
    const snap = spatialEngine.createSnapshot();
    setSnapshot(snap);
    setStatusMessage(`Snapshot created: ${snap.snapshotId}`);
  }, [spatialEngine]);

  const handleDeterminismTest = useCallback(() => {
    const signatures = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const sig = spatialEngine.computeExecutionSignature();
      signatures.add(sig.executionHash);
    }
    const unique = signatures.size;
    const passed = unique === 1;
    setDeterminismResult(
      `Determinism: ${passed ? 'PASS' : 'FAIL'} — ${unique} unique signature(s) over 50 cycles`
    );
    setStatusMessage(passed ? 'Determinism test PASSED (σ²=0)' : 'Determinism test FAILED');
  }, [spatialEngine]);

  const handleExportTopology = useCallback(() => {
    const json = JSON.stringify(spatialEngine.getTopology(), null, 2);
    setExportedJson(json);
    setStatusMessage('Topology exported to JSON');
  }, [spatialEngine]);

  const selectedRel = selectedRelId ? spatialEngine.getRelation(selectedRelId) : (relationList[0] ?? null);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      backgroundColor: '#0A0A0B', color: '#E0E0E0', fontFamily: 'monospace', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid #333', backgroundColor: '#111',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00BFFF' }}>
            R5 — Spatial Relationship & Topology Engine
          </span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            Reality Integration Research Harness
          </span>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            style={{
              padding: '6px 16px', backgroundColor: '#333', border: '1px solid #555',
              color: '#E0E0E0', cursor: 'pointer', borderRadius: '4px',
            }}
          >
            Exit R5
          </button>
        )}
      </div>

      {/* Status */}
      <div style={{ padding: '8px 24px', backgroundColor: '#0D1117', borderBottom: '1px solid #222', fontSize: '13px' }}>
        <span style={{ color: '#00FF88' }}>STATUS:</span> {statusMessage}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 24px', borderBottom: '1px solid #222',
        flexWrap: 'wrap',
      }}>
        <button onClick={handleCreateObjectPair} style={btnStyle}>Create Object Pair</button>
        <button onClick={handleEvaluateAllRelations} style={btnStyle}>Evaluate All Relations</button>
        <button onClick={handleValidateSelected} style={btnStyle}>Validate Selected</button>
        <button onClick={handleCreateSnapshot} style={btnStyle}>Create Snapshot</button>
        <button onClick={handleDeterminismTest} style={btnStyle}>Determinism Test</button>
        <button onClick={handleExportTopology} style={btnStyle}>Export Topology</button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Relations */}
        <div style={{ width: '300px', borderRight: '1px solid #222', overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#00BFFF' }}>
            Spatial Relations ({relationList.length})
          </div>
          {relationList.map((rel) => (
            <div
              key={rel.relationId}
              onClick={() => setSelectedRelId(rel.relationId)}
              style={{
                padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '4px',
                backgroundColor: selectedRelId === rel.relationId ? '#1a3a5c' : '#111',
                border: selectedRelId === rel.relationId ? '1px solid #00BFFF' : '1px solid transparent',
                fontSize: '11px',
              }}
            >
              <div style={{ color: '#FFA500' }}>{rel.relationType}</div>
              <div style={{ color: '#888' }}>{rel.sourceObjectId.slice(0, 12)}→{rel.targetObjectId.slice(0, 12)}</div>
            </div>
          ))}

          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', color: '#00BFFF' }}>
            Topology: {topology.nodes.length} nodes, {topology.edges.length} edges
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Cycles: {spatialEngine.detectCycles() ? 'YES' : 'NO'}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Orphans: {spatialEngine.detectOrphanEdges().length}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {selectedRel && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFA500', marginBottom: '8px' }}>
                Selected Relation
              </div>
              <pre style={{ fontSize: '11px', backgroundColor: '#111', padding: '12px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
                {JSON.stringify(selectedRel, null, 2)}
              </pre>
            </div>
          )}

          {validationReport && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: validationReport.isValid ? '#00FF88' : '#FF4444', marginBottom: '8px' }}>
                Validation: {validationReport.status}
              </div>
              <pre style={{ fontSize: '11px', backgroundColor: '#111', padding: '12px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(validationReport, null, 2)}
              </pre>
            </div>
          )}

          {determinismResult && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#111', borderRadius: '4px', fontSize: '13px' }}>
              {determinismResult}
            </div>
          )}

          {snapshot && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
                Snapshot: {snapshot.snapshotId}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                Relations: {snapshot.relations.length} | Nodes: {snapshot.topology.nodes.length} | Edges: {snapshot.topology.edges.length}
              </div>
            </div>
          )}

          {exportedJson && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
                Exported JSON
              </div>
              <pre style={{ fontSize: '10px', backgroundColor: '#111', padding: '12px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
                {exportedJson}
              </pre>
            </div>
          )}

          {/* Causality Events */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
              Causality Events ({spatialEngine.getCausalityEvents().length})
            </div>
            {spatialEngine.getCausalityEvents().slice(-10).map((evt, i) => (
              <div key={i} style={{ fontSize: '11px', color: evt.isRealityInvariant ? '#00FF88' : '#FF4444', marginBottom: '2px' }}>
                [{evt.sequence}] {evt.operation} — ΔReality={evt.isRealityInvariant ? '0' : '≠0'} — {evt.domain}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: '#1a1a2e',
  border: '1px solid #333',
  color: '#E0E0E0',
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '12px',
};
