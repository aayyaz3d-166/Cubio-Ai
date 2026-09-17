/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Master Spatial World Model & Reasoning Studio UI
 *
 * Full-screen spatial intelligence interface integrating:
 * - World Model entity/relation panel
 * - 3D Three.js spatial viewport & 2D Relationship Graph
 * - Structured query & multi-hop reasoning panel
 * - Contextual Inspector & Invariant Telemetry
 *
 * Invariant: ΔReality = 0 across all operations.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { R9GeometryEngine } from '../../r9/geometryEngine';
import { WorldModelEngine } from '../worldModelEngine';
import { R11TopBar } from './R11TopBar';
import { R11WorldModelPanel } from './R11WorldModelPanel';
import { R11WorldGraph } from './R11WorldGraph';
import { R11ThreeViewport } from './R11ThreeViewport';
import { R11QueryPanel } from './R11QueryPanel';
import { R11ReasoningPanel } from './R11ReasoningPanel';
import { R11Inspector } from './R11Inspector';
import { R11Telemetry } from './R11Telemetry';
import { SpatialQueryResult, WorldEntity } from '../types';

export interface R11ResearchStudioProps {
  readonly onExit?: () => void;
}

export const R11ResearchStudio: React.FC<R11ResearchStudioProps> = ({ onExit }) => {
  // Initialize Master R9 Geometry Engine with initial demonstration representations
  const r9Engine = useMemo(() => {
    const canonicalRealityChecksum = 'CS_REALITY_CANONICAL_5_3_6';
    const canonicalWorkspaceChecksum = 'CS_WS_CANONICAL';
    const engine = new R9GeometryEngine(
      'SESS_F11_STUDIO',
      'STATE_REALITY_CANONICAL',
      'WS_PRODUCTION_STUDIO',
      'SESS_R8_LINK',
      canonicalRealityChecksum,
      canonicalWorkspaceChecksum
    );

    // 1. Authoritative Physical Reality Anchor Box at [5, 3, 6]
    engine.createPrimitive(
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

    // 2. Initial Workspace Objects
    const cube = engine.createPrimitive(
      'BOX',
      { width: 2.5, height: 2.5, depth: 2.5 },
      { translation: [0, 1.25, 0], rotation: [0, 0, 0], scale: [1, 1, 1], transformChecksum: 'CS_XFORM_CUBE' },
      'WOBJ_CUBE_01',
      null,
      'Cube_01'
    );

    engine.createPrimitive(
      'SPHERE',
      { width: 2.5, height: 2.5, depth: 2.5, radius: 1.25 },
      { translation: [8, 2, -2], rotation: [0, 0, 0], scale: [1, 1, 1], transformChecksum: 'CS_XFORM_SPHERE' },
      'WOBJ_SPHERE_01',
      null,
      'Sphere_01'
    );

    engine.createPrimitive(
      'CYLINDER',
      { width: 2, height: 4, depth: 2, radius: 1 },
      { translation: [-5, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1], transformChecksum: 'CS_XFORM_CYL' },
      'WOBJ_CYLINDER_01',
      null,
      'Cylinder_01'
    );

    engine.createPrimitive(
      'TORUS',
      { width: 4, height: 1, depth: 4, radius: 2, innerRadius: 0.5 },
      { translation: [2, 1.5, -6], rotation: [45, 0, 0], scale: [1, 1, 1], transformChecksum: 'CS_XFORM_TORUS' },
      'WOBJ_TORUS_01',
      null,
      'Torus_01'
    );

    engine.selectGeometry(cube.geometryId);
    return engine;
  }, []);

  // Initialize World Model Engine
  const modelEngine = useMemo(() => {
    return new WorldModelEngine('MODEL_F11_PROD', r9Engine);
  }, [r9Engine]);

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [lastQueryResult, setLastQueryResult] = useState<SpatialQueryResult | null>(null);
  const [activeCenterView, setActiveCenterView] = useState<'3D' | 'GRAPH' | 'SPLIT'>('SPLIT');

  const model = modelEngine.getModel();
  const session = r9Engine.getSession();
  const signature = modelEngine.getExecutionSignature();

  const selectedEntity: WorldEntity | null = selectedEntityId
    ? model.entities[selectedEntityId] || null
    : null;

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    // Also select corresponding geometry in R9 if available
    const ent = model.entities[entityId];
    if (ent?.properties?.geometryId) {
      r9Engine.selectGeometry(ent.properties.geometryId);
    }
    forceUpdate();
  };

  const handleSelectGeometry = (geoId: string) => {
    r9Engine.selectGeometry(geoId);
    // Find matching entity
    const list: WorldEntity[] = Object.values(model.entities);
    const match = list.find((e) => e.properties?.geometryId === geoId);
    if (match) {
      setSelectedEntityId(match.entityId);
    }
    forceUpdate();
  };

  const handleExecuteQuery = (queryText: string) => {
    const res = modelEngine.query(queryText);
    setLastQueryResult(res);
    if (res.matchedEntityIds.length > 0) {
      setSelectedEntityId(res.matchedEntityIds[0]);
    }
    forceUpdate();
  };

  const handleResync = () => {
    modelEngine.synchronize();
    forceUpdate();
  };

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
      {/* Top Bar */}
      <R11TopBar
        syncStatus={model.syncStatus}
        onResync={handleResync}
        onExit={onExit}
      />

      {/* Main Studio Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Left Column: World Model Panel */}
        <R11WorldModelPanel
          model={model}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />

        {/* Center: 3D Viewport & Graph */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
          {/* View Toggle */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 30,
              display: 'flex',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {(['3D', 'GRAPH', 'SPLIT'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveCenterView(view)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: activeCenterView === view ? '#2563EB' : 'transparent',
                  color: activeCenterView === view ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Center Canvas Areas */}
          <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
            {(activeCenterView === '3D' || activeCenterView === 'SPLIT') && (
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <R11ThreeViewport
                  geometries={session.geometries}
                  selectedGeometryId={session.selectedGeometryIds[0] || null}
                  onSelectGeometry={handleSelectGeometry}
                />
              </div>
            )}

            {(activeCenterView === 'GRAPH' || activeCenterView === 'SPLIT') && (
              <div
                style={{
                  width: activeCenterView === 'SPLIT' ? '380px' : '100%',
                  height: '100%',
                  borderLeft: activeCenterView === 'SPLIT' ? '1px solid #1E293B' : 'none',
                  backgroundColor: '#090D16',
                }}
              >
                <R11WorldGraph
                  model={model}
                  selectedEntityId={selectedEntityId}
                  onSelectEntity={handleSelectEntity}
                />
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Query & Reasoning & Inspector */}
        <div style={{ width: '360px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1E293B', height: '100%' }}>
          <R11QueryPanel onExecuteQuery={handleExecuteQuery} />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderBottom: '1px solid #1E293B', overflow: 'hidden' }}>
              <R11ReasoningPanel lastQueryResult={lastQueryResult} model={model} />
            </div>
            <div style={{ height: '320px', overflow: 'hidden' }}>
              <R11Inspector model={model} selectedEntity={selectedEntity} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <R11Telemetry signature={signature} />
    </div>
  );
};
