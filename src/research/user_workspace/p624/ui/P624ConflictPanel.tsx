/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Conflict Detection & Resolution Panel
 */

import React from 'react';
import { ImportConflict } from '../types';

export interface P624ConflictPanelProps {
  conflicts: readonly ImportConflict[];
}

export const P624ConflictPanel: React.FC<P624ConflictPanelProps> = ({ conflicts }) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Collision & Conflict Monitor</h4>

      {conflicts.length === 0 ? (
        <div style={styles.cleanBox}>
          <span style={{ color: '#81C784', fontWeight: 600 }}>NO CONFLICTS DETECTED</span>
          <span style={{ fontSize: 11, color: '#8A8F9E' }}>Package is clean and ready for seamless import.</span>
        </div>
      ) : (
        <div style={styles.list}>
          {conflicts.map((c) => (
            <div key={c.conflictId} style={styles.card}>
              <div style={styles.headerRow}>
                <span style={styles.typeBadge}>{c.conflictType}</span>
                <span style={styles.targetId}>{c.entityId}</span>
              </div>
              <span style={styles.desc}>{c.description}</span>
              <div style={styles.actionRow}>
                <span>Strategy: <strong style={{ color: '#00E5FF' }}>{c.suggestedResolution}</strong></span>
              </div>
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
  cleanBox: {
    background: '#141622',
    borderRadius: 6,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 220,
    overflowY: 'auto',
  },
  card: {
    background: '#181A28',
    border: '1px solid #FF8A80',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    background: '#B71C1C',
    color: '#FFCDD2',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  targetId: {
    color: '#90CAF9',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  desc: {
    fontSize: 11,
    color: '#E0E0E0',
  },
  actionRow: {
    fontSize: 10,
    color: '#8A8F9E',
    borderTop: '1px solid #2A2D3E',
    paddingTop: 4,
  },
};
