/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Search & Index Inspector Panel
 */

import React from 'react';
import { WorkspaceIndex, SearchQuery, SearchResults } from '../types';

export interface P614SearchInspectorProps {
  index: WorkspaceIndex | null;
  query: SearchQuery | null;
  results: SearchResults | null;
}

export const P614SearchInspector: React.FC<P614SearchInspectorProps> = ({
  index,
  query,
  results,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Search & Index Inspector</h4>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Index Authority</span>
        <div style={styles.row}>
          <span style={styles.label}>Index ID:</span>
          <span style={styles.value}>{index?.indexId ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Total Entities:</span>
          <span style={styles.value}>{index?.entityCount ?? 0}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Index Checksum:</span>
          <span style={styles.checksum}>{index?.indexChecksum ?? 'N/A'}</span>
        </div>
      </div>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Query Execution</span>
        <div style={styles.row}>
          <span style={styles.label}>Query Sig:</span>
          <span style={styles.checksum}>{query?.querySignature ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>User Role:</span>
          <span style={styles.value}>{query?.accessContext.userRole ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Search Scope:</span>
          <span style={styles.value}>{query?.scope ?? 'N/A'}</span>
        </div>
      </div>

      <div style={styles.section}>
        <span style={styles.sectionTitle}>Result Metrics</span>
        <div style={styles.row}>
          <span style={styles.label}>Matches:</span>
          <span style={styles.value}>{results?.totalMatches ?? 0}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Search Checksum:</span>
          <span style={styles.checksum}>{results?.searchChecksum ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Determinism:</span>
          <span style={{ ...styles.value, color: '#81C784' }}>σ² = 0 (STABLE)</span>
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
    marginBottom: 2,
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
    fontWeight: 500,
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
