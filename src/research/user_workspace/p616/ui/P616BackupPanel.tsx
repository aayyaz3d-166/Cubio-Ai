/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Backup Controls Panel
 */

import React from 'react';
import { RecoveryScope } from '../types';

export interface P616BackupPanelProps {
  onTriggerBackup: (scope: RecoveryScope) => void;
  isBackingUp: boolean;
}

export const P616BackupPanel: React.FC<P616BackupPanelProps> = ({
  onTriggerBackup,
  isBackingUp,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Backup</h3>
      <span style={styles.description}>
        Create immutable, deterministic recovery points preserving exact geometry, coordinates [5,3,6], and lineages.
      </span>

      <div style={styles.btnGrid}>
        <button
          onClick={() => onTriggerBackup('WORKSPACE')}
          disabled={isBackingUp}
          style={styles.primaryBtn}
        >
          {isBackingUp ? 'Creating...' : 'Full Workspace Backup'}
        </button>

        <button
          onClick={() => onTriggerBackup('SPACE')}
          disabled={isBackingUp}
          style={styles.secondaryBtn}
        >
          Space Backup
        </button>

        <button
          onClick={() => onTriggerBackup('EXPERIMENT')}
          disabled={isBackingUp}
          style={styles.secondaryBtn}
        >
          Experiment Backup
        </button>

        <button
          onClick={() => onTriggerBackup('SAVED_STATE')}
          disabled={isBackingUp}
          style={styles.secondaryBtn}
        >
          Saved State Backup
        </button>

        <button
          onClick={() => onTriggerBackup('GEOMETRY')}
          disabled={isBackingUp}
          style={styles.secondaryBtn}
        >
          Geometry Backup
        </button>
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
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
  },
  description: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  btnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  primaryBtn: {
    gridColumn: '1 / -1',
    background: '#00E5FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: '#1E202F',
    color: '#90CAF9',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 11,
    cursor: 'pointer',
  },
};
