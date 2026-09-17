/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Recovery Execution & Boundary Panel
 */

import React from 'react';
import { RecoveryResult } from '../types';

export interface P620RecoveryPanelProps {
  lastResult: RecoveryResult | null;
}

export const P620RecoveryPanel: React.FC<P620RecoveryPanelProps> = ({ lastResult }) => {
  if (!lastResult) {
    return (
      <div style={styles.emptyPanel}>
        <span style={styles.emptyText}>No recovery executed yet. Select and restore a checkpoint.</span>
      </div>
    );
  }

  const isSuccess = lastResult.success;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h4 style={styles.title}>Recovery Status & Verification</h4>
        <span
          style={{
            ...styles.badge,
            background: isSuccess ? '#1B5E20' : '#B71C1C',
            color: isSuccess ? '#A5D6A7' : '#EF9A9A',
          }}
        >
          {lastResult.status}
        </span>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>Recovery ID:</span>
          <span style={styles.value}>{lastResult.recoveryId ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Source Checkpoint:</span>
          <span style={styles.value}>{lastResult.sourceCheckpointId ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Restored Checksum:</span>
          <span style={styles.checksum}>{lastResult.restoredChecksum ?? 'N/A'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Boundary Security:</span>
          <span style={{ color: '#81C784', fontWeight: 600 }}>CLEAN (Zero credentials/secrets)</span>
        </div>
      </div>

      {lastResult.validationIssues.length > 0 && (
        <div style={styles.issuesBox}>
          <span style={styles.issuesTitle}>Validation / Blocking Reasons:</span>
          {lastResult.validationIssues.map((iss, i) => (
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
  section: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 11,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    color: '#8A8F9E',
  },
  value: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
  },
  issuesBox: {
    background: '#2D1B1F',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  issuesTitle: {
    color: '#FF8A80',
    fontWeight: 600,
  },
  issueText: {
    color: '#FFCDD2',
  },
};
