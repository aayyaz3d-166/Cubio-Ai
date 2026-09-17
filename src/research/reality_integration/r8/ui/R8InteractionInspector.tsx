/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction Inspector UI Component
 *
 * Read-only inspector displaying Reality, Workspace, Visual, and Interaction domains.
 */

import React from 'react';
import { InteractionTarget, InteractionStaleState, RealityInteractionSession } from '../types';

interface R8InteractionInspectorProps {
  target: InteractionTarget | null;
  session: RealityInteractionSession;
  syncStatus: InteractionStaleState;
  onClose?: () => void;
}

export const R8InteractionInspector: React.FC<R8InteractionInspectorProps> = ({
  target,
  session,
  syncStatus,
  onClose,
}) => {
  if (!target) {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: 'bold', color: '#CBD5E1', marginBottom: '4px' }}>
          INTERACTION INSPECTOR
        </div>
        <div style={{ color: '#94A3B8', fontSize: '12px' }}>
          No object selected. Click an object in the 3D viewport to inspect.
        </div>
      </div>
    );
  }

  const getSyncColor = (s: string) => {
    if (s === 'SYNCED' || s === 'RESYNCED') return '#00FF88';
    if (s === 'STALE') return '#FFA500';
    return '#FF4444';
  };

  const xform = target.workspaceTransform;

  return (
    <div style={panelStyle}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#F472B6' }}>
          INTERACTION INSPECTOR
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1E293B',
            color: getSyncColor(syncStatus), fontSize: '11px', fontWeight: 'bold',
          }}>{syncStatus}</span>
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          )}
        </div>
      </div>

      <div style={sectionHeader}>REALITY (Authoritative)</div>
      <div style={gridStyle}>
        <div style={labelStyle}>Reality Object ID:</div>
        <div style={{ color: '#38BDF8' }}>{target.realityObjectId}</div>
        <div style={labelStyle}>Reality State ID:</div>
        <div style={{ color: '#CBD5E1' }}>{target.realityStateId}</div>
        <div style={labelStyle}>Reality Coords:</div>
        <div style={{ color: '#00FF88', fontWeight: 'bold' }}>[{target.realityCoordinates.join(', ')}]</div>
        <div style={labelStyle}>Certainty:</div>
        <div style={{ color: target.certainty === 'EXACT' ? '#00E5FF' : '#FFB300' }}>{target.certainty}</div>
        <div style={labelStyle}>Origin:</div>
        <div style={{ color: '#F472B6' }}>{target.origin}</div>
      </div>

      <div style={sectionHeader}>WORKSPACE (Transform Overlay)</div>
      <div style={gridStyle}>
        <div style={labelStyle}>Workspace ID:</div>
        <div style={{ color: '#CBD5E1' }}>{target.workspaceObjectId}</div>
        <div style={labelStyle}>Translation:</div>
        <div style={{ color: '#FCD34D' }}>[{xform.translation.join(', ')}]</div>
        <div style={labelStyle}>Rotation:</div>
        <div style={{ color: '#FCD34D' }}>[{xform.rotation.join(', ')}]°</div>
        <div style={labelStyle}>Scale:</div>
        <div style={{ color: '#FCD34D' }}>[{xform.scale.join(', ')}]</div>
        <div style={labelStyle}>Transform CS:</div>
        <div style={{ color: '#64748B', fontSize: '10px' }}>{xform.transformChecksum}</div>
      </div>

      <div style={sectionHeader}>VISUAL (Computed)</div>
      <div style={gridStyle}>
        <div style={labelStyle}>Visual Object ID:</div>
        <div style={{ color: '#CBD5E1' }}>{target.visualObjectId}</div>
        <div style={labelStyle}>Visual Position:</div>
        <div style={{ color: '#A78BFA', fontWeight: 'bold' }}>[{target.visualPosition.join(', ')}]</div>
      </div>

      <div style={sectionHeader}>INTERACTION (Session)</div>
      <div style={gridStyle}>
        <div style={labelStyle}>Session ID:</div>
        <div style={{ color: '#CBD5E1', fontSize: '10px' }}>{session.sessionId}</div>
        <div style={labelStyle}>State:</div>
        <div style={{ color: '#38BDF8' }}>{session.state}</div>
        <div style={labelStyle}>History Length:</div>
        <div style={{ color: '#E2E8F0' }}>{session.history.length}</div>
        <div style={labelStyle}>Undo Available:</div>
        <div style={{ color: session.undoStack.length > 0 ? '#00FF88' : '#64748B' }}>{session.undoStack.length}</div>
        <div style={labelStyle}>Redo Available:</div>
        <div style={{ color: session.redoStack.length > 0 ? '#00FF88' : '#64748B' }}>{session.redoStack.length}</div>
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  padding: '16px', backgroundColor: '#0F172A', border: '1px solid #334155',
  borderRadius: '8px', color: '#E2E8F0', fontSize: '12px', fontFamily: 'monospace',
};

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', marginBottom: '12px',
};

const labelStyle: React.CSSProperties = { color: '#94A3B8' };

const sectionHeader: React.CSSProperties = {
  fontSize: '11px', fontWeight: 'bold', color: '#94A3B8',
  borderBottom: '1px solid #1E293B', paddingBottom: '4px', marginBottom: '6px', marginTop: '4px',
  letterSpacing: '0.5px',
};
