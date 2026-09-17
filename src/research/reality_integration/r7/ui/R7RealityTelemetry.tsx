/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Reality Telemetry UI Component
 *
 * Real-time telemetry displaying synchronization status, delta reality invariant, and causality logs.
 */

import React from 'react';
import { R7SceneGraph, R7LiveSyncStatus } from '../types';
import { R7CausalityEvent } from '../causality';

interface R7RealityTelemetryProps {
  sceneGraph: R7SceneGraph;
  syncStatus: R7LiveSyncStatus;
  realityChecksum: string;
  workspaceChecksum: string;
  causalityEvents: readonly R7CausalityEvent[];
}

export const R7RealityTelemetry: React.FC<R7RealityTelemetryProps> = ({
  sceneGraph,
  syncStatus,
  realityChecksum,
  workspaceChecksum,
  causalityEvents,
}) => {
  const getSyncBadgeColor = (s: R7LiveSyncStatus) => {
    if (s === 'SYNCED') return '#00FF88';
    if (s === 'STALE') return '#FFA500';
    if (s === 'SYNCING') return '#38BDF8';
    return '#FF4444';
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: '#E2E8F0',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
          paddingBottom: '8px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00E5FF' }}>
          REALITY TELEMETRY & CAUSALITY
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#1E293B',
            color: getSyncBadgeColor(syncStatus),
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          {syncStatus}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <div style={metricBox}>
          <div style={metricLabel}>OBJECTS</div>
          <div style={metricValue}>{sceneGraph.nodes.length}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>RELATIONSHIPS</div>
          <div style={metricValue}>{sceneGraph.relationships.length}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>SPATIAL RELS</div>
          <div style={metricValue}>{sceneGraph.spatialRelations.length}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>TOPOLOGY EDGES</div>
          <div style={metricValue}>{sceneGraph.topologyEdges.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '11px', color: '#94A3B8' }}>
        <div>Reality Checksum: <span style={{ color: '#CBD5E1' }}>{realityChecksum.slice(0, 24)}...</span></div>
        <div>Workspace Checksum: <span style={{ color: '#CBD5E1' }}>{workspaceChecksum.slice(0, 24)}...</span></div>
        <div>Scene Checksum: <span style={{ color: '#CBD5E1' }}>{sceneGraph.sceneChecksum.slice(0, 24)}...</span></div>
      </div>

      <div>
        <div style={{ fontWeight: 'bold', color: '#CBD5E1', marginBottom: '6px', fontSize: '11px' }}>
          CAUSALITY AUDIT FEED (ΔReality = 0 Verified)
        </div>
        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
          {causalityEvents.slice(-6).map((evt, i) => (
            <div
              key={i}
              style={{
                fontSize: '10px',
                color: evt.isRealityInvariant ? '#00FF88' : '#FFA500',
                marginBottom: '2px',
              }}
            >
              [{evt.sequence}] {evt.operation} — {evt.domain} — ΔReality={evt.isRealityInvariant ? '0 (Invariant)' : '≠0 (Propagated)'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const metricBox: React.CSSProperties = {
  backgroundColor: '#1E293B',
  padding: '8px',
  borderRadius: '4px',
  textAlign: 'center',
};

const metricLabel: React.CSSProperties = {
  fontSize: '10px',
  color: '#94A3B8',
};

const metricValue: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#38BDF8',
};
