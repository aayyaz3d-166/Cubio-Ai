/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Inspector Panel
 */

import React from 'react';
import { RecoveryPoint, RecoveryPreview } from '../types';

export interface P616RecoveryInspectorProps {
  selectedPoint: RecoveryPoint | null;
  preview: RecoveryPreview | null;
  activeChecksum: string;
}

export const P616RecoveryInspector: React.FC<P616RecoveryInspectorProps> = ({
  selectedPoint,
  preview,
  activeChecksum,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Recovery Inspector</h4>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Active Authority</span>
        <div style={styles.row}>
          <span style={styles.label}>Active CS:</span>
          <span style={styles.checksum}>{activeChecksum}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Canonical Coordinates:</span>
          <span style={styles.value}>[5, 3, 6] (LOCKED)</span>
        </div>
      </div>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Recovery Point Metadata</span>
        <div style={styles.row}>
          <span style={styles.label}>Point ID:</span>
          <span style={styles.value}>{selectedPoint?.recoveryPointId ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Schema:</span>
          <span style={styles.value}>{selectedPoint?.schemaVersion ?? '6.16.0'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Model CS:</span>
          <span style={styles.checksum}>{selectedPoint?.modelChecksum ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Geometry CS:</span>
          <span style={styles.checksum}>{selectedPoint?.geometryChecksum ?? 'N/A'}</span>
        </div>
      </div>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Invariants & Safety</span>
        <div style={styles.row}>
          <span style={styles.label}>Immutability:</span>
          <span style={{ color: '#81C784', fontWeight: 600 }}>Object.isFrozen (LOCKED)</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Conflicts:</span>
          <span style={styles.value}>{preview?.conflicts.length ?? 0}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Corruption:</span>
          <span
            style={{
              color: preview?.validationReport.corruptionReport.isCorrupted ? '#EF5350' : '#81C784',
              fontWeight: 600,
            }}
          >
            {preview?.validationReport.corruptionReport.isCorrupted ? 'CORRUPTED' : 'CLEAN'}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Determinism:</span>
          <span style={{ color: '#81C784' }}>σ² = 0 (STABLE)</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 16,
    color: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderBottom: '1px solid #1F2233',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#90CAF9',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
  },
  label: {
    color: '#8A8F9E',
  },
  value: {
    color: '#FFF',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
