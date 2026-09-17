/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI Research Workspace
 *
 * Full-screen spatial intelligence interface integrating:
 * - Conversation stream & natural language command input
 * - Live Three.js 3D Viewport (R9) with real-time non-destructive preview
 * - Contextual AI Inspector
 * - Deterministic AI Status Bar
 *
 * Invariant: ΔReality = 0 across all operations.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { R9GeometryEngine } from '../../r9/geometryEngine';
import { R9ThreeViewport } from '../../r9/ui/R9ThreeViewport';
import { R10AICommandBar } from './R10AICommandBar';
import { R10ConversationPanel } from './R10ConversationPanel';
import { R10AIInspector } from './R10AIInspector';
import { R10AIStatusBar } from './R10AIStatusBar';
import { RealityAIEngine } from '../realityAIEngine';
import { Sparkles, ShieldCheck, Activity, LogOut, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { WorkspaceGeometry } from '../../r9/types';

export interface R10ResearchWorkspaceProps {
  readonly onExit?: () => void;
}

export const R10ResearchWorkspace: React.FC<R10ResearchWorkspaceProps> = ({ onExit }) => {
  // Initialize Master R9 Geometry Engine with initial demonstration scene
  const r9Engine = useMemo(() => {
    const canonicalRealityChecksum = 'CS_REALITY_CANONICAL_5_3_6';
    const canonicalWorkspaceChecksum = 'CS_WS_CANONICAL';
    const engine = new R9GeometryEngine(
      'SESS_F10_STUDIO',
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

    // 2. Initial Workspace Objects (USER_CONSTRUCTED)
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
      { translation: [7, 2, -1], rotation: [0, 0, 0], scale: [1, 1, 1], transformChecksum: 'CS_XFORM_SPHERE' },
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

  // Initialize Master Reality AI Engine
  const aiEngine = useMemo(() => {
    return new RealityAIEngine('SESS_F10_AI_PROD', r9Engine);
  }, [r9Engine]);

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const session = r9Engine.getSession();
  const selectedGeoId = session.selectedGeometryIds[0] ?? null;
  const selectedGeo: WorkspaceGeometry | null = selectedGeoId ? session.geometries[selectedGeoId] ?? null : null;
  const activePlan = aiEngine.getActivePlan();
  const activePreview = aiEngine.getActivePreview();
  const signature = aiEngine.getExecutionSignature();

  // Natural Language Command Submission
  const handleSendCommand = async (text: string) => {
    await aiEngine.processUtterance(text);
    forceUpdate();
  };

  const handleApprovePlan = () => {
    aiEngine.approveAndCommit();
    forceUpdate();
  };

  const handleCancelPlan = () => {
    aiEngine.cancelActivePlan();
    forceUpdate();
  };

  const handleUndo = () => {
    aiEngine.undo();
    forceUpdate();
  };

  const handleRedo = () => {
    aiEngine.redo();
    forceUpdate();
  };

  const handleSelectGeometry = (geoId: string) => {
    r9Engine.selectGeometry(geoId);
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
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '46px',
          padding: '0 16px',
          backgroundColor: '#090D16',
          borderBottom: '1px solid #1E293B',
          userSelect: 'none',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.5)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#F8FAFC' }}>
            3D MEMORY STUDIO
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#312E81',
              color: '#A5B4FC',
              fontWeight: 700,
            }}
          >
            FUNNEL F10: REALITY AI
          </span>
        </div>

        {/* Center: Invariant & Anchor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '5px',
              backgroundColor: '#06281E',
              border: '1px solid #059669',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span style={{ color: '#6EE7B7', fontWeight: 600 }}>REALITY ANCHOR:</span>
            <span style={{ color: '#34D399', fontWeight: 800 }}>[5, 3, 6]</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '5px',
              backgroundColor: '#1E1B4B',
              border: '1px solid #6366F1',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#C7D2FE',
              fontWeight: 700,
            }}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>ΔREALITY = 0</span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleUndo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#1E293B',
              color: '#CBD5E1',
              border: '1px solid #334155',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#1E293B',
              color: '#CBD5E1',
              border: '1px solid #334155',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {onExit && (
            <button
              onClick={onExit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: '#1E1B4B',
                color: '#CBD5E1',
                border: '1px solid #4338CA',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Exit F10</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body: Left Conversation | Center Viewport | Right Inspector */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Left Column: Conversation Stream & Command Bar */}
        <div style={{ width: '340px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1E293B', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <R10ConversationPanel
              messages={aiEngine.getConversation()}
              activePlan={activePlan}
              onApprovePlan={handleApprovePlan}
              onCancelPlan={handleCancelPlan}
            />
          </div>
          <R10AICommandBar onSendCommand={handleSendCommand} />
        </div>

        {/* Center: 3D Viewport (WebGL Three.js) */}
        <main style={{ flex: 1, position: 'relative', height: '100%', backgroundColor: '#070B14' }}>
          <R9ThreeViewport
            geometries={session.geometries}
            selectedGeometryId={selectedGeoId}
            onSelectGeometry={handleSelectGeometry}
            activePreviewMesh={activePreview}
          />
        </main>

        {/* Right: AI Inspector */}
        <R10AIInspector
          activePlan={activePlan}
          selectedGeometry={selectedGeo}
        />
      </div>

      {/* Bottom Status Bar */}
      <R10AIStatusBar signature={signature} />
    </div>
  );
};
