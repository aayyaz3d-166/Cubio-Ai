/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Workspace Live Telemetry & Causality Monitor
 */

import React from 'react';
import { WorkspaceActivationReport } from '../types';

export interface P625IStatusPanelProps {
  report: WorkspaceActivationReport;
  currentChecksum: string;
}

export const P625IStatusPanel: React.FC<P625IStatusPanelProps> = ({
  report,
  currentChecksum,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Live Workspace Telemetry</h4>

      <div style={styles.grid}>
        <div style={styles.row}>
          <span style={styles.label}>Active Space:</span>
          <span style={styles.val}>{report.activeSpaceId ?? 'NONE'}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Integration Status:</span>
          <span style={{ color: report.isLiveActivated ? '#81C784' : '#FF8A80', fontWeight: 600 }}>
            {report.isLiveActivated ? 'LIVE_ACTIVATED' : 'INTEGRATION_BLOCKED'}
          </span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Reality Invariance:</span>
          <span style={{ color: report.realityInvariant ? '#81C784' : '#FF8A80', fontWeight: 600 }}>
            {report.realityInvariant ? 'INVARIANTS PRESERVED' : 'BREACH'}
          </span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Current State CS:</span>
          <span style={styles.checksum}>{currentChecksum}</span>
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
  grid: {
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
  val: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
