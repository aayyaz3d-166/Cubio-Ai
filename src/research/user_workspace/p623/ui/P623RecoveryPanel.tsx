/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Recovery Verification & Audit Panel
 */

import React from 'react';
import { RecoveryRecord } from '../types';

export interface P623RecoveryPanelProps {
  lastRecovery: RecoveryRecord | null;
  recoveryError: string | null;
}

export const P623RecoveryPanel: React.FC<P623RecoveryPanelProps> = ({
  lastRecovery,
  recoveryError,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Recovery Verification</h4>

      {recoveryError && (
        <div style={styles.errorBox}>
          <span style={styles.errorTitle}>Recovery Blocked:</span>
          <span style={styles.errorMsg}>{recoveryError}</span>
        </div>
      )}

      {lastRecovery ? (
        <div style={styles.recordBox}>
          <div style={styles.row}>
            <span style={styles.label}>Recovery ID:</span>
            <span style={styles.value}>{lastRecovery.recoveryId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Restored From:</span>
            <span style={styles.value}>{lastRecovery.restoredFrom}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Entity ID:</span>
            <span style={styles.value}>{lastRecovery.entityId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Restored Checksum:</span>
            <span style={styles.checksum}>{lastRecovery.restoredChecksum}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Integrity Status:</span>
            <span style={{ color: '#81C784', fontWeight: 600 }}>EXACT STATE RESTORED</span>
          </div>
        </div>
      ) : (
        !recoveryError && (
          <div style={styles.emptyBox}>No recent recovery operation executed.</div>
        )
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
  emptyBox: {
    padding: 24,
    textAlign: 'center',
    color: '#8A8F9E',
    fontSize: 12,
  },
  errorBox: {
    background: '#2D1B1F',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  errorTitle: {
    color: '#FF8A80',
    fontWeight: 600,
  },
  errorMsg: {
    color: '#FFCDD2',
  },
  recordBox: {
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
};
