/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: State & Asset Discovery Feed Panel
 */

import React from 'react';
import { DiscoveryState } from '../types';

export interface P621DiscoveryPanelProps {
  discovery: DiscoveryState | null;
}

export const P621DiscoveryPanel: React.FC<P621DiscoveryPanelProps> = ({ discovery }) => {
  if (!discovery) {
    return (
      <div style={styles.emptyPanel}>
        <span style={styles.emptyText}>Discovery feed idle.</span>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Workspace State Discovery</h4>

      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Recent Entities</span>
          <span style={styles.cardCount}>{discovery.recentResults.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Saved States</span>
          <span style={styles.cardCount}>{discovery.savedStates.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Versions</span>
          <span style={styles.cardCount}>{discovery.versions.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Checkpoints</span>
          <span style={styles.cardCount}>{discovery.checkpoints.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Shared Spaces</span>
          <span style={styles.cardCount}>{discovery.sharedSpaces.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>3D Assets</span>
          <span style={styles.cardCount}>{discovery.assets.length}</span>
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
  emptyPanel: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 24,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8A8F9E',
    fontSize: 12,
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
    gap: 8,
  },
  card: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    color: '#8A8F9E',
  },
  cardCount: {
    fontSize: 16,
    fontWeight: 700,
    color: '#00E5FF',
  },
};
