/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Point List & Action Panel
 */

import React from 'react';
import { RecoveryPoint } from '../types';

export interface P616RecoveryPanelProps {
  recoveryPoints: readonly RecoveryPoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: RecoveryPoint) => void;
  onRestorePoint: (point: RecoveryPoint) => void;
  onValidatePoint: (point: RecoveryPoint) => void;
  isRestoring: boolean;
}

export const P616RecoveryPanel: React.FC<P616RecoveryPanelProps> = ({
  recoveryPoints,
  selectedPointId,
  onSelectPoint,
  onRestorePoint,
  onValidatePoint,
  isRestoring,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Immutable Recovery Points</h3>
      <span style={styles.description}>
        Frozen milestone states available for read-only preview and transactional restoration.
      </span>

      {recoveryPoints.length === 0 ? (
        <div style={styles.emptyBox}>No recovery points created yet.</div>
      ) : (
        <div style={styles.list}>
          {recoveryPoints.map((pt) => {
            const isSelected = pt.recoveryPointId === selectedPointId;
            return (
              <div
                key={pt.recoveryPointId}
                onClick={() => onSelectPoint(pt)}
                style={{
                  ...styles.pointCard,
                  borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
                  background: isSelected ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.pointId}>{pt.recoveryPointId}</span>
                  <span style={styles.scopeBadge}>{pt.scope}</span>
                </div>

                <div style={styles.cardMeta}>
                  <span>CS: <span style={styles.checksum}>{pt.pointChecksum}</span></span>
                  <span>Entities: {pt.entityCounts.spaces + pt.entityCounts.experiments + pt.entityCounts.geometries}</span>
                </div>

                <div style={styles.actionRow}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPoint(pt);
                    }}
                    style={styles.actionBtn}
                  >
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onValidatePoint(pt);
                    }}
                    style={styles.actionBtn}
                  >
                    Validate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestorePoint(pt);
                    }}
                    disabled={isRestoring}
                    style={styles.restoreBtn}
                  >
                    Restore
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
    maxHeight: 280,
    overflowY: 'auto',
  },
  pointCard: {
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
  pointId: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  scopeBadge: {
    background: '#263238',
    color: '#80CBC4',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  cardMeta: {
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
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    background: '#1E202F',
    color: '#90CAF9',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
  restoreBtn: {
    background: '#2E7D32',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
