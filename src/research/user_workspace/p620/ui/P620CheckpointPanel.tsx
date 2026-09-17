/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Recovery Checkpoints Panel
 */

import React from 'react';
import { RecoveryCheckpoint } from '../types';

export interface P620CheckpointPanelProps {
  checkpoints: readonly RecoveryCheckpoint[];
  selectedCheckpointId: string | null;
  onSelectCheckpoint: (chk: RecoveryCheckpoint) => void;
  onRestoreCheckpoint: (chk: RecoveryCheckpoint) => void;
  onCreateCheckpoint: () => void;
  isRestoring: boolean;
}

export const P620CheckpointPanel: React.FC<P620CheckpointPanelProps> = ({
  checkpoints,
  selectedCheckpointId,
  onSelectCheckpoint,
  onRestoreCheckpoint,
  onCreateCheckpoint,
  isRestoring,
}) => {
  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>Recovery Checkpoints</h3>
        <button onClick={onCreateCheckpoint} style={styles.createBtn}>
          + Create Checkpoint
        </button>
      </div>

      <span style={styles.description}>
        Deterministic recovery checkpoints preserving Space identity, Reality authority, and canonical [5,3,6] geometry.
      </span>

      {checkpoints.length === 0 ? (
        <div style={styles.emptyBox}>No checkpoints captured yet.</div>
      ) : (
        <div style={styles.list}>
          {checkpoints.map((chk) => {
            const isSelected = chk.checkpointId === selectedCheckpointId;
            return (
              <div
                key={chk.checkpointId}
                onClick={() => onSelectCheckpoint(chk)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
                  background: isSelected ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.chkId}>{chk.checkpointId}</span>
                  <span style={styles.lockBadge}>IMMUTABLE</span>
                </div>

                <div style={styles.metaRow}>
                  <span>Reality CS: <span style={styles.checksum}>{chk.realityChecksum}</span></span>
                  <span>Coords: [{chk.canonicalCoordinates.join(',')}]</span>
                </div>

                <div style={styles.actionRow}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreCheckpoint(chk);
                    }}
                    disabled={isRestoring}
                    style={styles.restoreBtn}
                  >
                    Restore Checkpoint
                  </button>
                </div>
              </div>
            );
          })}
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
  },
  createBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  description: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  emptyBox: {
    padding: 24,
    textAlign: 'center',
    color: '#616161',
    fontSize: 12,
    background: '#141622',
    borderRadius: 6,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 260,
    overflowY: 'auto',
  },
  card: {
    border: '1px solid #2A2D3E',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chkId: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  lockBadge: {
    background: '#1B5E20',
    color: '#A5D6A7',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#9E9E9E',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  restoreBtn: {
    background: '#388E3C',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
