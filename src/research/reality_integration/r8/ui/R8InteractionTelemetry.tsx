/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction Telemetry UI Component
 *
 * Live telemetry displaying Reality/Workspace/Interaction checksums, selection,
 * active operation, transform delta, history, undo/redo, binding, causality, and determinism status.
 */

import React from 'react';
import { RealityInteractionSession, InteractionStaleState } from '../types';
import { R8CausalityEvent } from '../causality';

interface R8InteractionTelemetryProps {
  session: RealityInteractionSession;
  realityChecksum: string;
  workspaceChecksum: string;
  syncStatus: InteractionStaleState;
  causalityEvents: readonly R8CausalityEvent[];
  canUndo: boolean;
  canRedo: boolean;
}

export const R8InteractionTelemetry: React.FC<R8InteractionTelemetryProps> = ({
  session,
  realityChecksum,
  workspaceChecksum,
  syncStatus,
  causalityEvents,
  canUndo,
  canRedo,
}) => {
  const getSyncColor = (s: string) => {
    if (s === 'SYNCED' || s === 'RESYNCED') return '#00FF88';
    if (s === 'STALE') return '#FFA500';
    return '#FF4444';
  };

  return (
    <div style={{
      padding: '16px', backgroundColor: '#0F172A', border: '1px solid #334155',
      borderRadius: '8px', color: '#E2E8F0', fontSize: '12px', fontFamily: 'monospace',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#F472B6' }}>
          R8 INTERACTION TELEMETRY
        </span>
        <span style={{
          padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1E293B',
          color: getSyncColor(syncStatus), fontSize: '11px', fontWeight: 'bold',
        }}>{syncStatus}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <MetricBox label="SELECTED" value={String(session.selection.selectedObjectIds.length)} />
        <MetricBox label="HISTORY" value={String(session.history.length)} />
        <MetricBox label="UNDO" value={canUndo ? 'YES' : 'NO'} color={canUndo ? '#00FF88' : '#64748B'} />
        <MetricBox label="REDO" value={canRedo ? 'YES' : 'NO'} color={canRedo ? '#00FF88' : '#64748B'} />
      </div>

      <div style={{ marginBottom: '12px', fontSize: '11px', color: '#94A3B8' }}>
        <div>Reality CS: <span style={{ color: '#CBD5E1' }}>{realityChecksum.slice(0, 24)}...</span></div>
        <div>Workspace CS: <span style={{ color: '#CBD5E1' }}>{workspaceChecksum.slice(0, 24)}...</span></div>
        <div>Session CS: <span style={{ color: '#CBD5E1' }}>{session.sessionChecksum.slice(0, 24)}...</span></div>
        <div>Selection CS: <span style={{ color: '#CBD5E1' }}>{session.selection.selectionChecksum.slice(0, 24)}...</span></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        <div style={{ color: '#94A3B8' }}>State: <span style={{ color: '#38BDF8' }}>{session.state}</span></div>
        <div style={{ color: '#94A3B8' }}>
          Preview: <span style={{ color: session.activePreview ? '#FCD34D' : '#64748B' }}>
            {session.activePreview ? `Active (${session.activePreview.targetObjectId.slice(0, 16)}...)` : 'None'}
          </span>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 'bold', color: '#CBD5E1', marginBottom: '6px', fontSize: '11px' }}>
          CAUSALITY AUDIT (ΔReality = 0)
        </div>
        <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
          {causalityEvents.slice(-6).map((evt, i) => (
            <div key={i} style={{
              fontSize: '10px', marginBottom: '2px',
              color: evt.isRealityInvariant ? '#00FF88' : '#FF4444',
            }}>
              [{evt.sequence}] {evt.operation} — {evt.domain} — ΔReality={evt.isRealityInvariant ? '0' : '≠0 ⚠'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ backgroundColor: '#1E293B', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
    <div style={{ fontSize: '10px', color: '#94A3B8' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: color ?? '#38BDF8' }}>{value}</div>
  </div>
);
