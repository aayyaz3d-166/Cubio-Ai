/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Navigation & Target Action Panel
 */

import React from 'react';
import { SearchResult, SearchNavigationTarget } from '../types';

export interface P614NavigationPanelProps {
  selectedResult: SearchResult | null;
  navigationTarget: SearchNavigationTarget | null;
  onNavigate: (entityId: string) => void;
}

export const P614NavigationPanel: React.FC<P614NavigationPanelProps> = ({
  selectedResult,
  navigationTarget,
  onNavigate,
}) => {
  if (!selectedResult) {
    return (
      <div style={styles.panel}>
        <h4 style={styles.title}>Target Navigation</h4>
        <span style={styles.hint}>Select an entity from search results to inspect and navigate.</span>
      </div>
    );
  }

  const entity = selectedResult.entity;

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Navigation Target: {entity.title || entity.name}</h4>

      <div style={styles.detailsGrid}>
        <div style={styles.detailRow}>
          <span style={styles.label}>Entity ID:</span>
          <span style={styles.value}>{entity.entityId}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Type:</span>
          <span style={styles.value}>{entity.entityType}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Lineage:</span>
          <span style={styles.value}>{entity.lineageId}</span>
        </div>
        {entity.coordinates && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Coordinates:</span>
            <span style={styles.value}>[{entity.coordinates.join(', ')}]</span>
          </div>
        )}
      </div>

      <div style={styles.actionsContainer}>
        <button
          onClick={() => onNavigate(entity.entityId)}
          style={styles.navigateBtn}
        >
          Navigate to {entity.entityType}
        </button>
      </div>

      {navigationTarget && (
        <div style={styles.targetStatusBox}>
          <div style={styles.targetStatusRow}>
            <span style={styles.label}>Nav Status:</span>
            <span
              style={{
                ...styles.statusText,
                color:
                  navigationTarget.status === 'NAVIGATED'
                    ? '#81C784'
                    : '#E57373',
              }}
            >
              {navigationTarget.status}
            </span>
          </div>
          <div style={styles.targetStatusRow}>
            <span style={styles.label}>Nav ID:</span>
            <span style={styles.checksum}>{navigationTarget.navigationId}</span>
          </div>
          <div style={styles.targetStatusRow}>
            <span style={styles.label}>Checksum:</span>
            <span style={styles.checksum}>{navigationTarget.navigationChecksum}</span>
          </div>
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
  hint: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: '#181A28',
    padding: '4px 8px',
    borderRadius: 4,
  },
  label: {
    color: '#90CAF9',
  },
  value: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    marginTop: 4,
  },
  navigateBtn: {
    width: '100%',
    background: '#00E5FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '8px 12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  targetStatusBox: {
    background: '#181A28',
    border: '1px solid #2A2D3E',
    borderRadius: 4,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  targetStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  statusText: {
    fontWeight: 600,
  },
  checksum: {
    fontFamily: 'monospace',
    color: '#B0BEC5',
  },
};
