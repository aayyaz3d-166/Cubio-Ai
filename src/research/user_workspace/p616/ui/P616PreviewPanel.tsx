/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Read-Only Recovery Preview Panel
 */

import React from 'react';
import { RecoveryPreview } from '../types';

export interface P616PreviewPanelProps {
  preview: RecoveryPreview | null;
}

export const P616PreviewPanel: React.FC<P616PreviewPanelProps> = ({ preview }) => {
  if (!preview) {
    return (
      <div style={styles.emptyPanel}>
        <span style={styles.emptyText}>
          Select a recovery point to generate a read-only restoration preview.
        </span>
      </div>
    );
  }

  const isValid = preview.validationReport.isValid;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h4 style={styles.title}>Read-Only Recovery Preview</h4>
        <span
          style={{
            ...styles.badge,
            background: isValid ? '#1B5E20' : '#B71C1C',
            color: isValid ? '#A5D6A7' : '#EF9A9A',
          }}
        >
          {preview.validationReport.status}
        </span>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Active Checksum</span>
          <span style={styles.checksumVal}>{preview.activeWorkspaceChecksum}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Recovery Checksum</span>
          <span style={styles.checksumVal}>{preview.recoveryPointChecksum}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Model Alignment</span>
          <span style={{ color: preview.modelChecksumMatches ? '#81C784' : '#FFD54F' }}>
            {preview.modelChecksumMatches ? 'IDENTICAL' : 'DIFFERENCE DETECTED'}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Geometry Alignment</span>
          <span style={{ color: preview.geometryChecksumMatches ? '#81C784' : '#FFD54F' }}>
            {preview.geometryChecksumMatches ? 'IDENTICAL [5,3,6]' : 'DIFFERENCE DETECTED'}
          </span>
        </div>
      </div>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Entities Projected for Restore:</span>
        <div style={styles.statsRow}>
          <span>Spaces: {preview.entitiesToRestore.spaces}</span>
          <span>Experiments: {preview.entitiesToRestore.experiments}</span>
          <span>Saved States: {preview.entitiesToRestore.savedStates}</span>
          <span>Versions: {preview.entitiesToRestore.versions}</span>
          <span>Geometries: {preview.entitiesToRestore.geometries}</span>
        </div>
      </div>

      {preview.conflicts.length > 0 && (
        <div style={styles.conflictsBox}>
          <span style={styles.conflictsTitle}>
            Conflicts Detected ({preview.conflicts.length}):
          </span>
          {preview.conflicts.map((c) => (
            <div key={c.conflictId} style={styles.conflictItem}>
              <span style={styles.conflictType}>{c.conflictType}</span>
              <span>{c.description}</span>
            </div>
          ))}
        </div>
      )}

      {preview.validationReport.issues.length > 0 && (
        <div style={styles.issuesBox}>
          <span style={styles.issuesTitle}>Validation Warnings / Issues:</span>
          {preview.validationReport.issues.map((iss, i) => (
            <div key={i} style={styles.issueText}>• {iss}</div>
          ))}
        </div>
      )}
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
  emptyPanel: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 32,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8A8F9E',
    fontSize: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  badge: {
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  card: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  cardLabel: {
    color: '#8A8F9E',
  },
  checksumVal: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  section: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#90CAF9',
    fontWeight: 600,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#FFF',
  },
  conflictsBox: {
    background: '#2D1B1F',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  conflictsTitle: {
    color: '#FF8A80',
    fontWeight: 600,
  },
  conflictItem: {
    display: 'flex',
    gap: 8,
  },
  conflictType: {
    color: '#FFD54F',
    fontWeight: 600,
  },
  issuesBox: {
    background: '#1F1E2A',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  issuesTitle: {
    color: '#E57373',
    fontWeight: 600,
  },
  issueText: {
    color: '#FFCDD2',
  },
};
