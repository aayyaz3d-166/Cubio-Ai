/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Reality Inspector UI Component
 *
 * Displays rich read-only metadata for the currently selected visual object.
 */

import React from 'react';
import { R7VisualObject, R7LiveSyncStatus } from '../types';
import { RealityInspectorEngine } from '../realityInspector';

interface R7RealityInspectorProps {
  selectedObject: R7VisualObject | null;
  syncStatus: R7LiveSyncStatus;
  onClose?: () => void;
}

export const R7RealityInspector: React.FC<R7RealityInspectorProps> = ({
  selectedObject,
  syncStatus,
  onClose,
}) => {
  if (!selectedObject) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          color: '#94A3B8',
          fontSize: '12px',
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#CBD5E1', marginBottom: '4px' }}>
          REALITY INSPECTOR
        </div>
        <div>No Reality Object selected. Click an object in the 3D viewport to inspect.</div>
      </div>
    );
  }

  const summary = RealityInspectorEngine.formatSummary(selectedObject, syncStatus);

  const getCertaintyColor = (c: string) => {
    if (c === 'EXACT') return '#00E5FF';
    if (c === 'CONSTRAINED') return '#FFB300';
    return '#AB47BC';
  };

  const getSyncColor = (s: string) => {
    if (s === 'SYNCED') return '#00FF88';
    if (s === 'STALE') return '#FFA500';
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
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#38BDF8' }}>
          REALITY OBJECT INSPECTOR
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#1E293B',
              color: getSyncColor(syncStatus),
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {syncStatus}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px' }}>
        <div style={{ color: '#94A3B8' }}>Object Name:</div>
        <div style={{ fontWeight: 'bold', color: '#F8FAFC' }}>{summary.name}</div>

        <div style={{ color: '#94A3B8' }}>Reality Object ID:</div>
        <div style={{ color: '#38BDF8' }}>{summary.realityObjectId}</div>

        <div style={{ color: '#94A3B8' }}>Reality State ID:</div>
        <div style={{ color: '#CBD5E1' }}>{summary.realityStateId}</div>

        <div style={{ color: '#94A3B8' }}>Workspace ID:</div>
        <div style={{ color: '#CBD5E1' }}>{summary.workspaceObjectId}</div>

        <div style={{ color: '#94A3B8' }}>Visual Object ID:</div>
        <div style={{ color: '#CBD5E1' }}>{summary.visualObjectId}</div>

        <div style={{ color: '#94A3B8' }}>Authoritative Pos:</div>
        <div style={{ color: '#4ADE80', fontWeight: 'bold' }}>
          [{summary.coordinates.join(', ')}]
        </div>

        {summary.dimensions && (
          <>
            <div style={{ color: '#94A3B8' }}>Dimensions:</div>
            <div style={{ color: '#FCD34D' }}>[{summary.dimensions.join(', ')}]</div>
          </>
        )}

        <div style={{ color: '#94A3B8' }}>Certainty:</div>
        <div>
          <span
            style={{
              color: getCertaintyColor(summary.certainty),
              fontWeight: 'bold',
            }}
          >
            {summary.certainty}
          </span>
        </div>

        <div style={{ color: '#94A3B8' }}>Origin:</div>
        <div style={{ color: '#F472B6' }}>{summary.origin}</div>

        <div style={{ color: '#94A3B8' }}>Evidence:</div>
        <div style={{ color: '#FCD34D' }}>{summary.evidence}</div>

        <div style={{ color: '#94A3B8' }}>Visual Checksum:</div>
        <div style={{ color: '#64748B', fontSize: '10px' }}>{summary.checksum}</div>
      </div>
    </div>
  );
};
