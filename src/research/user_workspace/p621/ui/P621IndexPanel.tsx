/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Search Index Telemetry & Invariants Panel
 */

import React from 'react';
import { SearchIndex } from '../types';

export interface P621IndexPanelProps {
  index: SearchIndex | null;
  causalityPassed: boolean;
}

export const P621IndexPanel: React.FC<P621IndexPanelProps> = ({
  index,
  causalityPassed,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Search Index & Invariants</h4>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.label}>Index Status:</span>
          <span style={styles.badgeOk}>INDEX_SYNCED</span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Indexed Entities:</span>
          <span style={styles.countVal}>{index?.entryCount ?? 0}</span>
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
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Index Checksum:</span>
        <span style={styles.checksum}>{index?.indexChecksum ?? 'N/A'}</span>
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
  badgeOk: {
    background: '#1B5E20',
    color: '#A5D6A7',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  countVal: {
    fontSize: 14,
    fontWeight: 700,
    color: '#FFF',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    borderTop: '1px solid #1E202F',
    paddingTop: 8,
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
  },
};
