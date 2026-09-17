/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Production-Grade 3D Workspace Master Component
 *
 * Full-screen professional 3D workspace integrating:
 * - R9TopAppBar
 * - R9Outliner
 * - R9WorkspaceToolbar
 * - R9ThreeViewport (WebGL Three.js)
 * - R9ContextualInspector
 * - R9StatusBar
 *
 * Invariant: ΔReality = 0 across all workspace actions.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { R9GeometryEngine } from '../geometryEngine';
import { R9TopAppBar } from './R9TopAppBar';
import { R9Outliner } from './R9Outliner';
import { R9WorkspaceToolbar } from './R9WorkspaceToolbar';
import { R9ThreeViewport } from './R9ThreeViewport';
import { R9ContextualInspector } from './R9ContextualInspector';
import { R9StatusBar } from './R9StatusBar';
import { R9GeometryConstructionEngine } from '../geometryConstruction';
import { R9GeometryEditingEngine } from '../geometryEditing';
import { R9MeasurementEngine } from '../measurementEngine';
import { R9GeometryPreviewEngine } from '../geometryPreview';
import { R9SnapshotEngine } from '../snapshot';
import { R9SerializationEngine } from '../serialization';
import {
  WorkspaceGeometry,
  GeometryPrimitiveType,
  BooleanOperationType,
  GeometryPreview,
} from '../types';

export interface R9ProductionWorkspaceProps {
  readonly onExit?: () => void;
}

export const R9ProductionWorkspace: React.FC<R9ProductionWorkspaceProps> = ({ onExit }) => {
  const [activeTool, setActiveTool] = useState<string>('SELECT');
  const [editMode, setEditMode] = useState<'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE'>('OBJECT');
  const [cameraMode, setCameraMode] = useState<'PERSPECTIVE' | 'ORTHOGRAPHIC'>('PERSPECTIVE');
  const [shadingMode, setShadingMode] = useState<'SOLID' | 'WIREFRAME' | 'SOLID_WIREFRAME' | 'XRAY'>('SOLID_WIREFRAME');
  const [isSnappingActive, setIsSnappingActive] = useState<boolean>(true);
  const [snapMode, setSnapMode] = useState<'GRID' | 'VERTEX' | 'EDGE' | 'FACE' | 'OBJECT'>('GRID');

  const [hiddenGeometryIds, setHiddenGeometryIds] = useState<Set<string>>(new Set());
  const [lockedGeometryIds, setLockedGeometryIds] = useState<Set<string>>(new Set(['ROBJ_CANONICAL_ANCHOR_GEO']));
  const [activePreview, setActivePreview] = useState<GeometryPreview | null>(null);

  // Initialize Master Geometry Engine with canonical Reality Anchor and rich initial 3D scene
  const engine = useMemo(() => {
    const canonicalRealityChecksum = 'CS_REALITY_CANONICAL_5_3_6';
    const canonicalWorkspaceChecksum = 'CS_WS_CANONICAL';
    const r9Engine = new R9GeometryEngine(
      'SESS_R9_PRODUCTION',
      'STATE_REALITY_CANONICAL',
      'WS_PRODUCTION_STUDIO',
      'SESS_R8_LINK',
      canonicalRealityChecksum,
      canonicalWorkspaceChecksum
    );

    // 1. Reality Anchor Box at [5, 3, 6] (Authoritative OBSERVED Reality Reference)
    r9Engine.createPrimitive(
      'BOX',
      { width: 2, height: 2, depth: 2 },
      undefined,
      'WOBJ_CANONICAL_ANCHOR',
      {
        realityObjectId: 'ROBJ_CANONICAL_ANCHOR',
        realityStateId: 'STATE_REALITY_CANONICAL',
        realityCoordinates: [5, 3, 6],
        realityCertainty: 'EXACT',
        realityOrigin: 'OBSERVED',
        realityChecksum: canonicalRealityChecksum,
      },
      'RealityAnchorBox'
    );

    // 2. User Constructed Box at [0, 1, 0]
    const boxGeo = r9Engine.createPrimitive(
      'BOX',
      { width: 2.5, height: 2.5, depth: 2.5 },
      {
        translation: [0, 1.25, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        transformChecksum: 'CS_XFORM_BOX',
      },
      'WOBJ_BOX_01',
      null,
      'WorkspaceCube_01'
    );

    // 3. User Constructed Sphere at [8, 2, -2]
    r9Engine.createPrimitive(
      'SPHERE',
      { width: 2.5, height: 2.5, depth: 2.5, radius: 1.25 },
      {
        translation: [8, 2, -2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        transformChecksum: 'CS_XFORM_SPHERE',
      },
      'WOBJ_SPHERE_01',
      null,
      'WorkspaceSphere_01'
    );

    // 4. User Constructed Cylinder at [-5, 2, 3]
    r9Engine.createPrimitive(
      'CYLINDER',
      { width: 2, height: 4, depth: 2, radius: 1 },
      {
        translation: [-5, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        transformChecksum: 'CS_XFORM_CYL',
      },
      'WOBJ_CYLINDER_01',
      null,
      'WorkspaceCylinder_01'
    );

    // 5. User Constructed Torus at [2, 1.5, -6]
    r9Engine.createPrimitive(
      'TORUS',
      { width: 4, height: 1, depth: 4, radius: 2, innerRadius: 0.5 },
      {
        translation: [2, 1.5, -6],
        rotation: [45, 0, 0],
        scale: [1, 1, 1],
        transformChecksum: 'CS_XFORM_TORUS',
      },
      'WOBJ_TORUS_01',
      null,
      'WorkspaceTorus_01'
    );

    // Select the first workspace box initially
    r9Engine.selectGeometry(boxGeo.geometryId);
    return r9Engine;
  }, []);

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const session = engine.getSession();
  const selectedGeoId = session.selectedGeometryIds[0] ?? null;
  const selectedGeo: WorkspaceGeometry | null = selectedGeoId ? session.geometries[selectedGeoId] ?? null : null;
  const bindingState = engine.getBindingState();
  const signature = engine.getExecutionSignature();
  const auditor = engine.getCausalityAuditor();
  const isCausalityValid = auditor.verifyInvariant();
  const causalityEvents = auditor.getEvents();

  // Selection & Outliner Handlers
  const handleSelectGeometry = (geoId: string) => {
    engine.selectGeometry(geoId);
    forceUpdate();
  };

  const handleToggleVisibility = (geoId: string) => {
    setHiddenGeometryIds((prev) => {
      const next = new Set(prev);
      if (next.has(geoId)) next.delete(geoId);
      else next.add(geoId);
      return next;
    });
  };

  const handleToggleLock = (geoId: string) => {
    setLockedGeometryIds((prev) => {
      const next = new Set(prev);
      if (next.has(geoId)) next.delete(geoId);
      else next.add(geoId);
      return next;
    });
  };

  // Creation Handlers
  const handleCreatePrimitive = (type: GeometryPrimitiveType) => {
    const geo = engine.createPrimitive(
      type,
      { width: 2, height: 2, depth: 2, radius: 1 },
      undefined,
      'WOBJ_USER',
      null
    );
    engine.selectGeometry(geo.geometryId);
    forceUpdate();
  };

  const handleCreateCustomMesh = () => {
    const rawVerts: (readonly [number, number, number])[] = [
      [0, 0, 0], [2, 0, 0], [2, 0, 2], [0, 0, 2], [1, 2.5, 1]
    ];
    const rawFaces = [
      [0, 1, 2, 3],
      [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]
    ];
    const meshGeo = R9GeometryConstructionEngine.createCustomMesh(
      session.sessionId,
      'PyramidMesh_01',
      rawVerts,
      rawFaces,
      'WOBJ_USER',
      null,
      'USER_CONSTRUCTED',
      'EXACT',
      Object.keys(session.geometries).length
    );
    engine.addGeometryDirect(meshGeo);
    engine.selectGeometry(meshGeo.geometryId);
    forceUpdate();
  };

  // Transform Handlers
  const handleTransformGeometry = (
    geometryId: string,
    deltaT: [number, number, number],
    deltaR: [number, number, number],
    deltaS: [number, number, number]
  ) => {
    if (lockedGeometryIds.has(geometryId)) return;
    engine.applyTransform(geometryId, deltaT, deltaR, deltaS);
    forceUpdate();
  };

  const handleUpdateTransformDirect = (
    geometryId: string,
    translation: readonly [number, number, number],
    rotation: readonly [number, number, number],
    scale: readonly [number, number, number]
  ) => {
    const geo = session.geometries[geometryId];
    if (!geo || lockedGeometryIds.has(geometryId)) return;

    const deltaT: [number, number, number] = [
      translation[0] - geo.transform.translation[0],
      translation[1] - geo.transform.translation[1],
      translation[2] - geo.transform.translation[2],
    ];
    const deltaR: [number, number, number] = [
      rotation[0] - geo.transform.rotation[0],
      rotation[1] - geo.transform.rotation[1],
      rotation[2] - geo.transform.rotation[2],
    ];
    const deltaS: [number, number, number] = [
      scale[0] / (geo.transform.scale[0] || 1),
      scale[1] / (geo.transform.scale[1] || 1),
      scale[2] / (geo.transform.scale[2] || 1),
    ];

    engine.applyTransform(geometryId, deltaT, deltaR, deltaS);
    forceUpdate();
  };

  // Boolean Handlers
  const handleBooleanOp = (type: BooleanOperationType) => {
    const geoIds = Object.keys(session.geometries);
    if (geoIds.length >= 2) {
      const gA = selectedGeoId || geoIds[0];
      const gB = geoIds.find((id) => id !== gA) || geoIds[1];
      const res = engine.executeBoolean(type, gA, gB);
      if (res) engine.selectGeometry(res.geometryId);
      forceUpdate();
    }
  };

  // Mesh Edit Handlers with Previews
  const handleExtrude = () => {
    if (!selectedGeo || selectedGeo.mesh.faces.length === 0) return;
    const faceId = selectedGeo.mesh.faces[0].faceId;
    const extruded = R9GeometryEditingEngine.extrudeFace(session.sessionId, selectedGeo, faceId, 1.5);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'EXTRUDE', extruded.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleInset = () => {
    if (!selectedGeo || selectedGeo.mesh.faces.length === 0) return;
    const faceId = selectedGeo.mesh.faces[0].faceId;
    const inset = R9GeometryEditingEngine.insetFace(session.sessionId, selectedGeo, faceId, 0.5);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'INSET', inset.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleBevel = () => {
    if (!selectedGeo || selectedGeo.mesh.edges.length === 0) return;
    const edgeId = selectedGeo.mesh.edges[0].edgeId;
    const beveled = R9GeometryEditingEngine.bevelEdge(session.sessionId, selectedGeo, edgeId, 0.3);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'BEVEL', beveled.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleChamfer = () => {
    if (!selectedGeo || selectedGeo.mesh.edges.length === 0) return;
    const edgeId = selectedGeo.mesh.edges[0].edgeId;
    const chamfered = R9GeometryEditingEngine.chamferEdge(session.sessionId, selectedGeo, edgeId, 0.3);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'CHAMFER', chamfered.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleFillet = () => {
    if (!selectedGeo || selectedGeo.mesh.edges.length === 0) return;
    const edgeId = selectedGeo.mesh.edges[0].edgeId;
    const filleted = R9GeometryEditingEngine.filletEdge(session.sessionId, selectedGeo, edgeId, 0.3);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'FILLET', filleted.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleSubdivide = () => {
    if (!selectedGeo) return;
    const subdivided = R9GeometryEditingEngine.subdivide(session.sessionId, selectedGeo);
    const prev = R9GeometryPreviewEngine.createPreview(session.sessionId, selectedGeo, 'SUBDIVIDE', subdivided.mesh);
    setActivePreview(prev);
    forceUpdate();
  };

  const handleMirror = (axis: 'X' | 'Y' | 'Z') => {
    if (!selectedGeo) return;
    const mirrored = R9GeometryEditingEngine.mirror(session.sessionId, selectedGeo, axis);
    engine.addGeometryDirect(mirrored);
    engine.selectGeometry(mirrored.geometryId);
    forceUpdate();
  };

  const handleArray = () => {
    if (!selectedGeo) return;
    const items = R9GeometryEditingEngine.linearArray(session.sessionId, selectedGeo, 3, [3.5, 0, 0]);
    items.forEach((item) => engine.addGeometryDirect(item));
    forceUpdate();
  };

  const handleMeasure = (type: 'DISTANCE' | 'LENGTH' | 'ANGLE' | 'AREA' | 'VOLUME') => {
    if (!selectedGeo) return;
    let m;
    if (type === 'DISTANCE') {
      m = R9MeasurementEngine.measureDistance(
        session.sessionId,
        selectedGeo.transform.translation,
        [5, 3, 6],
        [selectedGeo.geometryId]
      );
    } else if (type === 'AREA') {
      m = R9MeasurementEngine.measureSurfaceArea(session.sessionId, selectedGeo);
    } else if (type === 'VOLUME') {
      m = R9MeasurementEngine.measureVolume(session.sessionId, selectedGeo);
    } else {
      m = R9MeasurementEngine.measureEdgeLength(session.sessionId, selectedGeo, selectedGeo.mesh.edges[0]?.edgeId || '');
    }
    engine.addMeasurement(m);
    forceUpdate();
  };

  // Preview Actions
  const handleCancelPreview = () => {
    setActivePreview(null);
    forceUpdate();
  };

  const handleCommitPreview = () => {
    if (activePreview && selectedGeo) {
      const committed = R9GeometryPreviewEngine.commitPreview(activePreview, selectedGeo);
      engine.addGeometryDirect(committed);
      setActivePreview(null);
      forceUpdate();
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    engine.undo();
    forceUpdate();
  };

  const handleRedo = () => {
    engine.redo();
    forceUpdate();
  };

  // Workspace Storage & JSON Operations
  const handleSave = () => {
    const snap = R9SnapshotEngine.createSnapshot(
      session.sessionId,
      session.geometries,
      bindingState.realityStateChecksum,
      bindingState.workspaceChecksum
    );
    const json = R9SerializationEngine.exportSnapshotToJson(snap);
    localStorage.setItem('R9_WORKSPACE_SAVED_STATE', json);
    alert('Workspace Snapshot saved successfully!');
  };

  const handleLoad = () => {
    const json = localStorage.getItem('R9_WORKSPACE_SAVED_STATE');
    if (!json) {
      alert('No saved workspace snapshot found.');
      return;
    }
    try {
      const snap = R9SerializationEngine.importSnapshotFromJson(json);
      for (const geo of Object.values(snap.geometries)) {
        engine.addGeometryDirect(geo);
      }
      forceUpdate();
      alert('Workspace Snapshot loaded successfully!');
    } catch (e) {
      alert('Failed to load snapshot: ' + String(e));
    }
  };

  const handleExportJson = () => {
    const snap = R9SnapshotEngine.createSnapshot(
      session.sessionId,
      session.geometries,
      bindingState.realityStateChecksum,
      bindingState.workspaceChecksum
    );
    const json = R9SerializationEngine.exportSnapshotToJson(snap);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r9_workspace_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        try {
          const snap = R9SerializationEngine.importSnapshotFromJson(text);
          for (const geo of Object.values(snap.geometries)) {
            engine.addGeometryDirect(geo);
          }
          forceUpdate();
        } catch (err) {
          alert('Error importing JSON: ' + String(err));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset workspace geometry back to canonical anchor?')) {
      window.location.reload();
    }
  };

  const previewGeo: WorkspaceGeometry | null = activePreview && selectedGeo
    ? { ...selectedGeo, mesh: activePreview.previewMesh }
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#020617',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 1. TOP APPLICATION BAR */}
      <R9TopAppBar
        workspaceName="3D Memory Studio Production Workspace"
        bindingState={bindingState}
        canUndo={session.history.length > 0}
        canRedo={session.redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExit={onExit}
        cameraMode={cameraMode}
        onToggleCameraMode={() => setCameraMode((m) => (m === 'PERSPECTIVE' ? 'ORTHOGRAPHIC' : 'PERSPECTIVE'))}
        shadingMode={shadingMode}
        onChangeShadingMode={setShadingMode}
        isSnappingActive={isSnappingActive}
        onToggleSnapping={() => setIsSnappingActive((s) => !s)}
        activeSnapMode={snapMode}
      />

      {/* 2. GROUPED WORKSPACE TOOLBAR */}
      <R9WorkspaceToolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        editMode={editMode}
        onSetEditMode={setEditMode}
        onCreatePrimitive={handleCreatePrimitive}
        onCreateCustomMesh={handleCreateCustomMesh}
        onBooleanOp={handleBooleanOp}
        onExtrude={handleExtrude}
        onInset={handleInset}
        onBevel={handleBevel}
        onChamfer={handleChamfer}
        onFillet={handleFillet}
        onSubdivide={handleSubdivide}
        onMirror={handleMirror}
        onArray={handleArray}
        onMeasure={handleMeasure}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCancelPreview={handleCancelPreview}
        onCommitPreview={handleCommitPreview}
        hasActivePreview={activePreview !== null}
        canUndo={session.history.length > 0}
        canRedo={session.redoStack.length > 0}
        isSelected={Boolean(selectedGeo)}
        isSnappingActive={isSnappingActive}
        onToggleSnapping={() => setIsSnappingActive((s) => !s)}
        snapMode={snapMode}
        onSetSnapMode={setSnapMode}
      />

      {/* 3. MAIN WORKSPACE BODY (Outliner + Viewport + Inspector) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Left Outliner */}
        <R9Outliner
          geometries={session.geometries}
          selectedGeometryId={selectedGeoId}
          onSelectGeometry={handleSelectGeometry}
          hiddenGeometryIds={hiddenGeometryIds}
          lockedGeometryIds={lockedGeometryIds}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          measurements={session.measurements}
          history={session.history}
        />

        {/* Center 3D WebGL Viewport */}
        <main style={{ flex: 1, position: 'relative', height: '100%', backgroundColor: '#070B14' }}>
          <R9ThreeViewport
            geometries={session.geometries}
            selectedGeometryId={selectedGeoId}
            onSelectGeometry={handleSelectGeometry}
            activePreviewMesh={previewGeo}
            hiddenGeometryIds={hiddenGeometryIds}
            lockedGeometryIds={lockedGeometryIds}
            activeTool={activeTool}
            editMode={editMode}
            cameraMode={cameraMode}
            shadingMode={shadingMode}
            isSnappingActive={isSnappingActive}
            snapMode={snapMode}
            onTransformGeometry={handleTransformGeometry}
          />
        </main>

        {/* Right Contextual Inspector */}
        <R9ContextualInspector
          geometry={selectedGeo}
          allGeometries={session.geometries}
          bindingState={bindingState}
          onUpdateTransform={handleUpdateTransformDirect}
        />
      </div>

      {/* 4. BOTTOM STATUS BAR & TELEMETRY */}
      <R9StatusBar
        signature={signature}
        historyLength={session.history.length}
        undoCount={session.undoStack.length}
        redoCount={session.redoStack.length}
        isCausalityValid={isCausalityValid}
        causalityEvents={causalityEvents}
      />
    </div>
  );
};
