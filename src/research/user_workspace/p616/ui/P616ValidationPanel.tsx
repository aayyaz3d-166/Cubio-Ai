/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Validation & Rollback Monitor Panel
 */

import React from 'react';
import { RecoveryValidationStatus } from '../types';

export interface P616ValidationPanelProps {
  validationStatus: RecoveryValidationStatus | null;
  causalityPassed: boolean;
  rollbackChecksum: string | null;
}

export const P616ValidationPanel: React.FC<P616ValidationPanelProps> = ({
  validationStatus,
  causalityPassed,
  rollbackChecksum,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Recovery Validation & Rollback Monitor</h4>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.label}>Validation Status:</span>
          <span
            style={{
              ...styles.badge,
              background:
                validationStatus === 'RECOVERY_VALID' || validationStatus === 'RESTORE_READY'
                  ? '#1B5E20'
                  : validationStatus === 'CORRUPTED'
                  ? '#B71C1C'
                  : '#37474F',
              color:
                validationStatus === 'RECOVERY_VALID' || validationStatus === 'RESTORE_READY'
                  ? '#A5D6A7'
                  : '#EF9A9A',
            }}
          >
            {validationStatus ?? 'IDLE'}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Reality Invariance:</span>
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

        <div style={styles.item}>
          <span style={styles.label}>Rollback Target Match:</span>
          <span style={styles.rollbackText}>
            {rollbackChecksum ? `EXACT (${rollbackChecksum})` : 'NO ROLLBACK PENDING'}
          </span>
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
  badge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  rollbackText: {
    color: '#81C784',
    fontSize: 11,
    fontFamily: 'monospace',
  },
};
