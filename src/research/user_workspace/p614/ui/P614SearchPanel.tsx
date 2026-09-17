/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Search Controls Panel
 */

import React from 'react';
import { SearchScope, EntityType, SearchSortField, SearchSortOrder } from '../types';

export interface P614SearchPanelProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  selectedEntityType?: EntityType;
  onEntityTypeChange: (type?: EntityType) => void;
  selectedCertainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  onCertaintyChange: (certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN') => void;
  sortField: SearchSortField;
  onSortFieldChange: (field: SearchSortField) => void;
  sortOrder: SearchSortOrder;
  onSortOrderChange: (order: SearchSortOrder) => void;
  onExecuteSearch: () => void;
  onClearFilters: () => void;
  resultCount: number;
}

export const P614SearchPanel: React.FC<P614SearchPanelProps> = ({
  searchText,
  onSearchTextChange,
  scope,
  onScopeChange,
  selectedEntityType,
  onEntityTypeChange,
  selectedCertainty,
  onCertaintyChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  onExecuteSearch,
  onClearFilters,
  resultCount,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Search</h3>

      <div style={styles.row}>
        <input
          type="text"
          placeholder="Search by ID, name, tag, checksum..."
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
          style={styles.input}
        />
        <button onClick={onExecuteSearch} style={styles.primaryBtn}>
          Search
        </button>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Scope:</label>
        <select
          value={scope}
          onChange={(e) => onScopeChange(e.target.value as SearchScope)}
          style={styles.select}
        >
          <option value="ALL">All Entities</option>
          <option value="SPACES">Spaces</option>
          <option value="EXPERIMENTS">Experiments</option>
          <option value="STATES">States & Versions</option>
          <option value="GEOMETRY">Geometry & Meshes</option>
          <option value="MODELS">Model Objects</option>
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Entity Type:</label>
        <select
          value={selectedEntityType ?? ''}
          onChange={(e) => onEntityTypeChange(e.target.value ? (e.target.value as EntityType) : undefined)}
          style={styles.select}
        >
          <option value="">Any Type</option>
          <option value="SPACE">Space</option>
          <option value="EXPERIMENT">Experiment</option>
          <option value="SAVED_STATE">Saved State</option>
          <option value="VERSION">Version</option>
          <option value="TIMELINE_EVENT">Timeline Event</option>
          <option value="MODEL_OBJECT">Model Object</option>
          <option value="GEOMETRY_OBJECT">Geometry Object</option>
          <option value="CURVE">Curve</option>
          <option value="SURFACE">Surface</option>
          <option value="SOLID">Solid</option>
          <option value="MESH">Mesh</option>
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Certainty:</label>
        <select
          value={selectedCertainty ?? ''}
          onChange={(e) =>
            onCertaintyChange(e.target.value ? (e.target.value as any) : undefined)
          }
          style={styles.select}
        >
          <option value="">Any Certainty</option>
          <option value="EXACT">EXACT</option>
          <option value="CONSTRAINED">CONSTRAINED</option>
          <option value="AMBIGUOUS">AMBIGUOUS</option>
          <option value="UNKNOWN">UNKNOWN</option>
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Sort By:</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value as SearchSortField)}
            style={{ ...styles.select, flex: 2 }}
          >
            <option value="RELEVANCE">Relevance</option>
            <option value="NAME">Name / Title</option>
            <option value="TYPE">Entity Type</option>
            <option value="CREATED_AT">Creation Time</option>
            <option value="UPDATED_AT">Update Time</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SearchSortOrder)}
            style={{ ...styles.select, flex: 1 }}
          >
            <option value="DESC">DESC</option>
            <option value="ASC">ASC</option>
          </select>
        </div>
      </div>

      <div style={styles.footerRow}>
        <button onClick={onClearFilters} style={styles.secondaryBtn}>
          Clear Filters
        </button>
        <span style={styles.resultCountBadge}>Matches: {resultCount}</span>
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
  row: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    background: '#1E202F',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '8px 10px',
    color: '#FFF',
    fontSize: 13,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  select: {
    background: '#1E202F',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#FFF',
    fontSize: 12,
  },
  primaryBtn: {
    background: '#00B0FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: 'transparent',
    color: '#90CAF9',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resultCountBadge: {
    fontSize: 12,
    color: '#81C784',
    fontWeight: 600,
  },
};
