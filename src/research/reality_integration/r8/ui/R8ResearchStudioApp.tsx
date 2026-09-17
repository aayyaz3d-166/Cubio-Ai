/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Research Studio Application
 *
 * Integrates R7 3D viewport + R8 interaction layer + inspectors + telemetry.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { RealityMultiObjectEngine } from '../../r4/multiObjectEngine';
import { RealitySpatialEngine } from '../../r5/spatialEngine';
import { RealityWorkspaceAdapter } from '../../r6/realityWorkspaceAdapter';
import { RealityLiveBindingEngine } from '../../r7/liveBinding';
import { SceneGraphEngine } from '../../r7/sceneGraph';
import { R8InteractionEngine } from '../interactionEngine';
import { R8InteractionInspector } from './R8InteractionInspector';
import { R8InteractionToolbar } from './R8InteractionToolbar';
import { R8InteractionTelemetry } from './R8InteractionTelemetry';
import { R8TransformEngine } from '../transformEngine';

interface R8ResearchStudioAppProps {
  onExit?: () => void;
}

export const R8ResearchStudioApp: React.FC<R8ResearchStudioAppProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const [currentRealityState] = useState(() => r2Engine.getCurrentState());

  const moEngine = useMemo(
    () => new RealityMultiObjectEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const spatialEngine = useMemo(
    () => new RealitySpatialEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  useMemo(() => {
    const objA = moEngine.createObject(
      currentRealityState, 'r8_canonical', 'Canonical Reality Object', 'SOLID',
      [5, 3, 6], [2, 2, 2], 'EXACT', 'OBSERVED', 'R8_FIXTURE'
    );
    const objB = moEngine.createObject(
      currentRealityState, 'r8_adjacent', 'Adjacent Node', 'SOLID',
      [10, 3, 6], [2, 2, 2], 'EXACT', 'OBSERVED', 'R8_FIXTURE'
    );
    spatialEngine.registerObject(objA);
    spatialEngine.registerObject(objB);
    spatialEngine.evaluateRelation(objA, objB);
    return [objA, objB];
  }, []);

  const wsAdapter = useMemo(() => {
    return new RealityWorkspaceAdapter(
      currentRealityState,
      moEngine.listObjects(),
      moEngine.getRelationshipEngine().listRelationships(),
      spatialEngine.listRelations(),
      spatialEngine.getTopology()
    );
  }, []);

  const bindingEngine = useMemo(() => new RealityLiveBindingEngine(wsAdapter.getState()), [wsAdapter]);
  const sceneGraph = useMemo(() => bindingEngine.getSceneGraph(), [bindingEngine]);

  const interactionEngine = useMemo(
    () => new R8InteractionEngine(sceneGraph, wsAdapter.getState()),
    [sceneGraph, wsAdapter]
  );

  const [, setTick] = useState(0);
  const triggerRender = useCallback(() => setTick((t) => t + 1), []);
  const [activeTool, setActiveTool] = useState('SELECT');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [telemetryOpen, setTelemetryOpen] = useState(true);

  const session = interactionEngine.getSession();
  const selectedTarget = session.selection.primarySelectedObjectId
    ? interactionEngine.getTarget(session.selection.primarySelectedObjectId) ?? null
    : null;

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
  };

  const handleObjectClick = (visualObjectId: string) => {
    interactionEngine.selectObject(visualObjectId);
    if (activeTool === 'MOVE' && interactionEngine.getTarget(visualObjectId)) {
      interactionEngine.previewTranslate(visualObjectId, [2, 0, 0]);
    } else if (activeTool === 'ROTATE' && interactionEngine.getTarget(visualObjectId)) {
      interactionEngine.previewRotate(visualObjectId, [0, 45, 0]);
    } else if (activeTool === 'SCALE' && interactionEngine.getTarget(visualObjectId)) {
      interactionEngine.previewScale(visualObjectId, [1.5, 1.5, 1.5]);
    }
    triggerRender();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      backgroundColor: '#0A0A0B', color: '#E0E0E0', fontFamily: 'monospace', overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F472B6' }}>
            R8 — Observable Reality 3D Interaction & Controlled Workspace Manipulation
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1E293B',
            color: '#00FF88', fontSize: '11px', fontWeight: 'bold',
          }}>{interactionEngine.getSyncStatus()}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setInspectorOpen(!inspectorOpen)} style={toggleBtn(inspectorOpen)}>Inspector</button>
          <button onClick={() => setTelemetryOpen(!telemetryOpen)} style={toggleBtn(telemetryOpen)}>Telemetry</button>
          {onExit && <button onClick={onExit} style={exitBtn}>Exit R8</button>}
        </div>
      </div>

      {/* Interaction Toolbar */}
      <R8InteractionToolbar
        session={session}
        canUndo={interactionEngine.canUndo()}
        canRedo={interactionEngine.canRedo()}
        hasPreview={session.activePreview !== null}
        onUndo={() => { interactionEngine.undo(); triggerRender(); }}
        onRedo={() => { interactionEngine.redo(); triggerRender(); }}
        onReset={() => { interactionEngine.resetAllTransforms(); triggerRender(); }}
        onCancel={() => { interactionEngine.cancelPreview(); triggerRender(); }}
        onCommit={() => { interactionEngine.commitActivePreview(); triggerRender(); }}
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Object List (simplified viewport representation) */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>
            3D Viewport Objects — Click to interact (Tool: {activeTool})
          </div>
          {Object.entries(session.targets).map(([id, target_]) => {
            const target = target_ as import('../types').InteractionTarget;
            const isSelected = session.selection.selectedObjectIds.includes(id);
            return (
              <div
                key={id}
                onClick={() => handleObjectClick(id)}
                style={{
                  padding: '12px', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: isSelected ? '#1E1B4B' : '#1E293B',
                  border: isSelected ? '2px solid #A78BFA' : '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{target.realityObjectId.slice(0, 20)}...</span>
                  <span style={{ color: target.certainty === 'EXACT' ? '#00E5FF' : '#FFB300', fontSize: '11px' }}>{target.certainty}</span>
                </div>
                <div style={{ fontSize: '11px', display: 'flex', gap: '16px' }}>
                  <span style={{ color: '#00FF88' }}>Reality: [{target.realityCoordinates.join(', ')}]</span>
                  <span style={{ color: '#FCD34D' }}>WS Translate: [{target.workspaceTransform.translation.join(', ')}]</span>
                  <span style={{ color: '#A78BFA' }}>Visual: [{target.visualPosition.join(', ')}]</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Floating Panels */}
        {(inspectorOpen || telemetryOpen) && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px', width: '380px',
            maxHeight: 'calc(100% - 24px)', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto',
          }}>
            {inspectorOpen && (
              <R8InteractionInspector
                target={selectedTarget}
                session={session}
                syncStatus={interactionEngine.getSyncStatus()}
                onClose={() => setInspectorOpen(false)}
              />
            )}
            {telemetryOpen && (
              <R8InteractionTelemetry
                session={session}
                realityChecksum={interactionEngine.getRealityChecksum()}
                workspaceChecksum={interactionEngine.getWorkspaceChecksum()}
                syncStatus={interactionEngine.getSyncStatus()}
                causalityEvents={interactionEngine.getCausalityEvents()}
                canUndo={interactionEngine.canUndo()}
                canRedo={interactionEngine.canRedo()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
  backgroundColor: active ? '#0284C7' : '#1E293B',
  border: '1px solid #334155', color: active ? '#FFFFFF' : '#94A3B8',
});

const exitBtn: React.CSSProperties = {
  padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
  backgroundColor: '#334155', border: '1px solid #475569', color: '#E2E8F0',
};
