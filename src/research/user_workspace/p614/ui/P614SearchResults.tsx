/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Search Results List Component
 */

import React from 'react';
import { SearchResult } from '../types';

export interface P614SearchResultsProps {
  results: readonly SearchResult[];
  selectedEntityId?: string;
  onSelectResult: (result: SearchResult) => void;
}

export const P614SearchResults: React.FC<P614SearchResultsProps> = ({
  results,
  selectedEntityId,
  onSelectResult,
}) => {
  if (results.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <span style={styles.emptyText}>No matching authorized workspace entities found.</span>
      </div>
    );
  }

  return (
    <div style={styles.listContainer}>
      {results.map((r) => {
        const isSelected = r.entity.entityId === selectedEntityId;
        return (
          <div
            key={r.resultId}
            onClick={() => onSelectResult(r)}
            style={{
              ...styles.card,
              borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
              background: isSelected ? '#1F2438' : '#141624',
            }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.typeBadge}>{r.entity.entityType}</span>
              <span style={styles.title}>{r.entity.title || r.entity.name}</span>
              <span style={styles.scoreBadge}>Score: {r.score}</span>
            </div>

            <div style={styles.cardMeta}>
              <span style={styles.metaItem}>ID: {r.entity.entityId}</span>
              {r.entity.spaceId && (
                <span style={styles.metaItem}>Space: {r.entity.spaceId}</span>
              )}
              {r.entity.experimentId && (
                <span style={styles.metaItem}>Exp: {r.entity.experimentId}</span>
              )}
              {r.entity.versionId && (
                <span style={styles.metaItem}>Ver: {r.entity.versionId}</span>
              )}
            </div>

            <div style={styles.cardFooter}>
              <span style={styles.accessBadge}>Access: {r.entity.accessLevel}</span>
              {r.entity.certainty && (
                <span style={styles.certaintyBadge}>Certainty: {r.entity.certainty}</span>
              )}
              {r.entity.checksum && (
                <span style={styles.checksumText}>CS: {r.entity.checksum}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    maxHeight: 520,
    paddingRight: 4,
  },
  emptyContainer: {
    padding: 32,
    textAlign: 'center',
    background: '#141624',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
  },
  emptyText: {
    color: '#8A8F9E',
    fontSize: 13,
  },
  card: {
    padding: 12,
    borderRadius: 6,
    border: '1px solid #2A2D3E',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    fontSize: 10,
    background: '#0D47A1',
    color: '#90CAF9',
    padding: '2px 6px',
    borderRadius: 3,
    fontWeight: 600,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
    flex: 1,
  },
  scoreBadge: {
    fontSize: 10,
    color: '#FFD54F',
    fontWeight: 600,
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 11,
    color: '#9E9E9E',
  },
  metaItem: {
    background: '#1E202F',
    padding: '1px 5px',
    borderRadius: 3,
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    marginTop: 2,
  },
  accessBadge: {
    color: '#A5D6A7',
  },
  certaintyBadge: {
    color: '#CE93D8',
  },
  checksumText: {
    color: '#757575',
    marginLeft: 'auto',
    fontFamily: 'monospace',
  },
};
