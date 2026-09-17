/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Search Results List Panel
 */

import React from 'react';
import { SearchResult } from '../types';

export interface P621ResultsPanelProps {
  results: readonly SearchResult[];
  selectedResultId: string | null;
  onSelectResult: (result: SearchResult) => void;
}

export const P621ResultsPanel: React.FC<P621ResultsPanelProps> = ({
  results,
  selectedResultId,
  onSelectResult,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Search Results</h4>

      {results.length === 0 ? (
        <div style={styles.emptyBox}>No matching authorized entities found.</div>
      ) : (
        <div style={styles.list}>
          {results.map((res) => {
            const isSelected = res.resultId === selectedResultId;
            return (
              <div
                key={res.resultId}
                onClick={() => onSelectResult(res)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
                  background: isSelected ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.resName}>{res.name}</span>
                  <span style={styles.typeBadge}>{res.resultType}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>ID: <span style={styles.idVal}>{res.sourceId}</span></span>
                  <span>Space: {res.spaceId}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>CS: <span style={styles.checksum}>{res.checksum}</span></span>
                  <span>Access: {res.accessLevel}</span>
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
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  emptyBox: {
    padding: 28,
    textAlign: 'center',
    color: '#757575',
    fontSize: 12,
    background: '#141622',
    borderRadius: 6,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 380,
    overflowY: 'auto',
  },
  card: {
    border: '1px solid #2A2D3E',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resName: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 12,
  },
  typeBadge: {
    background: '#263238',
    color: '#80CBC4',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#8A8F9E',
  },
  idVal: {
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
