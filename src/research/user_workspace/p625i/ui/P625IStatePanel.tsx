/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Current Workspace State Panel
 */

import React from 'react';
import { LiveSpaceState } from '../types';

export interface P625IStatePanelProps {
  activeSpace: LiveSpaceState | null;
  selectedObjectId: string | null;
  onModifyCoordinates: (coords: [number, number, number]) => void;
  onSelectObject: (objectId: string | null) => void;
}

export const P625IStatePanel: React.FC<P625IStatePanelProps> = ({
  activeSpace,
  selectedObjectId,
  onModifyCoordinates,
  onSelectObject,
}) => {
  if (!activeSpace) {
    return (
      <div style={styles.emptyPanel}>
        <span style={styles.emptyText}>No active space selected.</span>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Current Space State: {activeSpace.name}</h4>

      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Observer:</span>
          <span style={styles.cardVal}>{activeSpace.currentObserver}</span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Coordinates:</span>
          <span style={styles.coordVal}>[{activeSpace.currentCoordinates.join(', ')}]</span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Dimensions:</span>
          <span style={styles.cardVal}>[{activeSpace.currentDimensions.join('x')}]</span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Selected Object:</span>
          <span style={styles.cardVal}>{selectedObjectId ?? 'NONE'}</span>
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={() => {
            const [x, y, z] = activeSpace.currentCoordinates;
            onModifyCoordinates([x + 1, y, z]);
          }}
          style={styles.actionBtn}
        >
          Nudge X (+1)
        </button>
        <button
          onClick={() => {
            const [x, y, z] = activeSpace.currentCoordinates;
            onModifyCoordinates([x, y + 1, z]);
          }}
          style={styles.actionBtn}
        >
          Nudge Y (+1)
        </button>
        <button
          onClick={() => {
            const [x, y, z] = activeSpace.currentCoordinates;
            onModifyCoordinates([x, y, z + 1]);
          }}
          style={styles.actionBtn}
        >
          Nudge Z (+1)
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
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  card: {
    background: '#181A28',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  cardLabel: {
    fontSize: 10,
    color: '#8A8F9E',
  },
  cardVal: {
    fontSize: 12,
    color: '#FFF',
  },
  coordVal: {
    fontSize: 12,
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  controls: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    background: '#1E202F',
    color: '#00E5FF',
    border: '1px solid #00E5FF',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
    flex: 1,
  },
};
