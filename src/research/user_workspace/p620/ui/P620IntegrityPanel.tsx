/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Integrity & Causality Monitor Panel
 */

import React from 'react';
import { IntegrityReport } from '../types';

export interface P620IntegrityPanelProps {
  report: IntegrityReport | null;
  causalityPassed: boolean;
}

export const P620IntegrityPanel: React.FC<P620IntegrityPanelProps> = ({
  report,
  causalityPassed,
}) => {
  const isValid = report?.isValid ?? true;

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Workspace Integrity & Invariants Monitor</h4>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.label}>Integrity Status:</span>
          <span
            style={{
              ...styles.badge,
              background: isValid ? '#1B5E20' : '#B71C1C',
              color: isValid ? '#A5D6A7' : '#EF9A9A',
            }}
          >
            {report?.status ?? 'INTEGRITY_VALID'}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Issues Detected:</span>
          <span style={{ ...styles.value, color: report && report.issues.length > 0 ? '#FFD54F' : '#81C784' }}>
            {report?.issues.length ?? 0}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Causal Separation:</span>
          <span
            style={{
              ...styles.badge,
              background: causalityPassed ? '#1B5E20' : '#B71C1C',
              color: causalityPassed ? '#A5D6A7' : '#EF9A9A',
            }}
          >
            {causalityPassed ? 'INVARIANTS PRESERVED' : 'BREACH DETECTED'}
          </span>
        </div>
      </div>

      {report && report.issues.length > 0 && (
        <div style={styles.issuesList}>
          {report.issues.map((iss) => (
            <div key={iss.issueId} style={styles.issueRow}>
              <span style={styles.issueCode}>{iss.code}</span>
              <span style={styles.issueEntity}>[{iss.entityType}:{iss.entityId}]</span>
              <span style={styles.issueMsg}>{iss.message}</span>
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
  title: {
    margin: 0,
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#8A8F9E',
  },
  value: {
    fontSize: 14,
    fontWeight: 700,
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  issuesList: {
    background: '#24171A',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 120,
    overflowY: 'auto',
  },
  issueRow: {
    display: 'flex',
    gap: 6,
    fontSize: 11,
  },
  issueCode: {
    color: '#FF8A80',
    fontWeight: 600,
  },
  issueEntity: {
    color: '#FFD54F',
    fontFamily: 'monospace',
  },
  issueMsg: {
    color: '#FFE082',
  },
};
