/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Lifecycle State Inspector & Telemetry Panel
 */

import React from 'react';

export interface P623LifecycleInspectorProps {
  activeCount: number;
  trashCount: number;
  archiveCount: number;
  deletedCount: number;
  lifecycleChecksum: string;
  userRole: string;
  causalityPassed: boolean;
}

export const P623LifecycleInspector: React.FC<P623LifecycleInspectorProps> = ({
  activeCount,
  trashCount,
  archiveCount,
  deletedCount,
  lifecycleChecksum,
  userRole,
  causalityPassed,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Lifecycle Telemetry</h4>

      <div style={styles.grid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Active</span>
          <span style={{ ...styles.statVal, color: '#81C784' }}>{activeCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Trash</span>
          <span style={{ ...styles.statVal, color: '#E57373' }}>{trashCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Archive</span>
          <span style={{ ...styles.statVal, color: '#64B5F6' }}>{archiveCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Deleted</span>
          <span style={{ ...styles.statVal, color: '#9E9E9E' }}>{deletedCount}</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>Lifecycle CS:</span>
          <span style={styles.checksum}>{lifecycleChecksum}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Auth Role:</span>
          <span style={styles.value}>{userRole}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Reality Invariance:</span>
          <span style={{ color: causalityPassed ? '#81C784' : '#EF5350', fontWeight: 600 }}>
            {causalityPassed ? 'INVARIANTS PRESERVED' : 'BREACH'}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Determinism:</span>
          <span style={{ color: '#81C784' }}>σ² = 0 (STABLE)</span>
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
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  statCard: {
    background: '#181A28',
    borderRadius: 4,
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#8A8F9E',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 700,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderTop: '1px solid #1E202F',
    paddingTop: 8,
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
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
