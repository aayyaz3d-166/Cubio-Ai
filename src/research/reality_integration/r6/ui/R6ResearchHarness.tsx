/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Observable Reality -> User Workspace Integration Research Harness
 *
 * Route: ?mode=r6, ?research=r6, #/research/r6
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { RealityMultiObjectEngine } from '../../r4/multiObjectEngine';
import { RealitySpatialEngine } from '../../r5/spatialEngine';
import { RealityWorkspaceAdapter } from '../realityWorkspaceAdapter';
import { WorkspaceSerializationEngine } from '../serialization';
import {
  WorkspaceState,
  WorkspaceSnapshot,
  WorkspaceValidationReport,
  WorkspaceDiff,
} from '../types';

interface R6ResearchHarnessProps {
  onExit?: () => void;
}

export const R6ResearchHarness: React.FC<R6ResearchHarnessProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const [currentRealityState, setCurrentRealityState] = useState(() => r2Engine.getCurrentState());

  const moEngine = useMemo(
    () => new RealityMultiObjectEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const spatialEngine = useMemo(
    () => new RealitySpatialEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const wsAdapter = useMemo(
    () => new RealityWorkspaceAdapter(currentRealityState),
    [currentRealityState]
  );

  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  const [statusMessage, setStatusMessage] = useState<string>(
    'R6 Reality -> Workspace Integration Engine Initialized'
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [selectedSpatialId, setSelectedSpatialId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [validationReport, setValidationReport] = useState<WorkspaceValidationReport | null>(null);
  const [diffResult, setDiffResult] = useState<WorkspaceDiff | null>(null);
  const [determinismResult, setDeterminismResult] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string>('');

  const wsState = wsAdapter.getState();
  const syncStatus = wsAdapter.checkSyncStatus();
  const causalityEvents = wsAdapter.getCausalityEvents();

  // Create initial objects in Reality and sync to Workspace
  const handleCreateAndSyncObjects = useCallback(() => {
    const count = moEngine.listObjects().length;
    const objA = moEngine.createObject(
      currentRealityState,
      `entity_${count + 1}`,
      `Object ${count + 1}`,
      'SOLID',
      [5 + count * 2, 3, 6],
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
      [5 + (count + 1) * 2, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'RESEARCH_USER'
    );

    spatialEngine.registerObject(objA);
    spatialEngine.registerObject(objB);
    const rel = spatialEngine.evaluateRelation(objA, objB);

    const allObjs = moEngine.listObjects();
    const allRels = moEngine.getRelationshipEngine().listRelationships();
    const allSpatial = spatialEngine.listRelations();
    const topo = spatialEngine.getTopology();

    wsAdapter.syncFromReality(currentRealityState, allObjs, allRels, allSpatial, topo);
    triggerUpdate();
    setStatusMessage(`Created & Synced Reality Objects to Workspace (Objects: ${allObjs.length}, Spatial: ${allSpatial.length})`);
  }, [moEngine, currentRealityState, spatialEngine, wsAdapter, triggerUpdate]);

  // Trigger an authorized Reality mutation (e.g. new state in R2)
  const handleAuthorizedRealityMutation = useCallback(() => {
    const newState = r2Engine.createSuccessorState(
      currentRealityState,
      'USER_WORKSPACE_SYNC_RESEARCH',
      'RESEARCH_OPERATOR'
    );
    setCurrentRealityState(newState);
    triggerUpdate();
    setStatusMessage(`Authorized Reality Mutation -> New State ${newState.stateId}. Workspace status is now STALE until synced.`);
  }, [r2Engine, currentRealityState, triggerUpdate]);

  // Resync Workspace with latest Reality State
  const handleResyncWorkspace = useCallback(() => {
    const allObjs = moEngine.listObjects();
    const allRels = moEngine.getRelationshipEngine().listRelationships();
    const allSpatial = spatialEngine.listRelations();
    const topo = spatialEngine.getTopology();

    wsAdapter.syncFromReality(currentRealityState, allObjs, allRels, allSpatial, topo);
    triggerUpdate();
    setStatusMessage(`Workspace Resynchronized with Reality State ${currentRealityState.stateId}`);
  }, [wsAdapter, currentRealityState, moEngine, spatialEngine, triggerUpdate]);

  // Downstream Workspace Camera change (Delta Reality = 0)
  const handleCameraZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.2, wsState.camera.zoom + delta);
    wsAdapter.setCamera({ zoom: newZoom });
    triggerUpdate();
    setStatusMessage(`Camera Zoom adjusted to ${newZoom.toFixed(2)} (Delta Reality = 0)`);
  }, [wsAdapter, wsState.camera.zoom, triggerUpdate]);

  const handleCameraOrbit = useCallback((angleDelta: number) => {
    const newOrbit = wsState.camera.orbitAngle + angleDelta;
    wsAdapter.setCamera({ orbitAngle: newOrbit });
    triggerUpdate();
    setStatusMessage(`Camera Orbit adjusted to ${newOrbit}° (Delta Reality = 0)`);
  }, [wsAdapter, wsState.camera.orbitAngle, triggerUpdate]);

  // Downstream Selection (Delta Reality = 0)
  const handleSelectObject = useCallback((wobjId: string) => {
    setSelectedObjectId(wobjId);
    setSelectedRelId(null);
    setSelectedSpatialId(null);
    wsAdapter.selectObject(wobjId);
    triggerUpdate();
    setStatusMessage(`Selected Workspace Object ${wobjId} (Delta Reality = 0)`);
  }, [wsAdapter, triggerUpdate]);

  const handleSelectSpatial = useCallback((wspatialId: string) => {
    setSelectedSpatialId(wspatialId);
    setSelectedObjectId(null);
    setSelectedRelId(null);
    wsAdapter.selectSpatialRelation(wspatialId);
    triggerUpdate();
    setStatusMessage(`Selected Workspace Spatial Relation ${wspatialId} (Delta Reality = 0)`);
  }, [wsAdapter, triggerUpdate]);

  // Validation
  const handleValidate = useCallback(() => {
    const report = wsAdapter.validate();
    setValidationReport(report);
    setStatusMessage(`Workspace Validation: ${report.status} (Valid: ${report.isValid})`);
  }, [wsAdapter]);

  // Snapshot
  const handleCreateSnapshot = useCallback(() => {
    const snap = wsAdapter.createSnapshot();
    setSnapshot(snap);
    setStatusMessage(`Immutable Workspace Snapshot created: ${snap.snapshotId}`);
  }, [wsAdapter]);

  // 50-cycle Determinism Test
  const handleDeterminismTest = useCallback(() => {
    const signatures = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const sig = wsAdapter.computeExecutionSignature();
      signatures.add(sig.executionHash);
    }
    const passed = signatures.size === 1;
    setDeterminismResult(
      `Determinism: ${passed ? 'PASS' : 'FAIL'} — ${signatures.size} unique signature(s) over 50 cycles`
    );
    setStatusMessage(passed ? 'Determinism test PASSED (σ² = 0)' : 'Determinism test FAILED');
  }, [wsAdapter]);

  // Export JSON
  const handleExportJson = useCallback(() => {
    const json = WorkspaceSerializationEngine.exportWorkspaceState(wsAdapter.getState());
    setExportedJson(json);
    setStatusMessage('Workspace state exported to JSON');
  }, [wsAdapter]);

  const selectedObject = wsState.objects.find((o) => o.workspaceObjectId === selectedObjectId);
  const selectedSpatial = wsState.spatialRelations.find((s) => s.workspaceSpatialId === selectedSpatialId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0A0A0B',
        color: '#E0E0E0',
        fontFamily: 'monospace',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #333',
          backgroundColor: '#111',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#39FF14' }}>
            R6 — Reality → User Workspace Integration
          </span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            Downstream Workspace Representation (Authority: Reality Only)
          </span>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            style={{
              padding: '6px 16px',
              backgroundColor: '#333',
              border: '1px solid #555',
              color: '#E0E0E0',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Exit R6
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 24px',
          backgroundColor: '#0D1117',
          borderBottom: '1px solid #222',
          fontSize: '13px',
        }}
      >
        <div>
          <span style={{ color: '#00FF88' }}>STATUS:</span> {statusMessage}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            SYNC STATUS:{' '}
            <strong
              style={{
                color:
                  syncStatus === 'SYNCED'
                    ? '#00FF88'
                    : syncStatus === 'STALE'
                    ? '#FFA500'
                    : '#FF4444',
              }}
            >
              {syncStatus}
            </strong>
          </span>
          <span>
            REALITY STATE:{' '}
            <span style={{ color: '#00BFFF' }}>{currentRealityState.stateId.slice(0, 16)}</span>
          </span>
          <span>
            WS VER: <span style={{ color: '#39FF14' }}>{wsState.version}</span>
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          borderBottom: '1px solid #222',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={handleCreateAndSyncObjects} style={btnPrimary}>
          Create Objects & Sync
        </button>
        <button onClick={handleAuthorizedRealityMutation} style={btnWarning}>
          Trigger Reality Mutation
        </button>
        <button onClick={handleResyncWorkspace} style={btnSuccess}>
          Resync Workspace
        </button>
        <button onClick={() => handleCameraZoom(0.2)} style={btnStyle}>
          Zoom In (+)
        </button>
        <button onClick={() => handleCameraZoom(-0.2)} style={btnStyle}>
          Zoom Out (-)
        </button>
        <button onClick={() => handleCameraOrbit(15)} style={btnStyle}>
          Orbit (+15°)
        </button>
        <button onClick={handleValidate} style={btnStyle}>
          Validate Workspace
        </button>
        <button onClick={handleCreateSnapshot} style={btnStyle}>
          Create Snapshot
        </button>
        <button onClick={handleDeterminismTest} style={btnStyle}>
          Determinism Test (σ²=0)
        </button>
        <button onClick={handleExportJson} style={btnStyle}>
          Export JSON
        </button>
      </div>

      {/* Main Multi-Panel Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: Reality State & Objects */}
        <div
          style={{
            width: '320px',
            borderRight: '1px solid #222',
            overflowY: 'auto',
            padding: '12px',
          }}
        >
          {/* Reality Info Card */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#161b22',
              borderRadius: '6px',
              marginBottom: '12px',
              border: '1px solid #30363d',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '6px' }}>
              Authoritative Reality
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
              <div>ID: {currentRealityState.realityId}</div>
              <div>State: {currentRealityState.stateId}</div>
              <div>Checksum: {currentRealityState.checksum.slice(0, 20)}...</div>
              <div>Canonical Coords: [5, 3, 6]</div>
              <div>Certainty: {currentRealityState.certainty}</div>
            </div>
          </div>

          {/* Workspace Objects */}
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#39FF14' }}>
            Workspace Objects ({wsState.objects.length})
          </div>
          {wsState.objects.map((obj) => (
            <div
              key={obj.workspaceObjectId}
              onClick={() => handleSelectObject(obj.workspaceObjectId)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
                backgroundColor:
                  selectedObjectId === obj.workspaceObjectId ? '#1f3a2c' : '#111',
                border:
                  selectedObjectId === obj.workspaceObjectId
                    ? '1px solid #39FF14'
                    : '1px solid transparent',
                fontSize: '11px',
              }}
            >
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{obj.name}</div>
              <div style={{ color: '#888' }}>
                {obj.workspaceObjectId.slice(0, 14)} ← {obj.realityObjectId.slice(0, 14)}
              </div>
              <div style={{ color: '#00BFFF' }}>
                Coords: [{obj.coordinates?.join(', ') || 'N/A'}]
              </div>
            </div>
          ))}

          {/* Workspace Spatial Relations */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginTop: '16px',
              marginBottom: '8px',
              color: '#FFA500',
            }}
          >
            Spatial Relations ({wsState.spatialRelations.length})
          </div>
          {wsState.spatialRelations.map((sp) => (
            <div
              key={sp.workspaceSpatialId}
              onClick={() => handleSelectSpatial(sp.workspaceSpatialId)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
                backgroundColor:
                  selectedSpatialId === sp.workspaceSpatialId ? '#3a2e1f' : '#111',
                border:
                  selectedSpatialId === sp.workspaceSpatialId
                    ? '1px solid #FFA500'
                    : '1px solid transparent',
                fontSize: '11px',
              }}
            >
              <div style={{ color: '#FFA500' }}>
                {sp.relationType} ({sp.direction}, dist: {sp.distance.toFixed(1)})
              </div>
              <div style={{ color: '#888' }}>
                Evidence: {sp.evidence} | Certainty: {sp.certainty}
              </div>
            </div>
          ))}
        </div>

        {/* Center/Right Detail View */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Camera Viewport Simulation Card */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#111',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '1px solid #222',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '6px' }}>
              Downstream Camera State (ΔReality = 0)
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', gap: '20px' }}>
              <div>Zoom: <strong>{wsState.camera.zoom.toFixed(2)}x</strong></div>
              <div>Orbit: <strong>{wsState.camera.orbitAngle}°</strong></div>
              <div>Target: <strong>[{wsState.camera.target.join(', ')}]</strong></div>
              <div>Pos: <strong>[{wsState.camera.position.join(', ')}]</strong></div>
            </div>
          </div>

          {/* Selected Item Details */}
          {selectedObject && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#39FF14', marginBottom: '8px' }}>
                Selected Object: {selectedObject.name}
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  backgroundColor: '#111',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '220px',
                }}
              >
                {JSON.stringify(selectedObject, null, 2)}
              </pre>
            </div>
          )}

          {selectedSpatial && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFA500', marginBottom: '8px' }}>
                Selected Spatial Relation
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  backgroundColor: '#111',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '220px',
                }}
              >
                {JSON.stringify(selectedSpatial, null, 2)}
              </pre>
            </div>
          )}

          {/* Validation Report */}
          {validationReport && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: validationReport.isValid ? '#00FF88' : '#FF4444',
                  marginBottom: '8px',
                }}
              >
                Validation Report: {validationReport.status}
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  backgroundColor: '#111',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '160px',
                }}
              >
                {JSON.stringify(validationReport, null, 2)}
              </pre>
            </div>
          )}

          {/* Determinism */}
          {determinismResult && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#111',
                borderRadius: '4px',
                fontSize: '13px',
                border: '1px solid #333',
              }}
            >
              {determinismResult}
            </div>
          )}

          {/* Snapshot */}
          {snapshot && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
                Snapshot: {snapshot.snapshotId}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                Schema: {snapshot.schemaVersion} | Checksum: {snapshot.snapshotChecksum}
              </div>
            </div>
          )}

          {/* Exported JSON */}
          {exportedJson && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
                Exported JSON (R6_SCHEMA_V1)
              </div>
              <pre
                style={{
                  fontSize: '10px',
                  backgroundColor: '#111',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                {exportedJson}
              </pre>
            </div>
          )}

          {/* Causality Events Feed */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00BFFF', marginBottom: '8px' }}>
              Causality Audit Feed ({causalityEvents.length} events) — Verified Invariant (ΔReality = 0 for Downstream)
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {causalityEvents.slice(-12).map((evt, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '11px',
                    color: evt.isRealityInvariant ? '#00FF88' : '#FFA500',
                    marginBottom: '3px',
                  }}
                >
                  [{evt.sequence}] {evt.operation} — {evt.domain} — ΔReality={evt.isRealityInvariant ? '0 (Preserved)' : '≠0 (Propagated Mutation)'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#1a1a2e',
  border: '1px solid #333',
  color: '#E0E0E0',
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '12px',
};

const btnPrimary: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#004080',
  borderColor: '#0066cc',
  color: '#fff',
};

const btnWarning: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#664400',
  borderColor: '#996600',
  color: '#ffcc00',
};

const btnSuccess: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#004d26',
  borderColor: '#008040',
  color: '#66ff99',
};
