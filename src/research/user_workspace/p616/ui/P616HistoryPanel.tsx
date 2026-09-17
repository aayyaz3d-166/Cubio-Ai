/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery History Panel
 */

import React from 'react';
import { RecoveryHistoryEntry } from '../types';

export interface P616HistoryPanelProps {
  history: readonly RecoveryHistoryEntry[];
}

export const P616HistoryPanel: React.FC<P616HistoryPanelProps> = ({ history }) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Recovery History Log</h4>

      {history.length === 0 ? (
        <span style={styles.emptyText}>No recovery events recorded yet.</span>
      ) : (
        <div style={styles.list}>
          {history.map((h) => (
            <div key={h.entryId} style={styles.entry}>
              <div style={styles.entryHeader}>
                <span style={styles.eventType}>{h.eventType}</span>
                <span style={styles.pointId}>{h.recoveryPointId}</span>
              </div>
              <span style={styles.details}>{h.details}</span>
              <span style={styles.checksum}>CS: {h.entryChecksum}</span>
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
  emptyText: {
    color: '#8A8F9E',
    fontSize: 11,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 180,
    overflowY: 'auto',
  },
  entry: {
    background: '#181A28',
    borderRadius: 4,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 11,
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  eventType: {
    color: '#00E5FF',
    fontWeight: 600,
  },
  pointId: {
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  details: {
    color: '#E0E0E0',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
