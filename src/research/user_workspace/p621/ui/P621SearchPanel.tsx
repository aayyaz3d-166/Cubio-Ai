/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Search Controls & Scope Selector Panel
 */

import React from 'react';
import { SearchScope } from '../types';

export interface P621SearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedScope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  onClearFilters: () => void;
  resultCount: number;
}

const SCOPES: SearchScope[] = [
  'ALL',
  'SPACES',
  'EXPERIMENTS',
  'SAVED_STATES',
  'VERSIONS',
  'CHECKPOINTS',
  'SHARED',
  'MODELS',
  'GEOMETRIES',
];

export const P621SearchPanel: React.FC<P621SearchPanelProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedScope,
  onScopeChange,
  onClearFilters,
  resultCount,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Search</h3>
      <span style={styles.description}>
        Observational search across authorized Spaces, Experiments, Checkpoints, States, Versions, and 3D Assets.
      </span>

      <input
        type="text"
        placeholder="Search by ID, name, or lineage..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        style={styles.input}
      />

      <div style={styles.scopeGrid}>
        {SCOPES.map((scope) => {
          const isSelected = selectedScope === scope;
          return (
            <button
              key={scope}
              onClick={() => onScopeChange(scope)}
              style={{
                ...styles.scopeBtn,
                background: isSelected ? '#00E5FF' : '#1E202F',
                color: isSelected ? '#000' : '#90CAF9',
                borderColor: isSelected ? '#00E5FF' : '#3B3F58',
              }}
            >
              {scope}
            </button>
          );
        })}
      </div>

      <div style={styles.footerRow}>
        <span style={styles.countText}>
          Results: <strong style={{ color: '#00E5FF' }}>{resultCount}</strong>
        </span>
        <button onClick={onClearFilters} style={styles.clearBtn}>
          Clear Filters
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
  input: {
    background: '#181A28',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#FFF',
    fontSize: 12,
    outline: 'none',
  },
  scopeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  scopeBtn: {
    border: '1px solid',
    borderRadius: 4,
    padding: '6px 4px',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  countText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  clearBtn: {
    background: '#2A2D3E',
    color: '#E0E0E0',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
};
