/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Read-Only Import Preview Panel
 */

import React from 'react';
import { ImportPreview } from '../types';

export interface P615PreviewPanelProps {
  preview: ImportPreview | null;
}

export const P615PreviewPanel: React.FC<P615PreviewPanelProps> = ({ preview }) => {
  if (!preview) {
    return (
      <div style={styles.emptyPanel}>
        <span style={styles.emptyText}>No package loaded for preview. Parse a package to preview.</span>
      </div>
    );
  }

  const isValid = preview.validationReport.isValid;

  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h4 style={styles.title}>Read-Only Import Preview</h4>
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
          <span style={styles.cardTitle}>Spaces to Import</span>
          <span style={styles.cardCount}>{preview.spacesToImport.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Experiments</span>
          <span style={styles.cardCount}>{preview.experimentsToImport.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>States & Versions</span>
          <span style={styles.cardCount}>
            {preview.statesToImport.length + preview.versionsToImport.length}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Geometries</span>
          <span style={styles.cardCount}>{preview.geometriesToImport.length}</span>
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
              <span style={styles.conflictDesc}>{c.description}</span>
            </div>
          ))}
        </div>
      )}

      {preview.validationReport.issues.length > 0 && (
        <div style={styles.issuesBox}>
          <span style={styles.issuesTitle}>Validation Issues:</span>
          {preview.validationReport.issues.map((iss, i) => (
            <div key={i} style={styles.issueItem}>
              • {iss}
            </div>
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
  headerRow: {
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
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  card: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: 10,
    color: '#90CAF9',
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 16,
    fontWeight: 700,
    color: '#FFF',
  },
  conflictsBox: {
    background: '#2D1B1F',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  conflictsTitle: {
    fontSize: 11,
    color: '#FF8A80',
    fontWeight: 600,
  },
  conflictItem: {
    display: 'flex',
    gap: 8,
    fontSize: 11,
  },
  conflictType: {
    color: '#FFD54F',
    fontWeight: 600,
  },
  conflictDesc: {
    color: '#FFE082',
  },
  issuesBox: {
    background: '#1F1E2A',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  issuesTitle: {
    fontSize: 11,
    color: '#E57373',
    fontWeight: 600,
  },
  issueItem: {
    fontSize: 11,
    color: '#EF9A9A',
  },
};
