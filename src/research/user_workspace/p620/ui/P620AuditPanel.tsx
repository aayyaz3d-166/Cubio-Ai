/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Workspace Graph Audit Panel
 */

import React from 'react';
import { WorkspaceAudit } from '../types';

export interface P620AuditPanelProps {
  audit: WorkspaceAudit | null;
  onRunAudit: () => void;
  isAuditing: boolean;
}

export const P620AuditPanel: React.FC<P620AuditPanelProps> = ({
  audit,
  onRunAudit,
  isAuditing,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Graph Audit</h3>
      <span style={styles.description}>
        Audits end-to-end entity relationships across User, Workspace, Space, Experiment, Reality, Model, Geometry, Timeline, and Collaboration.
      </span>

      <button
        onClick={onRunAudit}
        disabled={isAuditing}
        style={styles.primaryBtn}
      >
        {isAuditing ? 'Running Full Audit...' : 'Run Graph Audit'}
      </button>

      {audit && (
        <div style={styles.auditBox}>
          <div style={styles.row}>
            <span style={styles.label}>Audit ID:</span>
            <span style={styles.value}>{audit.auditId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>User Linkage:</span>
            <span style={styles.statusOk}>{audit.graphValidation.isUserLinked ? 'VERIFIED' : 'FAILED'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Spaces Linkage:</span>
            <span style={styles.statusOk}>{audit.graphValidation.areSpacesLinked ? 'VERIFIED' : 'FAILED'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Experiments Linkage:</span>
            <span style={styles.statusOk}>{audit.graphValidation.areExperimentsLinked ? 'VERIFIED' : 'FAILED'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Geometry Integrity:</span>
            <span style={styles.statusOk}>{audit.graphValidation.areGeometriesLinked ? 'VERIFIED' : 'FAILED'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Audit Checksum:</span>
            <span style={styles.checksum}>{audit.auditChecksum}</span>
          </div>
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
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
  },
  description: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  primaryBtn: {
    background: '#00E5FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  auditBox: {
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
    color: '#9E9E9E',
  },
  value: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  statusOk: {
    color: '#81C784',
    fontWeight: 600,
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
